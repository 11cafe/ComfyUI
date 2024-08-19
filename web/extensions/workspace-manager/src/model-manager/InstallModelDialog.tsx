import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ModelFolderSelector } from "./ModelFolderSelector";
import { useState } from "react";
import { installModels } from "./ModelManagerApi";
import { api } from "@/comfyapp";

export function InstallModelDialog({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [folder, setFolder] = useState("checkpoints");
  const [url, setUrl] = useState("");
  const onInstall = async () => {
    if (!name || !url) {
      alert("❌ File Name and Download URL shouldn't be empty");
      return;
    }
    if (!api.machine?.id) {
      alert("❌ No machine selected");
      return;
    }
    setLoading(true);
    const res = await installModels(api.machine?.id, {
      name,
      folder,
      url,
    });
    setLoading(false);

    if (res.error) {
      alert(`❌ ${res.error}`);
      return;
    }
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
          <DialogTitle>Install Model</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-right">Folder</p>
            <ModelFolderSelector
              value={folder}
              onChange={(val) => setFolder(val)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-right">File Name</p>
            <Input
              className="col-span-3"
              placeholder="v1-5-pruned-emaonly.safetensors"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-right">Download Url</p>
            <Input
              className="col-span-3"
              placeholder="https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors"
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            className="w-full"
            onClick={onInstall}
            isLoading={loading}
          >
            Install
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
