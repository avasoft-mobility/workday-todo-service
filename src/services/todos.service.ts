import mongoose from "mongoose";
import moment from "moment";
import processUTCDateConversion from "../helpers/Utilities";

import tags from "../schemas/tags.schema";
import todos from "../schemas/todos.schema";

import Todo from "../models/todo.model";
import TodoStats from "../models/todo-stats.model";
import TodoCreateRequest from "../models/todoCreateRequest.model";
import HiveTodo from "../models/hive-todo.model";
import Tag from "../models/tag.model";
import { getCommonTags } from "./commonTags.service";
import ServiceResponse from "../models/ServiceResponse.model";
import { getTags } from "./tags.service";

interface TodoResponse {
  code: number;
  message?: string;
  body?: Todo | Todo[];
}

const getTodos = async (
  userId: string,
  date: string,
  month: string,
  year: string,
  startDate: string,
  endDate: string,
  object: string
): Promise<TodoResponse> => {
  if (!userId) {
    return { code: 400, message: "User Id is required" };
  }

  if (date) {
    const todosByDate = await getTodosByDate(userId, date, object);
    return todosByDate;
  }

  if (!month && !startDate) {
    return { code: 400, message: "Month is required" };
  }

  if (!year && !startDate) {
    return { code: 400, message: "Year is required" };
  }

  if (month && year) {
    const todosByMonth = await getTodosByMonth(userId, month, year);
    return todosByMonth;
  }

  if (!startDate) {
    return { code: 400, message: "Start date is required" };
  }

  if (!endDate) {
    return { code: 400, message: "End date is required" };
  }

  const todoByMultipleDates = getTodosByMultipleDates(
    userId,
    startDate,
    endDate
  );
  return todoByMultipleDates;
};

const getTodosForStats = async (
  userId: string,
  interestedDate: string,
  startDate: string,
  endDate: string,
  reportings: string[]
): Promise<ServiceResponse<TodoStats>> => {
  if (!userId) {
    return { code: 400, message: "User Id is required" };
  }

  if (!interestedDate) {
    return { code: 400, message: "Interested Date is required" };
  }

  if (!startDate) {
    return { code: 400, message: "Start Date is required" };
  }

  if (!endDate) {
    return { code: 400, message: "End Date is required" };
  }

  const interestedDateTodo = (await getTodosByDate(userId, interestedDate))
    .body as Todo[];

  const dateIntervelTodos = (
    await getTodosByMultipleDates(userId, startDate, endDate)
  ).body as Todo[];

  const reportingsInterestedDateTodos = await getMultiUserTodosByDate(
    interestedDate,
    reportings
  );

  return {
    code: 200,
    body: {
      dateIntervalTodos: dateIntervelTodos,
      interestedDateTodo: interestedDateTodo,
      reportingsInterestedDateTodos: reportingsInterestedDateTodos,
    },
  };
};

const getHiveTodos = async (
  userId: string,
  date: string
): Promise<ServiceResponse<HiveTodo[]>> => {
  if (!userId) {
    return { code: 400, message: "User Id is required" };
  }

  if (!date) {
    return { code: 400, message: "Date is required" };
  }

  const defaultTags = (await getCommonTags()).body! as Tag[];
  const todos = (await getTodosByDate(userId, date)).body! as Todo[];

  const hiveTodos = todos.map((todo) => {
    return {
      user_id: todo.microsoftUserId,
      work_item: todo.title,
      estimated_hours: todo.eta,
      actual_hours: todo.ata,
      due_date: moment(todo.date).format("YYYY-MM-DD"),
      status: todo.status,
      tags: fetchTodoDefaultTags(todo.tags ? todo.tags : [], defaultTags),
    } as HiveTodo;
  });

  return { code: 200, body: hiveTodos };
};

const fetchTodoDefaultTags = (tags: Tag[], defaultTags: Tag[]): string[] => {
  let result: string[] = [];
  for (let tag of tags) {
    const defaultTag = defaultTags.find(
      (x) => x._id?.toString() === tag._id!.toString()
    );
    if (!defaultTag) {
      continue;
    }
    result.push(defaultTag.tagName);
  }

  return result;
};

