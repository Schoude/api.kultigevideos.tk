/**
 * Uses the $lookup step of a mongodb aggregation to find
 * the uploader of approver in the users table.
 */
export function createUserLookup(userType: "uploader" | "approver") {
  let userIdField = "";
  let matchingIdField = "";
  let aggregationField = "";

  if (userType === "uploader") {
    userIdField = "$uploaderId";
    matchingIdField = "video_uploader_id";
    aggregationField = "uploader";
  } else if (userType === "approver") {
    userIdField = "$approvedById";
    matchingIdField = "video_approver_id";
    aggregationField = "approvedBy";
  }

  const lookUpUploaderStage = [{
    "$lookup": {
      "from": "users",
      "let": {
        [matchingIdField]: { $toObjectId: `${userIdField}` },
      },
      "pipeline": [
        {
          "$match": {
            $expr: {
              $eq: ["$_id", `$$${matchingIdField}`],
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
      "as": `${aggregationField}`,
    },
  }, {
    "$addFields": {
      [aggregationField]: {
        "$arrayElemAt": [
          `$${aggregationField}`,
          0,
        ],
      },
    },
  }];

  return lookUpUploaderStage;
}
