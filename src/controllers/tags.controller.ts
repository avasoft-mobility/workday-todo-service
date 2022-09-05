import express, { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { Rollbar } from "../helpers/Rollbar";
import {
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTagById,
} from "../services/tags.service";
const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.query["userId"]) {
      return res.status(400).send({ message: "user id is required" });
    }

    if (!req.body || !req.body["tagname"]) {
      return res.status(400).send({ message: "tag name is required" });
    }

    const response = await createTag(
      req.query["userId"] as string,
      req.body["tagname"],
      req.body["type"] ? req.body["type"] : undefined
    );

    if (response.code === 400) {
      return res.status(response.code).send({ message: response.message });
    }

    return res.status(201).send(response.data);
  } catch (error: any) {
    Rollbar.error(error as unknown as Error, req);
    return res.status(500).send({ message: error.message });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const response = await getTags(userId);

    if (response.code === 404) {
      return res.status(response.code).send({ message: response.message });
    }

    return res.status(response.code).send(response.body);
  } catch (error: any) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).send({ message: error.message });
  }
});

router.get("/:tagId", async (req: Request, res: Response) => {
  try {
    const tagId = req.params.tagId;

    const response = await getTagById(tagId);

    if (response.code >= 400) {
      return res.status(response.code).send({ message: response.message });
    }

    return res.status(response.code).send(response.body);
  } catch (error) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).send({ message: error });
  }
});

router.delete("/:tagId", async (req: Request, res: Response) => {
  try {
    const tagId = req.params.tagId;
    const userId = req.query["userId"] as string;
    const response = await deleteTagById(tagId, userId);

    if (response.code >= 400) {
      return res.status(response.code).send({ message: response.message });
    }

    return res.status(response.code).send(response.body);
  } catch (error) {
    Rollbar.error(error as unknown as Error, req);
    res.status(500).send({ message: error });
  }
});

router.put("/:tagId", async (req: Request, res: Response) => {
  try {
    if (!isValidObjectId(req.params["tagId"])) {
      return res.status(400).send({ message: "Invalid Tag id" });
    }

    if (!req.query["userId"]) {
      return res.status(400).send({ message: "user id is required" });
    }

    if (!req.body || !req.body["tagname"]) {
      return res.status(400).send({ message: "tag name is required" });
    }

    const response = await updateTag(
      req.params["tagId"],
      req.query["userId"] as string,
      req.body["tagname"]
    );

    if (response.code >= 400) {
      return res.status(response.code).send({ message: response.message });
    }

    return res.status(response.code).send(response.body);
  } catch (error: any) {
    Rollbar.error(error as unknown as Error, req);
    return res.status(500).send({ message: error.message });
  }
});

export { router as TagsController };
