export const lookUpUploaderStage = [{
  "$lookup": {
    "from": "users",
    "let": {
      "video_uploader_id": { $toObjectId: "$uploaderId" },
    },
    "pipeline": [
      {
        "$match": {
          $expr: {
            $eq: ["$_id", "$$video_uploader_id"],
          },
        },
      },
      {
        "$project": {
          "_id": 1,
          "username": 1,
          "meta": 1,
        },
      },
    ],
    "as": "uploader",
  },
}, {
  "$addFields": {
    "uploader": {
      "$arrayElemAt": [
        "$uploader",
        0,
      ],
    },
  },
}];
