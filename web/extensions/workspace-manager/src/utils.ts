import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { api } from "./comfyapp";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurWorkflowID(): string | null {
  return api.getCurWorkflowID();
}
export function setCurWorkflowID(id: string | null) {
  api.setCurWorkflowID(id);
}
