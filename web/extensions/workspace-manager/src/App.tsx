import ReactDOM from "react-dom";
import "./App.css";
import WorkflowManagerTopbar from "./workflow-manager/WorkflowManagerTopbar";
import { Suspense, lazy, useEffect, useState } from "react";
import { waitForApp } from "./comfyapp";
import { ThemeProvider } from "./components/theme-provider";
import JobManagerTopbar from "./model-manager/JobManagerTopbar";
import { SWRConfig } from "swr";
import { swrLocalStorageProvider } from "./utils/swrFetcher";
import ProfileTopbar from "./user-manager/ProfileTopbar";
import { ComfyUser } from "./type/dbTypes";
import Flex from "./components/ui/Flex";
const ModelManagerTopbar = lazy(
  () => import("./model-manager/ModelManagerTopbar"),
);

const topMenu = document.getElementsByClassName("comfyui-menu").item(0);

const menuPush = document.getElementsByClassName("comfyui-menu-push").item(0);

const leftMenu = document.createElement("div");
const middleMenu = document.createElement("div");

topMenu?.prepend(leftMenu);
menuPush?.append(middleMenu);

function App() {
  const [finishLoading, setFinishLoading] = useState(false);
  const myQueueButtonDiv = document.createElement("div");
  const queueButtonDiv = document
    .getElementsByClassName("comfyui-queue-button")
    .item(0);
  queueButtonDiv?.replaceWith(myQueueButtonDiv);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setFinishLoading(true);
      return;
    }
    waitForApp().then(() => {
      setFinishLoading(true);
    });
  }, []);
  if (!finishLoading) {
    return null;
  }
  return (
    <SWRConfig value={{ provider: swrLocalStorageProvider }}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="tailwind dark">
          {leftMenu &&
            ReactDOM.createPortal(<WorkflowManagerTopbar />, leftMenu)}
          {middleMenu &&
            ReactDOM.createPortal(
              <div className="tailwind dark">
                <Suspense fallback={null}>
                  <ModelManagerTopbar className="tailwind dark" />
                </Suspense>
              </div>,
              middleMenu,
            )}
          {myQueueButtonDiv &&
            ReactDOM.createPortal(
              <Flex className="items-center gap-2">
                <JobManagerTopbar />
                <ProfileTopbar />
              </Flex>,
              myQueueButtonDiv,
            )}
        </div>
      </ThemeProvider>
    </SWRConfig>
  );
}

export default App;
