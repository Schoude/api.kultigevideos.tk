import { createUserLookup } from "./video.ts";

export function createCommentsPipelineForVideohash(hash: string) {
  return [
    {
      $match: { videoHash: hash },
    },
    ...createUserLookup("author"),
    ...createUserLookup("uploader"),
    {
      "$sort": {
        "createdAt": -1,
      },
    },
    {
      "$project": {
        "authorId": 0,
        "uploaderId": 0,
      },
    },
  ];
}
