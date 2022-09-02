import mongoose from "mongoose";
import Todo from "../models/todo.model";

const todos = new mongoose.Schema({
  microsoftUserId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  comments: String,
  status: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  eta: {
    type: Number,
    required: true,
    min: 0.25,
    max: 8,
  },
  ata: {
    type: Number,
    required: true,
    min: 0,
    max: 8,
  },
  date: {
    type: Date,
    required: true,
  },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tags",
    },
  ],
});

export default mongoose.model<Todo>("todos", todos);
