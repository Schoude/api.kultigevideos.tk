import type { User, UserMetaData } from "./user.d.ts";

type Uploader = Pick<User, "_id" | "username" | "meta">;

export interface Video {
  _id: string;
  hash: string;
  url: string;
  title: string;
  thumb: string;
  viewCount: number;
  listed: boolean;
  approved: boolean;
  approvedBy?: {
    _id: string;
    username: string;
    meta: UserMetaData;
  };
  approvedAt?: Date;
  uploader: Uploader;
  uploadedAt: Date;
}
