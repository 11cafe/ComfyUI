class ComfyApi extends EventTarget {
	#registered = new Set();

	constructor() {
		super();
		this.api_host = location.host;
		this.api_base = location.pathname.split('/').slice(0, -1).join('/');
		this.initialClientId = sessionStorage.getItem("clientId");
	}

	apiURL(route) {
		return this.api_base + route;
	}

	fetchApi(route, options) {
		if (!options) {
			options = {};
		}
		if (!options.headers) {
			options.headers = {};
		}
		options.headers["Comfy-User"] = this.user;
		return fetch(this.apiURL(route), options);
	}

	addEventListener(type, callback, options) {
		super.addEventListener(type, callback, options);
		this.#registered.add(type);
	}

	/**
	 * Poll status  for colab and other things that don't support websockets.
	 */
	#pollQueue() {
		setInterval(async () => {
			try {
				const resp = await this.fetchApi("/prompt");
				const status = await resp.json();
				this.dispatchEvent(new CustomEvent("status", { detail: status }));
			} catch (error) {
				this.dispatchEvent(new CustomEvent("status", { detail: null }));
			}
		}, 1000);
	}

	/**
	 * Creates and connects a WebSocket for realtime updates
	 * @param {boolean} isReconnect If the socket is connection is a reconnect attempt
	 */
	#createSocket(isReconnect) {
		if (this.socket) {
			return;
		}

		let opened = false;
		let existingSession = window.name;
		if (existingSession) {
			existingSession = "?clientId=" + existingSession;
		}
		this.socket = new WebSocket(
			`ws${window.location.protocol === "https:" ? "s" : ""}://${this.api_host}${this.api_base}/ws${existingSession}`
		);
		this.socket.binaryType = "arraybuffer";

		this.socket.addEventListener("open", () => {
			opened = true;
			if (isReconnect) {
				this.dispatchEvent(new CustomEvent("reconnected"));
			}
		});

		this.socket.addEventListener("error", () => {
			if (this.socket) this.socket.close();
			if (!isReconnect && !opened) {
				this.#pollQueue();
			}
		});

		this.socket.addEventListener("close", () => {
			setTimeout(() => {
				this.socket = null;
				this.#createSocket(true);
			}, 300);
			if (opened) {
				this.dispatchEvent(new CustomEvent("status", { detail: null }));
				this.dispatchEvent(new CustomEvent("reconnecting"));
			}
		});

		this.socket.addEventListener("message", (event) => {
			try {
				if (event.data instanceof ArrayBuffer) {
					const view = new DataView(event.data);
					const eventType = view.getUint32(0);
					const buffer = event.data.slice(4);
					switch (eventType) {
					case 1:
						const view2 = new DataView(event.data);
						const imageType = view2.getUint32(0)
						let imageMime
						switch (imageType) {
							case 1:
							default:
								imageMime = "image/jpeg";
								break;
							case 2:
								imageMime = "image/png"
						}
						const imageBlob = new Blob([buffer.slice(4)], { type: imageMime });
						this.dispatchEvent(new CustomEvent("b_preview", { detail: imageBlob }));
						break;
					default:
						throw new Error(`Unknown binary websocket message of type ${eventType}`);
					}
				}
				else {
				    const msg = JSON.parse(event.data);
				    switch (msg.type) {
					    case "status":
						    if (msg.data.sid) {
							    this.clientId = msg.data.sid;
							    window.name = this.clientId; // use window name so it isnt reused when duplicating tabs
								sessionStorage.setItem("clientId", this.clientId); // store in session storage so duplicate tab can load correct workflow
						    }
						    this.dispatchEvent(new CustomEvent("status", { detail: msg.data.status }));
						    break;
					    case "progress":
						    this.dispatchEvent(new CustomEvent("progress", { detail: msg.data }));
						    break;
					    case "executing":
						    this.dispatchEvent(new CustomEvent("executing", { detail: msg.data.node }));
						    break;
					    case "executed":
						    this.dispatchEvent(new CustomEvent("executed", { detail: msg.data }));
						    break;
					    case "execution_start":
						    this.dispatchEvent(new CustomEvent("execution_start", { detail: msg.data }));
						    break;
					    case "execution_error":
						    this.dispatchEvent(new CustomEvent("execution_error", { detail: msg.data }));
						    break;
					    case "execution_cached":
						    this.dispatchEvent(new CustomEvent("execution_cached", { detail: msg.data }));
						    break;
					    default:
						    if (this.#registered.has(msg.type)) {
							    this.dispatchEvent(new CustomEvent(msg.type, { detail: msg.data }));
						    } else {
							    throw new Error(`Unknown message type ${msg.type}`);
						    }
				    }
				}
			} catch (error) {
				console.warn("Unhandled message:", event.data, error);
			}
		});
	}

	/**
	 * Initialises sockets and realtime updates
	 */
	init() {
		this.#createSocket();
	}

	/**
	 * Gets a list of extension urls
	 * @returns An array of script urls to import
	 */
	async getExtensions() {
		const resp = await this.fetchApi("/extensions", { cache: "no-store" });
		return await resp.json();
	}

	/**
	 * Gets a list of embedding names
	 * @returns An array of script urls to import
	 */
	async getEmbeddings() {
		const resp = await this.fetchApi("/embeddings", { cache: "no-store" });
		return await resp.json();
	}

	/**
	 * Loads node object definitions for the graph
	 * @returns The node definitions
	 */
	async getNodeDefs() {
		const resp = await this.fetchApi("/object_info", { cache: "no-store" });
		return await resp.json();
	}

	/**
	 *
	 * @param {number} number The index at which to queue the prompt, passing -1 will insert the prompt at the front of the queue
	 * @param {object} prompt The prompt data to queue
	 */
	async queuePrompt(number, { output, workflow }) {
		const body = {
			client_id: this.clientId,
			prompt: output,
			extra_data: { extra_pnginfo: { workflow } },
		};

		if (number === -1) {
			body.front = true;
		} else if (number != 0) {
			body.number = number;
		}

		const res = await this.fetchApi("/prompt", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (res.status !== 200) {
			throw {
				response: await res.json(),
			};
		}

		return await res.json();
	}

	/**
	 * Loads a list of items (queue or history)
	 * @param {string} type The type of items to load, queue or history
	 * @returns The items of the specified type grouped by their status
	 */
	async getItems(type) {
		if (type === "queue") {
			return this.getQueue();
		}
		return this.getHistory();
	}

	/**
	 * Gets the current state of the queue
	 * @returns The currently running and queued items
	 */
	async getQueue() {
		try {
			const res = await this.fetchApi("/queue");
			const data = await res.json();
			return {
				// Running action uses a different endpoint for cancelling
				Running: data.queue_running.map((prompt) => ({
					prompt,
					remove: { name: "Cancel", cb: () => api.interrupt() },
				})),
				Pending: data.queue_pending.map((prompt) => ({ prompt })),
			};
		} catch (error) {
			console.error(error);
			return { Running: [], Pending: [] };
		}
	}

	/**
	 * Gets the prompt execution history
	 * @returns Prompt history including node outputs
	 */
	async getHistory(max_items=200) {
		try {
			const res = await this.fetchApi(`/history?max_items=${max_items}`);
			return { History: Object.values(await res.json()) };
		} catch (error) {
			console.error(error);
			return { History: [] };
		}
	}

	/**
	 * Gets system & device stats
	 * @returns System stats such as python version, OS, per device info
	 */
	async getSystemStats() {
		const res = await this.fetchApi("/system_stats");
		return await res.json();
	}

	/**
	 * Sends a POST request to the API
	 * @param {*} type The endpoint to post to
	 * @param {*} body Optional POST data
	 */
	async #postItem(type, body) {
		try {
			await this.fetchApi("/" + type, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: body ? JSON.stringify(body) : undefined,
			});
		} catch (error) {
			console.error(error);
		}
	}

	/**
	 * Deletes an item from the specified list
	 * @param {string} type The type of item to delete, queue or history
	 * @param {number} id The id of the item to delete
	 */
	async deleteItem(type, id) {
		await this.#postItem(type, { delete: [id] });
	}

	/**
	 * Clears the specified list
	 * @param {string} type The type of list to clear, queue or history
	 */
	async clearItems(type) {
		await this.#postItem(type, { clear: true });
	}

	/**
	 * Interrupts the execution of the running prompt
	 */
	async interrupt() {
		await this.#postItem("interrupt", null);
	}

	/**
	 * Gets user configuration data and where data should be stored
	 * @returns { Promise<{ storage: "server" | "browser", users?: Promise<string, unknown>, migrated?: boolean }> }
	 */
	async getUserConfig() {
		return (await this.fetchApi("/users")).json();
	}

	/**
	 * Creates a new user
	 * @param { string } username
	 * @returns The fetch response
	 */
	createUser(username) {
    return { status: 200, json: async () => ({}) };
		return this.fetchApi("/users", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username }),
		});
	}

	/**
	 * Gets all setting values for the current user
	 * @returns { Promise<string, unknown> } A dictionary of id -> value
	 */
	async getSettings() {
    return {};
		return (await this.fetchApi("/settings")).json();
	}

	/**
	 * Gets a setting for the current user
	 * @param { string } id The id of the setting to fetch
	 * @returns { Promise<unknown> } The setting value
	 */
	async getSetting(id) {
    return null;
		return (await this.fetchApi(`/settings/${encodeURIComponent(id)}`)).json();
	}

	/**
	 * Stores a dictionary of settings for the current user
	 * @param { Record<string, unknown> } settings Dictionary of setting id -> value to save
	 * @returns { Promise<void> }
	 */
	async storeSettings(settings) {
		return this.fetchApi(`/settings`, {
			method: "POST",
			body: JSON.stringify(settings)
		});
	}

	/**
	 * Stores a setting for the current user
	 * @param { string } id The id of the setting to update
	 * @param { unknown } value The value of the setting
	 * @returns { Promise<void> }
	 */
	async storeSetting(id, value) {
		return this.fetchApi(`/settings/${encodeURIComponent(id)}`, {
			method: "POST",
			body: JSON.stringify(value)
		});
	}

	/**
	 * Gets a user data file for the current user
	 * @param { string } file The name of the userdata file to load
	 * @param { RequestInit } [options]
	 * @returns { Promise<Response> } The fetch response object
	 */
	async getUserData(file, options) {
		return this.fetchApi(`/userdata/${encodeURIComponent(file)}`, options);
	}

	/**
	 * Stores a user data file for the current user
	 * @param { string } file The name of the userdata file to save
	 * @param { unknown } data The data to save to the file
	 * @param { RequestInit & { overwrite?: boolean, stringify?: boolean, throwOnError?: boolean } } [options]
	 * @returns { Promise<Response> }
	 */
	async storeUserData(file, data, options = { overwrite: true, stringify: true, throwOnError: true }) {
		const resp = await this.fetchApi(`/userdata/${encodeURIComponent(file)}?overwrite=${options?.overwrite}`, {
			method: "POST",
			body: options?.stringify ? JSON.stringify(data) : data,
			...options,
		});
		if (resp.status !== 200 && options?.throwOnError !== false) {
			throw new Error(`Error storing user data file '${file}': ${resp.status} ${(await resp).statusText}`);
		}
		return resp;
	}

	/**
	 * Deletes a user data file for the current user
	 * @param { string } file The name of the userdata file to delete
	 */
	async deleteUserData(file) {
		const resp = await this.fetchApi(`/userdata/${encodeURIComponent(file)}`, {
			method: "DELETE",
		});
		if (resp.status !== 204) {
			throw new Error(`Error removing user data file '${file}': ${resp.status} ${(resp).statusText}`);
		}
	}

	/**
	 * Move a user data file for the current user
	 * @param { string } source The userdata file to move
	 * @param { string } dest The destination for the file
	 */
	async moveUserData(source, dest, options = { overwrite: false }) {
		const resp = await this.fetchApi(`/userdata/${encodeURIComponent(source)}/move/${encodeURIComponent(dest)}?overwrite=${options?.overwrite}`, {
			method: "POST",
		});
		return resp;
	}

	/**
	 * @overload
	 * Lists user data files for the current user
	 * @param { string } dir The directory in which to list files
	 * @param { boolean } [recurse] If the listing should be recursive
	 * @param { true } [split] If the paths should be split based on the os path separator
	 * @returns { Promise<string[][]>> } The list of split file paths in the format [fullPath, ...splitPath]
	 */
	/**
	 * @overload
	 * Lists user data files for the current user
	 * @param { string } dir The directory in which to list files
	 * @param { boolean } [recurse] If the listing should be recursive
	 * @param { false | undefined } [split] If the paths should be split based on the os path separator
	 * @returns { Promise<string[]>> } The list of files
	 */
	async listUserData(dir, recurse, split) {
		const resp = await this.fetchApi(
			`/userdata?${new URLSearchParams({
				recurse,
				dir,
				split,
			})}`
		);
		if (resp.status === 404) return [];
		if (resp.status !== 200) {
			throw new Error(`Error getting user data list '${dir}': ${resp.status} ${resp.statusText}`);
		}
		return resp.json();
	}
}

