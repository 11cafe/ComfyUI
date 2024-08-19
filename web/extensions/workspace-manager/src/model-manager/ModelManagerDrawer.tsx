import { useEffect, useState } from "react";
import { api, app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import CustomDrawer from "@/components/ui/CustomDrawer";
import Flex from "@/components/ui/Flex";
import { IconRefresh, IconX } from "@tabler/icons-react";
import { fetchListModels } from "./ModelManagerApi";
import { InstallModelDialog } from "./InstallModelDialog";
import ModelsListFileTree, { FileNode } from "./ModelsListFileTree";
import { convertToTree } from "./fileTreeUtils";

export default function ModelManagerDrawer({
  onClose,
}: {
  onClose: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [openInstallModel, setOpenInstallModel] = useState(false);
  const cacheKey = "machine_models_tree##" + api.machine?.id;

  const [models, setModels] = useState<FileNode[]>(() => {
    const cache = localStorage.getItem(cacheKey);
    if (cache) {
      return JSON.parse(cache);
    }
    return [];
  });
  // useEffect(() => {
  //   window.addEventListener("get_machine_workflow", (e: any) => {
  //     setModels(getTreeFromSnapshot());
  //   });
  // }, []);
  const onRefresh = async () => {
    setRefreshing(true);
    console.log(api.machine);
    const res = await fetchListModels(api.machine?.id);
    console.log("res", res);
    if (!res) {
      setRefreshing(false);
      return;
    }

    const tree = convertToTree(res);
    console.log("tree", tree);
    setModels(tree);
    setRefreshing(false);
    localStorage.setItem(cacheKey, JSON.stringify(tree));
  };

  return (
    <>
      <CustomDrawer
        onClose={onClose}
        className="w-full md:!w-[500px] overflow-y-auto"
      >
        <div className="gap-5 p-5">
          <Flex className="justify-between mb-5">
            <Flex className="gap-5 items-center">
              <h2 className="font-medium text-lg">My Models</h2>
              <Button size="sm" onClick={onRefresh} isLoading={refreshing}>
                <IconRefresh className="h-4 w-4" />
              </Button>
              {/* <Button onClick={() => setOpenInstallModel(true)}>
                Install Model
              </Button> */}
            </Flex>
            <Button variant={"ghost"} onClick={onClose}>
              <IconX className="h-4 w-4" />
            </Button>
          </Flex>
          <ModelsListFileTree tree={models} />
        </div>
      </CustomDrawer>
      {openInstallModel && (
        <InstallModelDialog onClose={() => setOpenInstallModel(false)} />
      )}
    </>
  );
}
