import processUTCDateConversion from "../helpers/Utilities";
import Todo from "../models/todo.model";
import todos from "../schemas/todos.schema";

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

export { getTodos };
