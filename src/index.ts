import { json } from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { commonTagsController } from "./controllers/commonTags.controller";
import { TagsController } from "./controllers/tags.controller";

var cors = require("cors");

const app = express();
app.use(json());
app.use(cors());

require("dotenv").config();

app.get("/", (req: Request, res: Response) => {
  return res.send("Todo service is healthy!");
});

app.use(
  "/api/private/common-tags",
  (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.key === "CF43D31C5DCD2094D72EAC3B257D5949") {
      return next();
    }

    return res.status(403).json({ message: "No access to this API" });
  },
  commonTagsController
);

app.use("/tags", TagsController);

mongoose.connect(process.env.DB_STRING!.toString(), () => {
  console.log("Connected to DB");
});

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
