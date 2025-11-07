import mongoose from "mongoose";
import { STATES } from "../constants/job.js";

const JobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  command: { type: String, required: true },
  state: { type: String, enum: Object.values(STATES), default: STATES.PENDING },
  attempts: { type: Number, default: 0 },
  max_retries: { type: Number, default: 3 },
  created_at: { type: Date, default: () => new Date() },
  updated_at: { type: Date, default: () => new Date() },
  retry_at: { type: Date },
  last_error: { type: String },
});

JobSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export const Job = mongoose.model("Job", JobSchema);
