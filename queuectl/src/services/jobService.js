import { Job } from "../models/Job.js";
import { STATES } from "../constants/job.js";


export async function enqueueJob(jobData) {
  const job = new Job({
    ...jobData,
    state: STATES.PENDING,
    attempts: 0,
    created_at: new Date(),
    updated_at: new Date(),
  });
  await job.save();
  return job;
}

export async function listJobs(state) {
  const query = state ? { state } : {};
  return Job.find(query).sort({ created_at: -1 }).lean();
}


export async function summary() {
  const result = await Job.aggregate([{ $group: { _id: "$state", count: { $sum: 1 } } }]);
  const map = Object.fromEntries(result.map(r => [r._id, r.count]));
  for (const s of Object.values(STATES)) map[s] = map[s] || 0;
  return map;
}

export async function getJobById(id) {
  return Job.findOne({ id });
}


export async function getNextJob() {
  const now = new Date();
  return Job.findOneAndUpdate(
    {
      $or: [
        { state: STATES.PENDING },
        { state: STATES.FAILED, retry_at: { $lte: now } },
      ],
    },
    { $set: { state: STATES.PROCESSING } },
    { sort: { created_at: 1 }, new: true }
  );
}

export async function updateJobState(id, update) {
  return Job.findOneAndUpdate({ id }, { $set: update }, { new: true });
}

export async function retryDLQ(id) {
  const job = await Job.findOne({ id, state: STATES.DEAD });
  if (!job) throw new Error("Job not found in DLQ");

  job.state = STATES.PENDING;
  job.attempts = 0;
  job.last_error = undefined;
  job.retry_at = undefined;
  job.updated_at = new Date();
  await job.save();

  return job;
}

export async function moveToDLQ(job, reason) {
  job.state = STATES.DEAD;
  job.last_error = reason ?? job.last_error;
  job.retry_at = undefined;
  job.updated_at = new Date();
  await job.save();
  return job;
}
