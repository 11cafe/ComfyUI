export async function fetchListModels(machineID: string): Promise<Record<
  string,
  {
    sizeB: number;
    sizeKB: number;
  }
> | null> {
  console.log(machineID);
  if (!machineID) {
    console.error("Machine ID is missing");
    return null;
  }
  return await fetch("/api/machine/listMachineModels?machineID=" + machineID)
    .then((res) => res.json())
    .then((data) => {
      console.log("fetch list mode", data);
      return data?.output?.data;
    });
}

export async function installModels(
  machineID: string,
  model: {
    name: string;
    folder: string;
    url: string;
  },
): Promise<{
  data?: {
    id: string;
    status: "IN_QUEUE";
  };
  error?: string;
}> {
  return await fetch("/api/machine/installMachineModels", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      machineID,
      deps: {
        [model.name]: {
          folder: model.folder,
          url: model.url,
        },
      },
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      return data;
    });
}
