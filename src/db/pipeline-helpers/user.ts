import { Bson } from "../../../deps.ts";

export function createUserProfileAggregation(userId: string) {
  return [
    {
      "$match": {
        "_id": new Bson.ObjectId(userId),
      },
    },
    {
      "$lookup": {
        "from": "videos",
        "let": {
          "userId": {
            "$toString": "$_id",
          },
        },
        "pipeline": [
          {
            "$match": {
              "$expr": {
                "$eq": [
                  "$uploaderId",
                  "$$userId",
                ],
              },
            },
          },
        ],
        "as": "videos",
      },
    },
    {
      "$addFields": {
        "totalViewcount": {
          "$reduce": {
            "input": "$videos",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                "$$this.viewCount",
              ],
            },
          },
        },
      },
    },
    {
      "$addFields": {
        "totalLikes": {
          "$reduce": {
            "input": "$videos",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                {
                  "$size": "$$this.likes",
                },
              ],
            },
          },
        },
      },
    },
    {
      "$addFields": {
        "totalDislikes": {
          "$reduce": {
            "input": "$videos",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                {
                  "$size": "$$this.dislikes",
                },
              ],
            },
          },
        },
      },
    },
    {
      "$addFields": {
        "totalVideoDuration": {
          "$reduce": {
            "input": "$videos",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                "$$this.meta.duration",
              ],
            },
          },
        },
      },
    },
    {
      "$project": {
        "email": 0,
        "role": 0,
        "password": 0,
      },
    },
  ];
}
