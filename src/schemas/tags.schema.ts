import mongoose from "mongoose";
import Tag from "../models/tag.model";

const tags = new mongoose.Schema({
  microsoftUserId: {
    type: String,
  },
  tagName: String,
  type: String,
  createdAt: {
    type: Date,
    default: () => Date.now(),
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: () => Date.now(),
  },
});

export default mongoose.model<Tag>("tags", tags);
