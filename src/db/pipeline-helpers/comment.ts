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
        pipeline: [
          {
            "$match": {
              "$expr": {
                $eq: ["$parentId", "$$comment_id"],
              },
            },
          },
          ...createUserLookup("author"),
          ...createUserLookup("uploader"),
          {
            "$project": {
              "authorId": 0,
              "uploaderId": 0,
            },
          },
        ],
        as: "replies",
      },
    },
    {
      "$addFields": {
        replyCount: {
          "$size": "$replies",
        },
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
