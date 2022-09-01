import express, { Request, Response } from "express";
import { Rollbar } from "../helpers/Rollbar";
import {
  createCommonTag,
  deleteCommonTag,
  editCommonTag,
  getCommonTags,
} from "../services/commonTags.service";
const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const response = await getCommonTags();
    return res
      .status(response.code)
      .json({ message: response.message, body: response.body });
  } catch (error: any) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:tagId", async (req: Request, res: Response) => {
  const tagId = req.params.tagId;

  try {
    const response = await getCommonTags(tagId);
    return res
      .status(response.code)
      .json({ message: response.message, body: response.body });
  } catch (error: any) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const tagName = req.body.tagName;

  try {
    const response = await createCommonTag(tagName);
    return res
      .status(response.code)
      .json({ message: response.message, body: response.body });
  } catch (error: any) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: error.message });
  }
});

router.put("/:tagId", async (req: Request, res: Response) => {
  const tagId = req.params.tagId;
  const tagName = req.body.tagName;

  try {
    const response = await editCommonTag(tagId, tagName);
    return res
      .status(response.code)
      .json({ message: response.message, body: response.body });
  } catch (error: any) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:tagId", async (req: Request, res: Response) => {
  const tagId = req.params.tagId;

  try {
    const response = await deleteCommonTag(tagId);
    return res
      .status(response.code)
      .json({ message: response.message, body: response.body });
  } catch (error: any) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).json({ message: error.message });
  }
});

export { router as commonTagsController };
