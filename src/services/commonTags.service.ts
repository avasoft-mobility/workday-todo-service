import { isValidObjectId } from "mongoose";
import Tag from "../models/tag.model";
import tags from "../schemas/tags.schema";

interface CommonTagResponse {
  code: number;
  message: string;
  body?: Tag | Tag[];
}

const getCommonTags = async (tagId?: string): Promise<CommonTagResponse> => {
  if (tagId && !isValidObjectId(tagId)) {
    return { code: 400, message: "Id is not valid" };
  }

  if (tagId) {
    const tag = await tags.findById({ _id: tagId });
    return !tag
      ? { code: 404, message: "Id not exist" }
      : { message: "successful", code: 200, body: tag };
  }

  const allTags = await tags.find({ microsoftUserId: { $exists: false } });
  return { body: allTags, message: "successful", code: 200 };
};

const deleteCommonTag = async (tagId: string): Promise<CommonTagResponse> => {
  if (!tagId) {
    return { message: "Tag Id required", code: 400 };
  }

  if (!isValidObjectId(tagId)) {
    return { code: 400, message: "Id is not valid" };
  }

  const tag = await tags.findById({ _id: tagId });
  if (tag) {
    const response = await tags.findByIdAndDelete({ _id: tagId });
    return { body: response!, message: "Deleted Successfully", code: 200 };
  }

  return { message: "Id not exist", code: 404 };
};

const createCommonTag = async (tagName: string): Promise<CommonTagResponse> => {
  if (!tagName) {
    return { message: "Tag name required", code: 400 };
  }

  const tag = await tags.create({ tagName });
  return { body: tag, message: "Created successfully", code: 200 };
};

const editCommonTag = async (
  tagId: string,
  newTagName: string
): Promise<CommonTagResponse> => {
  if (!tagId) {
    return { message: "Tag Id required", code: 400 };
  }

  if (!isValidObjectId(tagId)) {
    return { code: 400, message: "Id is not valid" };
  }

  if (!newTagName) {
    return { message: "Tag name required", code: 400 };
  }

  const tag = await tags.findById({ _id: tagId });
  if (tag) {
    const response = await tags.findByIdAndUpdate(tagId, {
      tagName: newTagName,
    });
    return { body: response!, code: 200, message: "Update successfully" };
  }

  return { message: "Id not exist", code: 404 };
};

export { getCommonTags, deleteCommonTag, createCommonTag, editCommonTag };
