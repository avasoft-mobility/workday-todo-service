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
import ServiceResponse from "../models/Service-response.model";
import Cipherer from "../helpers/Cipherer";

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
  endDate: string
): Promise<TodoResponse> => {
  if (!userId) {
    return { code: 400, message: "User Id is required" };
  }

  if (date) {
    const todosByDate = await getTodosByDate(userId, date);
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

  const reportingsDateIntervalTodos = await getMultiUserDateIntervalTodos(
    startDate,
    endDate,
    reportings
  );

  return {
    code: 200,
    body: {
      dateIntervalTodos: dateIntervelTodos,
      interestedDateTodo: interestedDateTodo,
      reportingsDateIntervalTodos: reportingsDateIntervalTodos,
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
  date: string
): Promise<TodoResponse> => {
  const processedDate = processUTCDateConversion(date);
  const queryResult = await todos.find({
    microsoftUserId: userId,
    date: processedDate,
  });

  if (!queryResult.length) {
    return { code: 200, body: [] };
  }

  const result = decrpytedData(queryResult);

  return { code: 200, message: "Successful", body: result };
};

const getTodosByMonth = async (
  userId: string,
  month: string,
  year: string
): Promise<TodoResponse> => {
  let monthQuery = {
    $expr: {
      $and: [
        {
          $eq: [
            {
              $month: "$date",
            },
            month,
          ],
        },
        {
          $eq: [
            {
              $year: "$date",
            },
            year,
          ],
        },
        {
          $eq: ["$microsoftUserId", userId],
        },
      ],
    },
  };
  let queryResult = await todos.find(monthQuery);

  const firstDateTodos = await todos.find({
    microsoftUserId: userId,
    date: new Date(parseInt(year), parseInt(month), 1),
  });
  queryResult = queryResult.concat(firstDateTodos);

  const lastDate = new Date(parseInt(year), parseInt(month) + 1, 1, 0);
  queryResult = queryResult.filter((todo) => {
    return (
      new Date(todo.date.setHours(0, 0, 0, 0)).toDateString() !==
      new Date(lastDate.setHours(0, 0, 0, 0)).toDateString()
    );
  });

  if (!queryResult.length) {
    return { code: 200, body: [] };
  }

  const result = decrpytedData(queryResult);

  return { code: 200, message: "Successfull", body: result };
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

  const result = decrpytedData(queryResult);

  return { code: 200, message: "Successfull", body: result };
};

const decrpytedData = (queryResult: Todo[]) => {
  queryResult.map((todo) => {
    const decryptedTitle = Cipherer.decrypt(todo.title);
    const decryptedComments = todo.comments
      ? Cipherer.decrypt(todo.comments!)
      : undefined;

    if (decryptedTitle.trim() === "" && decryptedComments?.trim() === "") {
      return todo;
    }

    todo.title = decryptedTitle;
    if (decryptedComments) {
      todo.comments = decryptedComments;
    }

    return todo;
  });

  return queryResult;
};

const getMultiUserDateIntervalTodos = async (
  startDate: string,
  endDate: string,
  users: string[]
): Promise<Todo[]> => {
  const fromDate = processUTCDateConversion(startDate);
  const toDate = processUTCDateConversion(endDate);

  const query = {
    microsoftUserId: { $in: users },
    date: { $gte: fromDate, $lt: moment(toDate).add(1).toDate() },
  };

  const result = (await todos.find(query)) as Todo[];
  return result;
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
      title: Cipherer.encrypt(body.title),
      comments: body.comments ? Cipherer.encrypt(body.comments!) : undefined,
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
    title: Cipherer.encrypt(body.title),
    comments: body.comments ? Cipherer.encrypt(body.comments!) : undefined,
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

  if (!body.ata && (body.status === "Completed" || body.status === "On Hold")) {
    return { code: 400, message: "Todo ata is required" };
  }

  if (
    body.ata < 0 &&
    (body.status === "Completed" || body.status === "On Hold")
  ) {
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
    title: Cipherer.encrypt(body.title),
    comments: body.comments ? Cipherer.encrypt(body.comments!) : undefined,
    status: body.status,
    type: body.type,
    ata: body.ata,
    tags: body.tags,
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
