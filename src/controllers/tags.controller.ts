import express, { Request, Response } from "express";
import { Rollbar } from "../helpers/Rollbar";
import { getTags, getTagById } from "../services/tags.service";
const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const response = await getTags();
    return res
      .status(response.code)
      .json({ message: response.message, body: response.body });
  } catch (error: any) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:tagId", async (req: Request, res: Response) => {
  try {
    const tagId = req.params.tagId;

    const response = await getTagById(tagId);
    if (response.code === 200) {
      return res
        .status(response.code)
        .json({ message: response.message, body: response.body });
    }
    return res.status(response.code).json({ message: response.message });
  } catch (error) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: error });
  }
});

export { router as TagsController };
