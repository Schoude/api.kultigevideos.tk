import { createUserLookup } from "./video.ts";

export function createCommentsPipelineForVideohash(hash: string) {
  return [
    {
      "$match": { videoHash: hash, parentId: { $exists: false } },
    },
    ...createUserLookup("author"),
    ...createUserLookup("uploader"),
    {
      "$lookup": {
        from: "comments",
        let: { comment_id: { $toString: "$_id" } },
        pipeline: [{
          "$match": {
            "$expr": {
              $eq: ["$parentId", "$$comment_id"],
            },
          },
        }, {
          "$project": {
            "authorId": 0,
            "uploaderId": 0,
          },
        }],
        as: "replies",
      },
    },
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
