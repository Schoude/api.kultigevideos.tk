import type { UserMetaData, UserSlim } from "./user.d.ts";

interface VideoMetaData {
  duration: number;
}

export interface Video {
  _id: string;
  hash: string;
  url: string;
  title: string;
  description: string;
  thumb: string;
  viewCount: number;
  listed: boolean;
  approved: boolean;
  approvedById?: string;
  approvedBy?: {
    _id: string;
    username: string;
    meta: UserMetaData;
  };
  approvedAt?: Date;
  uploaderId: string;
  uploader?: UserSlim;
  uploadedAt: Date;
  likes: string[];
  dislikes: string[];
  meta: VideoMetaData;
}