const getTodosByDate = async (
  userId: string,
  date: string,
  object?: string
): Promise<TodoResponse> => {
  const processedDate = processUTCDateConversion(date);
  let queryResult = await todos.find({
    microsoftUserId: userId,
    date: processedDate,
  });

  if (!queryResult.length) {
    return { code: 200, body: [] };
  }

  const userTags = await getTags(userId);

  if (userTags.code !== 200) {
    return { code: 200, message: "Successful", body: queryResult };
  }

  if (object !== undefined && object === "true") {
    queryResult = queryResult.map((todo) => {
      if (todo.tags) {
        todo.tags = todo.tags.map(
          (id) =>
            (userTags.body! as Tag[]).find(
              (tag: Tag) => tag._id!.toString() === id.toString()
            )!
        );
        return todo;
      }
      return todo;
    });

    return { code: 200, message: "Successful", body: queryResult };
  }

  return { code: 200, message: "Successful", body: queryResult };
};

const getTodosByMonth = async (
  userId: string,
  month: string,
  year: string
): Promise<TodoResponse> => {
  const startOfMonth = moment(new Date(parseInt(year), parseInt(month) - 1, 1))
    .startOf("month")
    .toDate();
  const endOfMonth = moment(new Date(parseInt(year), parseInt(month) - 1, 1))
    .endOf("month")
    .toDate();

  console.log("startOfMonth", startOfMonth);
  console.log("endOfMonth", endOfMonth);

  let queryResult = await todos.find({
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth,
    },
    microsoftUserId: userId,
  });

  if (!queryResult.length) {
    return { code: 200, body: [] };
  }

  return { code: 200, message: "Successfull", body: queryResult };
};

const getTodosByMultipleDates = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<TodoResponse> => {
  const fromDate = processUTCDateConversion(startDate);
  const toDate = processUTCDateConversion(endDate);

  console.log("fromDate", fromDate);
  console.log("toDate", toDate);

  const multipleDatesQuery = {
    microsoftUserId: userId,
    date: { $gte: fromDate, $lt: moment(toDate).add(1).toDate() },
  };

  const queryResult = await todos.find(multipleDatesQuery);

  if (!queryResult.length) {
    return { code: 200, body: [] };
  }

  return { code: 200, message: "Successfull", body: queryResult };
};

const getMultiUserTodosByDate = async (
  date: string,
  users: string[]
): Promise<Todo[]> => {
  const processedDate = processUTCDateConversion(date);
  const queryResult = await todos.find({
    microsoftUserId: { $in: users },
    date: processedDate,
  });

  if (!queryResult.length) {
    return [];
  }

  return queryResult;
};

const createTodo = async (
  userId: string,
  body: TodoCreateRequest,
  date: string
): Promise<TodoResponse> => {
  if (!userId) {
    return { code: 400, message: "User Id is required" };
  }

  if (!date && !(body.recurringDates.length > 0)) {
    return { code: 400, message: "Todo date is required" };
  }

  if (!body.title) {
    return { code: 400, message: "Todo title is required" };
  }

  if (!body.status) {
    return { code: 400, message: "Todo status is required" };
  }

  if (!body.eta) {
    return { code: 400, message: "Todo eta is required" };
  }

  if (body.eta < 0.25) {
    return { code: 400, message: "Todo eta should be greater than 0.25" };
  }

  if (body.tags) {
    for (let tagId of body.tags) {
      if (!mongoose.isValidObjectId(tagId)) {
        return { code: 400, message: "Tag Id is invalid" };
      }

      const currentTag = await tags.findById(tagId);
      if (!currentTag) {
        return {
          code: 404,
          message: `Tag not found for the given this ${tagId} Tag Id`,
        };
      }
    }
  }

  if (body.recurringDates.length > 0) {
    const recurringTodos = await createRecurringTodos(userId, body);
    return recurringTodos;
  }

  const todo = createTodoByDate(userId, body, date);
  return todo;
};

