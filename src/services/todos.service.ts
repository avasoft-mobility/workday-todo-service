import mongoose from "mongoose";
import Cipherer from "../helpers/Cipherer";
import processUTCDateConversion from "../helpers/Utilities";

import tags from "../schemas/tags.schema";
import todos from "../schemas/todos.schema";

import Todo from "../models/todo.model";
import TodoCreateRequest from "../models/todoCreateRequest.model";
import Tag from "../models/tag.model";

import { getTags } from "./tags.service";

interface TodoResponse {
  code: number;
  message: string;
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
    return { code: 404, message: "No records found" };
  }

  let result = decrpytedData(queryResult);

  if (date) {
    result = await extractTagNames(userId, result);
  }

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
  const queryResult = await todos.find(monthQuery);
  if (!queryResult.length) {
    return { code: 404, message: "No records found" };
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

  const multipleDatesQuery = {
    microsoftUserId: userId,
    date: { $gte: fromDate, $lt: toDate.setDate(toDate.getDate() + 1) },
  };

  const queryResult = await todos.find(multipleDatesQuery);

  if (!queryResult.length) {
    return { code: 404, message: "No records found" };
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

const extractTagNames = async (userId: string, todos: Todo[]) => {
  let userTags: any = null;
  userTags = await getTags(userId);

  todos.map((todo) => {
    if (todo.tags) {
      return {
        ...(todo as any)._doc,
        ...{
          tagNames: todo.tags.map(
            (id) =>
              userTags.find((tag: Tag) => tag._id!.toString() === id.toString())
                .tagName
          ),
        },
      };
    }
  });

  return userTags;
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

  let dates = body.recurringDates.map((date) => {
    return processUTCDateConversion(date);
  });

  for (let date of dates) {
    let item = {
      title: Cipherer.encrypt(body.title),
      comments: body.comments ? Cipherer.encrypt(body.comments!) : undefined,
      status: body.status,
      type: body.type,
      eta: body.eta,
      tags: body.tags,
      microsoftUserId: userId,
      ata: 0,
      date: date,
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
  const processedDate = processUTCDateConversion(date);

  let item = {
    title: Cipherer.encrypt(body.title),
    comments: body.comments ? Cipherer.encrypt(body.comments!) : undefined,
    status: body.status,
    type: body.type,
    eta: body.eta,
    ata: 0,
    tags: body.tags,
    microsoftUserId: userId,
    date: processedDate,
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

  if (!body.ata) {
    return { code: 400, message: "Todo ata is required" };
  }

  if (body.ata < 0) {
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
    _id: new mongoose.Types.ObjectId(todoId),
    microsoftUserId: userId,
    title: Cipherer.encrypt(body.title),
    comments: body.comments ? Cipherer.encrypt(body.comments!) : undefined,
    status: body.status,
    type: body.type,
    ata: body.ata,
    tags: body.tags,
  };

  let response = await todos.findOneAndUpdate(item);

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
    date: date,
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
    _id: todoId,
    microsoftUserId: userId,
    status: { $ne: "Completed" },
  };

  let result = await todos.findByIdAndDelete(
    new mongoose.Types.ObjectId(todoId)
  );

  return { code: 200, message: "successful", body: result };
};

export {
  getTodos,
  createTodo,
  updateTodo,
  deleteParticularDateTodos,
  deleteTodo,
};
