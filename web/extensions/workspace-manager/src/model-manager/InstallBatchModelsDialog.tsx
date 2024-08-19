// import {
//   Button,
//   Text,
//   Modal,
//   ModalBody,
//   ModalContent,
//   Stack,
// } from "@chakra-ui/react";
// import { useMemo, useState } from "react";
// import { IconPlus } from "@tabler/icons-react";
// import EditModelDepRow from "./InstallBatchModelsRow";
// import { app } from "@/comfyapp";
// import { modelFileExtensions } from "@/constants";

// export default function InstallBatchModelsDialog({
//   onClose,
// }: {
//   onClose: () => void;
// }) {
//   const deps = useMemo(async () => {
//     const p = await app.graphToPrompt();
//     console.log("deps p", p);
//     return getAllDepsFromVersionWithMissing(p.output);
//   }, []);
//   return (
//     <Modal isOpen={true} onClose={onClose}>
//       <ModalContent width={["90vw", "90vw", "80vw"]} maxWidth={"90vw"}>
//         <ModalBody>
//           <Stack p={2} pb={4} gap={5}>
//             <Text fontWeight={800} fontSize={20}>
//               File Resource
//             </Text>
//             <DepsForm initialDeps={deps} version={version} />
//           </Stack>
//         </ModalBody>
//       </ModalContent>
//     </Modal>
//   );
// }

// type SnapshotModels = {
//   [modelRelPath: string]: {
//     // {"lora/blind-box.safetensors": { sizeB: number; sizeKB?: number, url: "https://www.hg/123.safetensors" }}
//     url: string | null;
//     folder: string | null;
//     sizeB?: number;
//     sizeKB?: number;
//   };
// };

// export function getAllModelsWithMissing(
//   prompt: Record<string, any>,
// ): SnapshotModels {
//   const promptNodes = Object.values(prompt ?? {}) as any;
//   const res: SnapshotModels = {};
//   promptNodes.forEach(
//     (node: { class_type: string; inputs?: Record<string, any> }) => {
//       if (node.inputs) {
//         Object.keys(node.inputs).forEach((inputName) => {
//           const value = node.inputs?.[inputName];
//           if (typeof value != "string") return;
//           // Check if it's a model file
//           if (modelFileExtensions.some((ext) => value.endsWith(ext))) {
//             res[value] = {
//               folder: null,
//               url: null,
//             };
//           }
//         });
//       }
//     },
//   );

//   return res;
// }

// interface FormData {
//   models: { [key: string]: { url: string; folder: string } };
//   images: { [key: string]: { url: string } };
// }

// function DepsForm({
//   initialDeps,
//   version,
// }: {
//   initialDeps?: DepsResult;
//   version: WorkflowVersion;
// }) {
//   const [submitting, setSubmitting] = useState(false);
//   const [models, setModels] = useState<ModelDep[]>(() => {
//     if (initialDeps) {
//       return Object.keys(initialDeps.models ?? {}).map((name) => {
//         const model = initialDeps.models![name];
//         return {
//           name,
//           url: model?.url ?? null,
//           folder: model?.folder ?? null,
//           hash: model?.hash ?? null,
//         };
//       });
//     }
//     return [];
//   });

//   const addModel = () => {
//     setModels([...models, { name: "", url: null, folder: null, hash: null }]);
//   };

//   const updateModel = (index: number, change: Partial<ModelDep>) => {
//     const newModels = [...models];
//     newModels[index] = { ...newModels[index], ...change };
//     setModels(newModels);
//   };

//   const removeModel = (index: number) => {
//     setModels(models.filter((_, i) => i !== index));
//   };

//   const handleSubmit = () => {};

//   return (
//     <div className="App">
//       <form onSubmit={handleSubmit}>
//         <h2>Models</h2>
//         <Stack gap={5}>
//           {models.map((model, index) => (
//             <EditModelDepRow
//               key={index}
//               index={index}
//               model={model}
//               updateModel={updateModel}
//               removeModel={removeModel}
//             />
//           ))}
//         </Stack>
//         <Button
//           type="button"
//           onClick={addModel}
//           leftIcon={<IconPlus />}
//           iconSpacing={1}
//         >
//           Add Model
//         </Button>

//         {/* <h2>Images</h2>
//         {images.map((image, index) => (
//           <div key={index} className="row">
//           </div>
//         ))}
//         <button type="button" onClick={addImage}>
//           Add Image
//         </button> */}

//         <br />
//         <br />
//         <Button
//           colorScheme="teal"
//           onClick={handleSubmit}
//           isLoading={submitting}
//         >
//           Submit
//         </Button>
//       </form>

//       <pre>{output}</pre>
//     </div>
//   );
// }
