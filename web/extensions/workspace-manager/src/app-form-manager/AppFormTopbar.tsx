import { Button } from "@/components/ui/button";
import { IconRocket } from "@tabler/icons-react";
import Flex from "@/components/ui/Flex";
import { api, app } from "@/comfyapp";

export default function AppFormTopbar() {
  return (
    <Flex className="workflow-manager-topbar items-center gap-2">
      <Button
        size={"sm"}
        className=" hover:bg-purple-300 font-normal gap-1"
        style={{ backgroundColor: "#2F2C39", color: "#D2BDF6" }}
        onClick={async () => {
          const p = await app.graphToPrompt();
          window.parent.postMessage(
            {
              type: "show_app_maker",
              apiPrompt: p.output,
              deps: app.graph.extra?.deps ?? null,
              machine: api.machine,
              graphObj: app.graph.serialize(),
              topFields: app.dbWorkflow?.top_fields,
            },
            "*",
          );
        }}
      >
        <IconRocket size={18} /> App
      </Button>
    </Flex>
  );
}
