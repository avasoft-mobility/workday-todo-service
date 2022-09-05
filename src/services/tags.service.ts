import mongoose from "mongoose";
import MicrosoftUser from "../models/MicrosoftUser.model";
import Tag from "../models/tag.model";
import TagAnalysis from "../models/tagAnalysis.model";
import Todo from "../models/todo.model";
import tagsSchema from "../schemas/tags.schema";
import tags from "../schemas/tags.schema";
import todoSchema from "../schemas/todos.schema";

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

const updateTag = async (
  tagId: string,
  userId: string,
  tagname: string
): Promise<TagResponse> => {
  const user: MicrosoftUser = {
    _id: "string",
    userId: userId,
    name: "String",
    role: "String",
    practice: "string",
    mail: "string",
    managerId: "d12d68ea-b04f-4bd8-9124-becae7acb9b5",
    reportings: [userId, "string"],
    last_access: "string",
    __v: 0,
    employeeId: "string",
  };

  const isTagNameExist = await isTagExist(userId, user.managerId, tagname);

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

  return { body: updateTag, code: 200, message: "Updated successfully" };
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

  for (const tagId of tagIds) {
    const tag = await tagsSchema.findById(tagId);

    if (!tag) {
      return { code: 400, message: "Tag with id not found" };
    }

    var query = {
      $and: [
        { date: { $gte: fromDate } },
        { date: { $lte: toDate } },
        {
          tags: {
            $elemMatch: { $eq: new mongoose.Types.ObjectId(tagId) },
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

    if (todos.length == 0) {
      continue;
    }

    let tagAnalysis = analyseTags(tag, todos);
    tags.push(tagAnalysis);
  }

  if (tags.length === 0) {
    return {
      code: 404,
      message: "No task found with this tags on the given date interval",
    };
  }

  tags.forEach((tag) => {
    totalEta = totalEta + tag.totalEta;
    totalAta = totalAta + tag.totalAta;
    totalTodos = totalTodos + tag.totalTodos;
  });

  return { data: { tags, totalEta, totalAta, totalTodos } };
};

const analyseTags = (tag: Tag, todos: Todo[]): TagAnalysis => {
  const totalTodos = todos.length;
  const totalAta = todos.reduce((total: number, value: Todo) => {
    return total + value.ata;
  }, 0);
  const totalEta = todos.reduce((total: number, value: Todo) => {
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

export {
  getTags,
  getTagById,
  createTag,
  getTagAnalytics,
  deleteTagById,
  updateTag,
};
