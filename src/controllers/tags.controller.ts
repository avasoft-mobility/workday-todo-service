import express, { Request, Response } from "express";
import { Rollbar } from "../helpers/Rollbar";
import { getTags, getTagById, createTag, deleteTagById } from "../services/tags.service";
const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.query["userId"]) {
      return res.status(400).json({ message: "user id is required" });
    }

    if (!req.body || !req.body["tagname"]) {
      return res.status(400).json({ message: "tag name is required" });
    }

    const response = await createTag(
      req.query["userId"] as string,
      req.body["tagname"],
      req.body["type"] ? req.body["type"] : undefined
    );

    if (response.code === 400) {
      return res.status(response.code).json({ message: response.message });
    }

    return res
      .status(201)
      .json({ message: response.message, body: response.data });
  } catch (error: any) {
    Rollbar.error(error as unknown as Error, req);
    return res.status(500).json({ message: error.message });
  }
});

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

router.delete("/:tagId/users/:userId", async (req: Request, res: Response) => {
  const tagId = req.params.tagId;
  const userId = req.params.userId;

  try {
    const response = await deleteTagById(tagId, userId);
    return res
      .status(response.code)
      .json({ message: response.message, body: response.body });
  } catch (error) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: error });
  }
});

export { router as TagsController };
