import express, { Request, Response } from "express";
import { Rollbar } from "../helpers/Rollbar";
import { getTodos } from "../services/todos.service";
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
      return res
        .status(response.code)
        .json({ message: response.message, body: response.body });
    }

    return res.status(response.code).json({ message: response.message });
  } catch (error) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: (error as unknown as Error).message });
  }
});

export { router as todosController };
