export type ComfyUser = {
  id: string;
  updatedAt: string;
  createdAt: string;
  email: string;
  username: string;
  intro: string | null;
  imageUrl: string | null;
  provider: string;
  oauthSub: string;
};

export type Workflow = {
  id: string;
  updatedAt: string;
  createdAt: string;
  name: string;
  description: string;
  privacy: EWorkflowPrivacy | null;
  machine_id: string;
  json: string;
};

export enum EWorkflowPrivacy {
  PRIVATE = "PRIVATE",
  PUBLIC = "PUBLIC",
  UNLISTED = "UNLISTED",
}
