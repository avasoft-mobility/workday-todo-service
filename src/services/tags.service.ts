import mongoose from "mongoose";
import LambdaClient from "../helpers/LambdaClient";
import MicrosoftUser from "../models/MicrosoftUser.model";
import Tag from "../models/tag.model";
import TagAnalysis from "../models/tagAnalysis.model";
import Todo from "../models/todo.model";
import tagsSchema from "../schemas/tags.schema";
import tags from "../schemas/tags.schema";
import todoSchema from "../schemas/todos.schema";
const axios = require("axios");

interface TagResponse {
  code: number;
  message: string;
  body?: Tag | Tag[];
}

const getTags = async (userId: string): Promise<TagResponse> => {
  if (!userId) {
    return getAllTags();
  }

  return getTagsByUserId(userId);
};

const getAllTags = async (): Promise<TagResponse> => {
  const tag: Tag[] = await tags.find();

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

const getTagsByUserId = async (userId: string): Promise<TagResponse> => {
  const lambdaClient = new LambdaClient("Users");
  const managers = (await lambdaClient.get(
    `/users/${userId}/managers`
  )) as MicrosoftUser[];

  const managerIds = managers.map((x: any) => x.userId);

  let queryResult: Tag[] = [];
  var commontags = await tags.find({ microsoftUserId: { $exists: false } });
  if (commontags) {
    commontags = commontags.map((x) => {
      x.type = "default";
      return x;
    });
  }

  var teamTags = await tags.find({
    $and: [{ microsoftUserId: { $in: managerIds } }, { type: { $eq: "team" } }],
  });

  var userTags = await tags.find({ microsoftUserId: { $eq: userId } });

  if (userTags) {
    userTags = userTags.map((x) => {
      x.type = "user";
      return x;
    });
  }

  queryResult = [...commontags, ...teamTags, ...userTags];
  return queryResult.length === 0
    ? { code: 404, message: "No tags found" }
    : { message: "successful", code: 200, body: queryResult };
};

const createTag = async (
  userId: string,
  tagname: string,
  tagType: string | undefined
) => {
  const lambdaClient = new LambdaClient("Users");
  const managers = (await lambdaClient.get(
    `/users/${userId}/managers`
  )) as MicrosoftUser[];

  // const axiosResponse = await axios.get(
  //   `https://wqefm8ssja.execute-api.us-east-2.amazonaws.com/dev/users/${userId}/managers`
  // );

  // const managers = axiosResponse.data;
  const managerIds = managers.map((x: any) => x.userId) as string[];
  const isTagNameExist = await isTagExist(userId, managerIds, tagname);

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

const updateTag = async (
  tagId: string,
  userId: string,
  tagname: string
): Promise<TagResponse> => {
  const existingTag = await tags
    .where("_id")
    .equals(new mongoose.Types.ObjectId(tagId));

  if (!existingTag) {
    return { code: 404, message: "Cannot find a tag with this tag id" };
  }

  if (existingTag[0].tagName === tagname) {
    return { body: existingTag[0], code: 200, message: "Updated successfully" };
  }

  const lambdaClient = new LambdaClient("Users");
  const managers = (await lambdaClient.get(
    `/users/${userId}/managers`
  )) as MicrosoftUser[];

  // const axiosResponse = await axios.get(
  //   `https://wqefm8ssja.execute-api.us-east-2.amazonaws.com/dev/users/${userId}/managers`
  // );

  // const managers = axiosResponse.data;
  const managerIds = managers.map((x: any) => x.userId) as string[];

  const isTagNameExist = await isTagExist(userId, managerIds, tagname);

  if (isTagNameExist) {
    return { code: 400, message: "Tag name already exist" };
  }

  const tag = await tags.find({
    $and: [
      { _id: new mongoose.Types.ObjectId(tagId) },
      { microsoftUserId: `${userId}` },
    ],
  });

  if (tag.length === 0) {
    return { code: 404, message: "TagId and Microsoft UserId is not matching" };
  }

  const response = await tags.findByIdAndUpdate(tagId, {
    tagName: tagname,
  });

  const updateTag = await tags
    .where("_id")
    .equals(new mongoose.Types.ObjectId(tagId));

  return { body: updateTag[0], code: 200, message: "Updated successfully" };
};

const isTagExist = async (
  userId: string,
  managerIds: string[],
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
          { microsoftUserId: { $in: managerIds } },
          { type: "team" },
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

  const response = await tags.findByIdAndDelete({
    _id: new mongoose.Types.ObjectId(tagId.toString()),
  });

  if (!response) {
    return { code: 404, message: "No tag found to delete" };
  }

  return { code: 200, message: "Deleted successfully", body: response };
};

const getTagAnalytics = async (
  tagIds: string[],
  fromDate: Date,
  toDate: Date,
  userId: string
) => {
  let totalEta: number = 0;
  let totalAta: number = 0;
  let totalTodos: number = 0;
  let tags: TagAnalysis[] = [];

  const totalTags = await tagsSchema.find({ _id: { $in: tagIds } });

  if (totalTags.length !== tagIds.length) {
    return { code: 400, message: "Some of the given tag id is not found" };
  }

  var query = {
    $and: [
      { date: { $gte: fromDate } },
      { date: { $lte: toDate } },
      {
        tags: {
          $in: tagIds,
        },
      },
      {
        microsoftUserId: {
          $eq: userId,
        },
      },
    ],
  };

  const todos: Todo[] = await todoSchema.find(query);

  for (const tag of totalTags) {
    let response = analyseSingleTag(tag, todos);
    tags.push(response);
  }

  const analysedMultipleTags = analyseMultipleTags(todos);

  if (tags.length === 0) {
    return {
      code: 404,
      message: "No task found with this tags on the given date interval",
    };
  }

  totalEta = analysedMultipleTags.totalEta;
  totalAta = analysedMultipleTags.totalAta;
  totalTodos = analysedMultipleTags.totalTodos;

  return { tags, totalEta, totalAta, totalTodos };
};

const analyseSingleTag = (tag: Tag, todos: Todo[]): TagAnalysis => {
  const filteredTodos = todos.filter((todo: Todo) => {
    return todo.tags?.some((x: Tag) => {
      return x.toString() === tag._id.toString();
    });
  });

  const totalTodos = filteredTodos.length;
  const totalAta = filteredTodos.reduce((total: number, value: Todo) => {
    return total + value.ata;
  }, 0);
  const totalEta = filteredTodos.reduce((total: number, value: Todo) => {
    return total + value.eta;
  }, 0);

  return {
    tag,
    totalTodos,
    totalAta,
    totalEta,
    todos,
  };
};

const analyseMultipleTags = (todos: Todo[]) => {
  const totalTodos = todos.length;
  const totalAta = todos.reduce((total: number, value: Todo) => {
    return total + value.ata;
  }, 0);
  const totalEta = todos.reduce((total: number, value: Todo) => {
    return total + value.eta;
  }, 0);

  return {
    totalTodos,
    totalAta,
    totalEta,
    todos,
  };
};

export {
  getTags,
  getTagById,
  createTag,
  getTagAnalytics,
  deleteTagById,
  updateTag,
};