const createRecurringTodos = async (
  userId: string,
  body: TodoCreateRequest
): Promise<TodoResponse> => {
  const results = [];

  for (let date of body.recurringDates) {
    let item = {
      title: body.title,
      comments: body.comments,
      status: body.status,
      type: body.type,
      eta: body.eta,
      tags: body.tags,
      microsoftUserId: userId,
      ata: 0,
      date: new Date(new Date(date).setHours(0, 0, 0, 0)),
    };

    let result = await todos.create(item);
    results.push(result);
  }

  return { code: 200, message: "success", body: results };
};

const createTodoByDate = async (
  userId: string,
  body: TodoCreateRequest,
  date: string
): Promise<TodoResponse> => {
  let item = {
    title: body.title,
    comments: body.comments,
    status: body.status,
    type: body.type,
    eta: body.eta,
    ata: 0,
    tags: body.tags,
    microsoftUserId: userId,
    date: new Date(new Date(date).setHours(0, 0, 0, 0)),
  };

  let response = await todos.create(item);
  return { code: 200, message: "successful", body: response };
};

const updateTodo = async (
  todoId: string,
  userId: string,
  body: TodoCreateRequest
): Promise<TodoResponse> => {
  if (!todoId) {
    return { code: 400, message: "Todo Id is required" };
  }

  if (!userId) {
    return { code: 400, message: "User Id is required" };
  }

  if (!body.title) {
    return { code: 400, message: "Todo title is required" };
  }

  if (!body.status) {
    return { code: 400, message: "Todo status is required" };
  }

  if (!body.type) {
    return { code: 400, message: "Todo type is required" };
  }

  if (!body.ata && body.status === "Completed") {
    return { code: 400, message: "Todo ata is required" };
  }

  if (body.ata < 0 && body.status === "Completed") {
    return { code: 400, message: "Todo ata is invalid" };
  }

  if (body.tags) {
    for (let tagId of body.tags) {
      if (!mongoose.isValidObjectId(tagId)) {
        return { code: 400, message: "Tag Id is invalid" };
      }

      const currentTag = await tags.findById(tagId);
      if (!currentTag) {
        return {
          code: 404,
          message: `Tag not found for the given this ${tagId} Tag Id`,
        };
      }
    }
  }

  let todo = await todos.find({
    _id: new mongoose.Types.ObjectId(todoId),
    microsoftUserId: userId,
  });

  if (!todo.length) {
    return { code: 404, message: "Todo not found" };
  }

  let item = {
    microsoftUserId: userId,
    title: body.title,
    comments: body.comments,
    status: body.status,
    type: body.type,
    ata: body.ata,
    tags: body.tags,
    date: body.date ? new Date(body.date) : body.date,
  };

  let response = await todos.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(todoId) },
    item
  );

  return { code: 200, message: "successful", body: response! };
};

const deleteParticularDateTodos = async (userId: string, date: string) => {
  if (!userId) {
    return { code: 400, message: "User Id is required" };
  }

  if (!date) {
    return { code: 400, message: "Date is required" };
  }

  let item = {
    microsoftUserId: userId,
    date: new Date(new Date(date).setHours(0, 0, 0, 0)),
    status: { $ne: "Completed" },
  };

  let result = await todos.deleteMany(item);
  return { code: 200, message: "successful", body: result };
};

const deleteTodo = async (userId: string, todoId: string) => {
  if (!userId) {
    return { code: 400, message: "User Id is required" };
  }

  if (!todoId) {
    return { code: 400, message: "Todo Id is required" };
  }

  let todo = await todos.find({
    _id: new mongoose.Types.ObjectId(todoId),
    microsoftUserId: userId,
  });

  if (!todo.length) {
    return { code: 404, message: "Todo not found" };
  }

  let item = {
    _id: new mongoose.Types.ObjectId(todoId),
    microsoftUserId: userId,
    status: { $ne: "Completed" },
  };

  let result = await todos.findByIdAndDelete(item);

  return { code: 200, message: "successful", body: result };
};

export {
  getTodos,
  createTodo,
  updateTodo,
  deleteParticularDateTodos,
  deleteTodo,
  getTodosForStats,
  getHiveTodos,
};
