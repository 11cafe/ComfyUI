import Flex from "@/components/ui/Flex";
import { IconFolder } from "@tabler/icons-react";

export type FileNode = {
  name: string;
  size?: string;
  children?: FileNode[];
};

export default function ModelsListFileTree({ tree }: { tree: FileNode[] }) {
  return (
    <div style={{ fontSize: "1rem" }}>
      {tree.map((file) => (
        <div key={file.name}>
          {file.children == null ? (
            <Flex className="justify-between flex-wrap items-center">
              <div>{file.name}</div>
              <p className="text-gray-400">{file.size}</p>
            </Flex>
          ) : (
            <div>
              <Flex className="items-center gap-1">
                <IconFolder size={18} />
                <p> {file.name}</p>
              </Flex>
              <div className="pl-5">
                <ModelsListFileTree tree={file.children} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
