import { useEffect, useState } from "react";
import { api, app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import {
  IconDeviceFloppy,
  IconFolder,
  IconPlus,
  IconShare2,
  IconTriangleInvertedFilled,
} from "@tabler/icons-react";
import Flex from "@/components/ui/Flex";
import AppFormTopbar from "@/app-form-manager/AppFormTopbar";
import { ShareWorkflowDialog } from "./ShareWorkflowDialog";
import { EWorkflowPrivacy, Workflow } from "@/type/dbTypes";

export default function WorkflowManagerTopbar() {
  const [workflow, setWorkflow] = useState<
    | (Workflow & {
        path?: string;
      })
    | null
  >(app.dbWorkflow);
  const [showShareDialog, setShowShareDialog] = useState(false);
  useEffect(() => {
    window.parent.postMessage(
      {
        type: "set_workflow",
        data: app.dbWorkflow,
      },
      "*",
    );
    app?.workflowManager?.addEventListener("changeWorkflow", () => {
      setWorkflow(app.workflowManager?.activeWorkflow);
    });
    api.addEventListener("workflowIDChanged", () => {
      fetch("/api/workflow/getWorkflow?id=" + api.workflowID)
        .then((res) => res.json())
        .then((data) => {
          app.dbWorkflow = data.data;
          setWorkflow(app.dbWorkflow);
        });
    });
  }, []);

  return (
    <Flex className="workflow-manager-topbar items-center gap-2">
      <AppFormTopbar />

      <Button
        size={"sm"}
        onClick={() => {
          if (!workflow) {
            alert("Please save your workflow first! 👉 💾");
            return;
          }
          setShowShareDialog(true);
        }}
        style={{ alignItems: "center" }}
        variant={"secondary"}
      >
        {workflow?.privacy === EWorkflowPrivacy.UNLISTED ? (
          " 🔗"
        ) : workflow?.privacy === EWorkflowPrivacy.PUBLIC ? (
          " 🌐"
        ) : (
          <IconShare2 size={18} />
        )}
      </Button>

      <Button
        size={"sm"}
        className="gap-1"
        onClick={() => {
          window.parent.postMessage(
            {
              type: "show_my_workflows",
            },
            "*",
          );
        }}
      >
        <IconFolder size={18} />
        <IconTriangleInvertedFilled size={9} />
      </Button>

      {workflow?.name ? (
        <p style={{ padding: 0, margin: 0 }}>{workflow.name}</p>
      ) : (
        <p
          className="text-muted-foreground italic"
          style={{ padding: 0, margin: 0 }}
        >
          Unsaved
        </p>
      )}

      {/* <Button
        onClick={() => {
          const workflowName = prompt(
            "Save workflow as:",
            app.workflowManager?.activeWorkflow?.name ?? "Untitled workflow",
          );
          if (!workflowName) return;
          app.workflowManager.saveWorkflow(workflowName);
        }}
        size={"sm"}
      >
        <IconDeviceFloppy size={18} />
      </Button>
      <Button
        size={"sm"}
        onClick={() => {
          changeWorkflow(null);
        }}
      >
        <IconPlus size={18} />
      </Button> */}
      {showShareDialog && workflow && (
        <ShareWorkflowDialog
          onClose={() => setShowShareDialog(false)}
          workflow={workflow}
          onShared={(workflow) => {
            setWorkflow(workflow);
          }}
        />
      )}
    </Flex>
  );
}
