import mongoose from "mongoose";
import Tag from "../models/tag.model";
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

export { getTags, getTagById };
