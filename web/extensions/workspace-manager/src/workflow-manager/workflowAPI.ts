import { api, app } from "@/comfyapp";
import { Workflow } from "@/type/dbTypes";
import { getCurWorkflowID, setCurWorkflowID } from "@/utils";

async function saveWorkflow({
  name,
}: {
  name: string;
}): Promise<Workflow | undefined> {
  const graph = app.graph.serialize();
  let curWorkflowID = getCurWorkflowID();
  if (!curWorkflowID) {
    // create workflow
    const resp = await fetch(`/api/workflow/createWorkflow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        json: JSON.stringify(graph),
        machine_id: api.machine.id,
        privacy: "UNLISTED",
      }),
    }).then((res) => res.json());
    if (resp.error || !resp.data.id) {
      alert(`❌Error saving workflow: ${resp.error}`);
      return;
    }
    setCurWorkflowID(resp.data.id);
    graph.extra.workflow_id = resp.data.id;
    return resp.data;
  }
  if (!app.graph.extra.workflow_id) {
    graph.extra.workflow_id = curWorkflowID;
  } else if (graph.extra.workflow_id !== curWorkflowID) {
    alert(
      `❌Error saving workflow: workspace id mismatch!! URL ID [${curWorkflowID}], Graph ID [${graph.extra.workspace_info.id}]`,
    );
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
      },
    }),
  }).then((res) => res.json());
  return resp.data;
  console.log("workflow saved", resp);
}

export async function updateWorkflow(id: string, updateData: any) {
  //   const graph = app.graph;
  //   if (!app.graph.extra.workflow_id) {
  //     graph.extra.workflow_id = id;
  //   } else if (graph.extra.workflow_id !== id) {
  //     alert(
  //       `❌Error saving workflow: workspace id mismatch!! URL ID [${id}], Graph ID [${graph.extra.workspace_info.id}]`,
  //     );
  //     return;
  //   }
  const resp = await fetch(`/api/workflow/updateWorkflow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
      updateData,
    }),
  }).then((res) => res.json());
  return resp;
}
