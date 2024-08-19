// import HoverMenu from "@/components/HoverMenu";
// import { useDebounceFunc } from "@/components/hooks/useDebounceFunc";
// import {
//   Button,
//   Checkbox,
//   Flex,
//   Input,
//   Select,
//   Spinner,
//   Stack,
// } from "@chakra-ui/react";
// import { IconInfoCircleFilled } from "@tabler/icons-react";
// import { ChangeEvent, useEffect, useState } from "react";

// export default function InstallBatchModelsRow({
//   index,
//   model,
//   updateModel,
//   removeModel,
// }: {
//   index: number;
//   model: ModelDep;
//   updateModel: (index: number, change: Partial<ModelDep>) => void;
//   removeModel: (index: number) => void;
// }) {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const debouncedOnchangeUrl = useDebounceFunc(onChangeUrl, 600);
//   return (
//     <Stack>
//       <Flex key={index} className="row" wrap={"wrap"} gap={3}>
//         <Select
//           value={model.folder ?? ""}
//           onChange={(e) => {
//             updateModel(index, {
//               folder: e.target.value as ComfyModelFolderName,
//             });
//           }}
//           width={"fit-content"}
//         >
//           <option key={"unknown_folder"} value={""}>
//             {""}
//           </option>
//           {comfyModelFolderNames.map((v) => {
//             return (
//               <option key={v} value={v}>
//                 {v}
//               </option>
//             );
//           })}
//         </Select>
//         <Stack>
//           <Input
//             type="text"
//             value={model.name}
//             onChange={(e: ChangeEvent<HTMLInputElement>) =>
//               updateModel(index, {
//                 name: e.target.value,
//               })
//             }
//             placeholder="Model Name"
//             width={"290px"}
//           />
//         </Stack>
//         <Input
//           type="text"
//           defaultValue={model.url ?? ""}
//           flex={1}
//           onChange={(e: ChangeEvent<HTMLInputElement>) => {
//             updateModel(index, {
//               url: e.target.value,
//             });
//           }}
//           placeholder="Download URL"
//         />
//         {loading && <Spinner />}
//         {!loading && <p>✅</p>}
//         <Button type="button" onClick={() => removeModel(index)}>
//           Remove
//         </Button>
//       </Flex>
//       <p style={{ color: "red" }}>{error}</p>
//     </Stack>
//   );
// }
