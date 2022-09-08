import { json } from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import runMiddleware from "run-middleware";
import serverless from "serverless-http";

import { commonTagsController } from "./controllers/commonTags.controller";
import { TagsController } from "./controllers/tags.controller";
import { todosController } from "./controllers/todos.controller";

var cors = require("cors");

const app = express();
runMiddleware(app);

app.use(json());

app.use(
  cors({
    origin: "*",
  })
);

require("dotenv").config();

app.get("/", (req: Request, res: Response) => {
  return res.send("Todo service is healthy!");
});

app.get("/todos/check", (req, res) => {
  return res.send({ message: "Todo Service is working fine" });
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

app.use("/tags", TagsController);

app.use("/todos", todosController);

app.use(
  `/todos/*/functions/AVA-HIVE-NP-WORKDAY-TODOS-BE-dev-app/invocations`,
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
        res.status(code).json(data);
      }
    );
  }
);

app.use(
  "/tags/private/common",
  (req: Request, res: Response, next: NextFunction) => {
    return next();
  },
  commonTagsController
);

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
