import * as React from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { comfyModelFolderNames } from "./types";

export function ModelFolderSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger defaultValue={value} className="w-[180px]">
        <SelectValue placeholder="Select a folder" />
      </SelectTrigger>
      <SelectContent>
        {comfyModelFolderNames.map((folder) => (
          <SelectItem value={folder}>{folder}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