import { app } from "./app.js";
import { ComfyWorkflow } from "./workflows.js";
import {serverNodeDefs} from '/serverNodeDefs.js'
export class ServerlessComfyApi extends ComfyApi {
	machine = null;
	initialLoad = true;

	async getNodeDefs() {
		if(!this.initialLoad) {
			const res = await fetch("/api/machine/refreshMachineNodeDefs?machineID="+this.machine.id)
			.then(res => res.json());
			if (!res) {
				alert("❌ Error fetching machine nodes");
				throw new Error("Error fetching machine nodes");
			}
			return res;
		}
		
		this.initialLoad = false;
		if(!this.machine) {
			return serverNodeDefs;
		}
		return JSON.parse(this.machine?.object_info ?? "{}") ?? {};
	}
	async getUserConfig() {
		localStorage.setItem("Comfy.userId", "default");
		return { storage: "browser", users: {'default':{}} };
		// return { storage: "browser", users: Promise.resolve({}), migrated: false };
		return (await this.fetchApi("/users")).json();
	}

	validateRunnable(output, workflow) {
		// validate workflow prompt deps first
		const deps = workflow.extra.deps;
		// only keep the deps that are used in the prompt
		const newDeps = {
			images: {},
			models: {},
		}
		const node_errors = {}
		let error = null;
		for (const nodeID of Object.keys(output)) {
			const node = output[nodeID];
			
			if (node.inputs) {
				Object.keys(node.inputs).forEach((inputName) => {
					const value = node.inputs?.[inputName];
					if (typeof value != "string") return;
					// Check if it's a model file
					
					const valueList1 = LiteGraph.registered_node_types[node.class_type].nodeData?.input?.required?.[inputName]?.[0];
					const valueList2 = LiteGraph.registered_node_types[node.class_type].nodeData?.input?.optional?.[inputName]?.[0];
					if (!Array.isArray(valueList1) && !Array.isArray(valueList2)) {
						return;
					}
					// Check if it's an image file, need to check if in deps first cuz valueList include extra uploaded image immediately (even when it not exists in server files)
					if (imageFileExtensions.some((ext) => value.endsWith(ext))) {
						if (deps?.images?.[value]?.url ) {
							newDeps.images[value] = deps.images[value];
							return;	
						}
					}
					if (valueList1?.includes(value) || valueList2?.includes(value)) {
						return;
					}
					if (modelFileExtensions.some((ext) => value.endsWith(ext))) {
						if (deps?.models?.[value]?.url && deps?.models?.[value]?.folder) {
							newDeps.models[value] = deps.models[value];
							return;
						}
					}
				
					error = {
						details:"",
						type: 'value_not_in_list',
						message: `Invalid prompt`,
					}
					console.log('valueList1', valueList1, valueList2, 'class type',node.class_type);
					const valuelist = (valueList1 ?? []).concat(valueList2 ?? []);
					node_errors[nodeID] = {
						errors: [{
							class_type: node.class_type,
							type: "value_not_in_list",
							details: "",
							message: `Value "${value}" not valid for input 👉${inputName}. Valid values are: ${valuelist.join("")}`,
						}]
					}
				});
			}
		}

		if(!error) {
			app.graph.extra.deps = newDeps;
			return newDeps;
		}
		throw {
			response:  {
				node_errors,
				error
			},
		  };
	}
	apiURL(route) {
		
		if(route.startsWith('/view?filename=')) {
			const searchParams = new URLSearchParams(route.split('?')[1]);
			console.log('filename', searchParams.get('filename'));
			const image = app.graph.extra?.deps?.images?.[searchParams.get('filename')];
			if(typeof image === 'string') {
				return image;
			}
			if(image?.url) {
				return image.url;
			}
		}
		return this.api_base + route;
	}
	async queuePrompt(number, { output, workflow }) {
		const body = {
			client_id: this.clientId,
			prompt: output,
			extra_data: { extra_pnginfo: { workflow } },
		};

		if (number === -1) {
			body.front = true;
		} else if (number != 0) {
			body.number = number;
		}
		if(!this.machine) {
			throw new Error("Please select a machine to run on!");
		}
		const newDeps = this.validateRunnable(output, workflow);
		const deps = {
			// temporarily skip model deps for now cuz we do not allow select model now
			...newDeps,
			machine: {
				id: this.machine.id,
				snapshot: JSON.parse(this.machine.snapshot),
			}};
		console.log('input', {
			prompt: output,
			deps: deps,
		},)
		const res = await fetch("/api/workflow/runWorkflow", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				input: {
					prompt: output,
					deps: deps,
				},
				machineID: this.machine.id,
				workflowID: this.getCurWorkflowID(),
				rp_endpoint_id: this.machine.rp_endpoint_id,
			}),
		}).then((res) => res.json());
		if (res.error) {
			throw new Error(res.error);
		}
		if(!res.data?.id) {
			throw new Error("Error running workflow. Please try again");
		}
		sessionStorage.setItem("job", JSON.stringify(res.data));
		window.open('/job/'+ res.data.id);
		this.dispatchEvent(new CustomEvent("jobQueued", { detail: res.data }));
		return {
			node_errors: {},
		}
	}
	generateSimpleUID() {
		return  Math.random().toString(36).slice(2,10);
	}

	fetchApi(route, options) {
		if (route === '/upload/image') {
			// uploading to server
			return fetch('/api/image/upload', {
				method: 'POST',
				body: options.body,
			}).then(resp=> resp.json()).then(res => {
				console.log('upload image response', res);
				const fileName = Object.keys(res)[0];
				if(!app.graph.extra.deps) {
					app.graph.extra.deps = {};
				}
				if(!app.graph.extra.deps.images) {
					app.graph.extra.deps.images = {};
				}
				app.graph.extra.deps.images[fileName] = {
					url: res[fileName],
				}
				return {
					status: 200,
					json: () => Promise.resolve({
						name: fileName,
					}),
				}

			});
		}
		return {
			status: 404,
			json: () => Promise.resolve({
				status: 404,
			}),
		}
	}
	async init() {
		this.clientId = this.initialClientId ?? this.generateSimpleUID();
		sessionStorage.setItem("clientId", this.clientId);
	}
	async getExtensions() {
		const COMFYUI_CORE_EXTENSIONS = [
		  "/extensions/core/clipspace.js",
		  "/extensions/core/colorPalette.js",
		  "/extensions/core/contextMenuFilter.js",
		  "/extensions/core/dynamicPrompts.js",
		  "/extensions/core/editAttention.js",
		  "/extensions/core/groupNode.js",
		  "/extensions/core/groupNodeManage.js",
		  "/extensions/core/groupOptions.js",
		  "/extensions/core/invertMenuScrolling.js",
		  "/extensions/core/keybinds.js",
		  "/extensions/core/linkRenderMode.js",
		  "/extensions/core/maskeditor.js",
		  "/extensions/core/nodeTemplates.js",
		  "/extensions/core/noteNode.js",
		  "/extensions/core/rerouteNode.js",
		  "/extensions/core/saveImageExtraOutput.js",
		  '/extensions/core/simpleTouchSupport.js',
		  "/extensions/core/slotDefaults.js",
		  "/extensions/core/snapToGrid.js",
		  "/extensions/core/uploadImage.js",
		  "/extensions/core/widgetInputs.js",
		]
		return [...COMFYUI_CORE_EXTENSIONS,'/extensions/workspace-manager/entry.js'];
	}
	async getUserConfig() {
		localStorage.setItem("Comfy.userId", "default");
		return { storage: "browser", users: {'default':{}} };
	}
	/** @param {string} file    */
	async storeUserData(file, data, options = { overwrite: true, stringify: true, throwOnError: true }) {
		if(file.startsWith('workflows/')) {
			// saving workflow
			console.log('saving workflow app.graph', JSON.parse(data));
			const graph = app.graph.serialize();
			let curWorkflowID = this.getCurWorkflowID();
			if (!curWorkflowID) {
				// create workflow
				const filename = file.match(/(?<=workflows\/)[^/]+(?=\.json)/);
				const resp = await fetch(`/api/workflow/createWorkflow`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: filename,
						json: JSON.stringify(graph),
						machine_id: this.machine?.id,
						privacy: "UNLISTED",
					})
				}).then((res) => res.json());
				if(resp.error || !resp.data?.id) {
					alert(`❌Error saving workflow: ${resp.error}`);
					return;
				}
				this.setCurWorkflowID(resp.data.id);
				graph.extra.workflow_id = resp.data.id;
				const comfyworkflow = new ComfyWorkflow(app.workflowManager, filename+'.json', [filename+'.json']);
				app.workflowManager.setWorkflow(comfyworkflow)
				return;
			} 
			if (!app.graph.extra.workflow_id) {
				graph.extra.workflow_id = curWorkflowID;
			} else if(graph.extra.workflow_id !== curWorkflowID) {
				alert(`❌Error saving workflow: workspace id mismatch!! URL ID [${curWorkflowID}], Graph ID [${graph.extra.workspace_info.id}]`);
				return;
			}
			const resp = await fetch(`/api/workflow/updateWorkflow`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: curWorkflowID,
					updateData: {
						json: JSON.stringify(graph),
						machine_id: this.machine?.id,
					}
				})
			}).then((res) => res.json());
			console.log('workflow saved',resp);
		}
	}

	getCurWorkflowID() {
		const editWorkflowID = new URLSearchParams(window.location.search).get("editWorkflowID");
		return !!editWorkflowID?.length ? editWorkflowID : null;
	}

	setCurWorkflowID(id) {
		// set iframe url
		const url = new URL(window.location.href);
		if (!id) {
			url.searchParams.delete('editWorkflowID');
			window.history.pushState({}, '', url);
			api.dispatchEvent(new CustomEvent('workflowIDChanged', { detail: { id } }));
			window.parent.postMessage({ type: 'change_url', url:`/comfyui?machine=${api.machine?.id ?? ''}` }, '*');
		} else {
			const searchParams = url.searchParams;
			searchParams.set('editWorkflowID', id);
			window.history.pushState({}, '', url);
			api.dispatchEvent(new CustomEvent('workflowIDChanged', { detail: { id } }));
			// set nextjs window url
			window.parent.postMessage({ type: 'change_url', url:`/comfyui/${id}?machine=${api.machine?.id ?? ''}` }, '*');
		}
	}
	
	
}

export const modelFileExtensions = [
	".ckpt",
	".pt",
	".bin",
	".pth",
	".safetensors",
	'.sft'
  ];
export const imageFileExtensions = [
	".jpeg", ".jpg", ".png", ".gif", ".webp", // Image extensions
	".mp4", ".mkv", ".mov", ".avi", ".flv", ".wmv", ".webm", ".mpg", ".mpeg", ".m4v", ".3gp", ".3g2" // Video extensions
  ];

export let api = new ServerlessComfyApi();

window.addEventListener("message", (event) => {
	if (event.data.type === "editor_selected_model") {
		const node  = app.graph.getNodeById(event.data.data.nodeID);
		const modelName = event.data.data.model.name;
		const widget = node.widgets.find((w) => w.name === event.data.data.inputName);
		const originalVal = widget.value;
		widget.value = modelName;
		if(!app.graph.extra.deps) {
			app.graph.extra.deps = {};
		}
		if(!app.graph.extra.deps.models) {
			app.graph.extra.deps.models = {};
		}
		delete app.graph.extra.deps.models[originalVal];
		app.graph.extra.deps.models[modelName] = {
			url: event.data.data.model.url,
			folder: event.data.data.model.folder,
			hash: event.data.data.model.hash,
		}
		
	}
  });