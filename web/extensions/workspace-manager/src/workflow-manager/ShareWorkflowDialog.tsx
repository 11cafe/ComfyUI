import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api, app } from "@/comfyapp";
import { EWorkflowPrivacy, Workflow } from "@/type/dbTypes";
import { getCurWorkflowID } from "@/utils";

export function ShareWorkflowDialog({
  onClose,
  workflow,
  onShared,
}: {
  onClose: () => void;
  workflow: Workflow;
  onShared: (workflow: Workflow) => void;
}) {
  const [privacy, setPrivacy] = useState<EWorkflowPrivacy | null>(
    workflow.privacy ?? EWorkflowPrivacy.PRIVATE,
  );
  const [loading, setLoading] = useState(false);

  const onClickShare = async () => {
    const workflowID = getCurWorkflowID();
    if (!workflowID) {
      alert("❌Please Save your workflow first!");
      return;
    }
    setLoading(true);
    // share workflow
    const data = (await fetch("/api/workflow/shareWorkflow", {
      method: "POST",
      body: JSON.stringify({
        id: workflowID,
        privacy,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json())) as { data?: Workflow; error?: string };
    setLoading(false);
    if (data.error || !data.data) {
      alert(`❌Error sharing workflow. ${data.error}`);
      return;
    }
    onShared(data.data!);
    onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        !open && onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-right">Privacy</p>
            <Select
              value={privacy as string}
              onValueChange={(val) => setPrivacy(val as EWorkflowPrivacy)}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EWorkflowPrivacy.PRIVATE}>
                  🔒 Private
                </SelectItem>
                <SelectItem value={EWorkflowPrivacy.UNLISTED}>
                  🔗 Anyone with the link can view
                </SelectItem>
                <SelectItem value={EWorkflowPrivacy.PUBLIC}>
                  🌐 Public
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            className="w-full"
            onClick={onClickShare}
            isLoading={loading}
          >
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
