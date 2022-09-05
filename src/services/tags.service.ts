import mongoose from "mongoose";
import MicrosoftUser from "../models/MicrosoftUser.model";
import Tag from "../models/tag.model";
import tagsSchema from "../schemas/tags.schema";
import tags from "../schemas/tags.schema";

interface TagResponse {
  code: number;
  message: string;
  body?: Tag | Tag[];
}

const getTags = async (): Promise<TagResponse> => {
  const tag = await tags.find();
  return !tag
    ? { code: 404, message: "No tags found" }
    : { message: "successful", code: 200, body: tag };
};

const getTagById = async (tagId: string): Promise<TagResponse> => {
  if (!tagId) {
    return { code: 400, message: "tagid is required" };
  }
  var queryResult = await tags
    .where("_id")
    .equals(new mongoose.Types.ObjectId(tagId));

  return !queryResult
    ? { code: 404, message: "No tag found" }
    : { message: "successful", code: 200, body: queryResult };
};

const createTag = async (
  userId: string,
  tagname: string,
  tagType: string | undefined
) => {
  const user: MicrosoftUser = {
    _id: "string",
    userId: userId,
    name: "String",
    role: "String",
    practice: "string",
    mail: "string",
    managerId: "d12d68ea-b04f-4bd8-9124-becae7acb9b5",
    reportings: [userId, "strung"],
    last_access: "string",
    __v: 0,
    employeeId: "string",
  };

  const isTagNameExist = await isTagExist(userId, user.managerId, tagname);

  if (isTagNameExist) {
    return { code: 400, message: "Tag name already exist" };
  }

  let item = {
    microsoftUserId: userId,
    tagName: tagname,
    type: tagType,
  };

  let result = await tags.create(item);
  return { code: 201, message: "Tag created successfully", data: result };
};

const isTagExist = async (
  userId: string,
  managerId: string,
  tagname: string
): Promise<boolean> => {
  const query = {
    $or: [
      {
        $and: [{ tagName: tagname }, { microsoftUserId: `${userId}` }],
      },
      {
        $and: [
          { tagName: tagname },
          { microsoftUserId: `${managerId}` },
          { type: "Team" },
        ],
      },
      {
        $and: [
          { tagName: tagname },
          {
            microsoftUserId: {
              $exists: false,
            },
          },
        ],
      },
    ],
  };

  const tags = await tagsSchema.find(query);

  if (tags.length !== 0) {
    return true;
  }

  return false;
};

const deleteTagById = async (
  tagId: String,
  userId: string
): Promise<TagResponse> => {
  if (!tagId) {
    return { code: 400, message: "Tag Id is Required" };
  }

  if (!mongoose.isValidObjectId(tagId)) {
    return { code: 400, message: "Tag Id is not valid" };
  }

  if (!userId) {
    return { code: 400, message: "User Id is Required" };
  }
  const tag = await tags.find({
    $and: [
      { _id: new mongoose.Types.ObjectId(tagId.toString()) },
      { microsoftUserId: `${userId}` },
    ],
  });

  if (tag.length === 0) {
    return { code: 404, message: "TagId and Microsoft UserId is not matching" };
  }

  const resposne = await tags.findByIdAndDelete({
    _id: new mongoose.Types.ObjectId(tagId.toString()),
  });

  if (!resposne) {
    return { code: 404, message: "No tag found to delete" };
  }
  
  return { code: 200, message: "Deleted successfully", body: resposne };
};

export { getTags, getTagById, createTag, deleteTagById };
