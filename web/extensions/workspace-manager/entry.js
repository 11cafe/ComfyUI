// setTimeout(() => {
//   import(api.api_base + "/extensions/workspace-manager/dist/input.js");
// }, 1);

//@ts-ignore
import { api } from "../../scripts/api.js";

function waitForElement(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

// wait for graph-canvas element to load so that the top menu is loaded and my react component has place to mount
waitForElement(".comfyui-queue-button").then(() => {
  import(api.api_base + "/extensions/workspace-manager/dist/input.js");
});
