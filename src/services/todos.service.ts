import { isValidObjectId } from "mongoose";

import processUTCDateConversion from "../helpers/Utilities";
import Cipherer from "../helpers/Cipherer";

import todos from "../schemas/todos.schema";
import tags from "../schemas/tags.schema";

import Todo from "../models/todo.model";
import TodoCreateRequest from "../models/todoCreateRequest.model";

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
  const response = await todos.find({
    microsoftUserId: userId,
    date: processedDate,
  });
  if (response.length === 0) {
    return { code: 404, message: "No records found" };
  }

  return { code: 200, message: "Successful", body: response };
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
  const response = await todos.find(monthQuery);
  if (response.length === 0) {
    return { code: 404, message: "No records found" };
  }

  return { code: 200, message: "Successfull", body: response };
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

  const response = await todos.find(multipleDatesQuery);

  if (response.length === 0) {
    return { code: 404, message: "No records found" };
  }

  return { code: 200, message: "Successfull", body: response };
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
      if (!isValidObjectId(tagId)) {
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
      comments: body.comments ? Cipherer.encrypt(body.comments) : undefined,
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
    comments: body.comments ? Cipherer.encrypt(body.comments) : undefined,
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

export { getTodos, createTodo };
