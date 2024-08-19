import { useEffect, useState } from "react";
import { api, app } from "../comfyapp";
import { Button } from "@/components/ui/button";
import Flex from "@/components/ui/Flex";
import {
  IconPlayerPlayFilled,
  IconTriangleInvertedFilled,
} from "@tabler/icons-react";

type Job = {
  id: string;
  finishedAt: string | null;
  status: string;
  duration: number | null;
};
export default function JobManagerTopbar() {
  const [queuingPrompt, setQueuingPrompt] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  useEffect(() => {
    api.addEventListener("promptQueued", () => {
      setQueuingPrompt(false);
    });
    api.addEventListener("jobQueued", (e: CustomEvent<Job>) => {
      setJobs((prev) => [...prev, e.detail]);
    });
  }, []);
  useEffect(() => {}, [jobs]);
  return (
    <Flex>
      {/* <Button className="ml-2 gap-1" size={"sm"}>
        <span>Jobs</span>
        <IconTriangleInvertedFilled size={10} />
      </Button> */}
      <Button
        className="ml-2 gap-1 bg-sky-600 text-white px-4"
        size={"sm"}
        isLoading={queuingPrompt}
        onClick={async () => {
          setQueuingPrompt(true);
          app.queuePrompt(1);
        }}
      >
        <IconPlayerPlayFilled size={14} />
        <span>Queue</span>
      </Button>
    </Flex>
  );
}
