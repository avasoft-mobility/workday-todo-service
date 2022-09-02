import { json } from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { commonTagsController } from "./controllers/commonTags.controller";
import serverless from "serverless-http";
import runMiddleware from "run-middleware";
import { TagsController } from "./controllers/tags.controller";

var cors = require("cors");

const app = express();
runMiddleware(app);

app.use(json());
app.use(cors());

require("dotenv").config();

app.use(
  "/todos/*/functions/TodosFunction/invocations",
  (req: Request, res: Response) => {
    const payload = JSON.parse(Buffer.from(req.body).toString());
    (app as any).runMiddleware(
      payload.path,
      {
        method: payload.httpMethod,
        body: payload.body,
        query: payload.queryParams,
      },
      function (code: any, data: any) {
        res.json(data);
      }
    );
  }
);

app.get("/", (req: Request, res: Response) => {
  return res.send("Todo service is healthy!");
});

app.get("/todos/check", (req, res) => {
  return res.send({ message: "Attendance Service is working fine" });
});

app.get("/todos/attendance", (req, res) => {
  return res.send({ message: "Todo Service is working fine" });
});

app.get("/todos/mobile", (req, res) => {
  return res.send({ message: "Mobile Service is working fine" });
});

app.get("/todos/users", (req, res) => {
  return res.send({ message: "Users Service is working fine" });
});

app.use(
  "/todos/private/common-tags",
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

if (process.env.LAMBDA !== "TRUE") {
  const PORT = process.env.PORT || 9999;
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}

module.exports.lambdaHandler = serverless(app);
