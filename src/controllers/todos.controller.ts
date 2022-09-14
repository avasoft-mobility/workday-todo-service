import express, { Request, Response } from "express";
import { Rollbar } from "../helpers/Rollbar";
import {
  createTodo,
  deleteParticularDateTodos,
  deleteTodo,
  getTodos,
  updateTodo,
  getHiveTodos,
} from "../services/todos.service";
const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId;
    const date = req.query.date;
    const month = req.query.month;
    const year = req.query.year;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const response = await getTodos(
      userId as string,
      date as string,
      month as string,
      year as string,
      startDate as string,
      endDate as string
    );

    if (response.code === 200) {
      return res.status(response.code).send(response.body);
    }

    return res.status(response.code).send({ message: response.message });
  } catch (error) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: (error as unknown as Error).message });
  }
});

router.get("/hive", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId;
    const date = req.query.date;

    const response = await getHiveTodos(userId as string, date as string);

    if (response.code === 200) {
      return res.status(response.code).send(response.body);
    }

    return res.status(response.code).send({ message: response.message });
  } catch (error) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: (error as unknown as Error).message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId;
    const body = req.body;
    const date = req.query.date;

    const response = await createTodo(userId as string, body, date as string);

    if (response.code === 200) {
      return res.status(response.code).send(response.body);
    }

    return res.status(response.code).send({ message: response.message });
  } catch (error) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: (error as unknown as Error).message });
  }
});

router.put("/:todoId", async (req: Request, res: Response) => {
  try {
    const todoId = req.params.todoId;
    const userId = req.query.userId;
    const body = req.body;

    const response = await updateTodo(todoId, userId as string, body);

    if (response.code === 200) {
      return res.status(response.code).send(response.body);
    }

    return res.status(response.code).send({ message: response.message });
  } catch (error) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: (error as unknown as Error).message });
  }
});

router.delete("/", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const date = req.query.date as string;

    const response = await deleteParticularDateTodos(userId, date);

    if (response.code === 200) {
      return res.status(response.code).send(response.body);
    }

    return res.status(response.code).send({ message: response.message });
  } catch (error) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: (error as unknown as Error).message });
  }
});

router.delete("/:todoId", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const todoId = req.params.todoId as string;

    const response = await deleteTodo(userId, todoId);

    if (response.code === 200) {
      return res.status(response.code).send(response.body);
    }

    return res.status(response.code).send({ message: response.message });
  } catch (error) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: (error as unknown as Error).message });
  }
});

export { router as todosController };
