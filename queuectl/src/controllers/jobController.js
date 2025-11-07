import {
  enqueueJob,
  listJobs,
  summary,
  retryDLQ,
  getJobById,
} from "../services/jobService.js";

export const JobController = {
  enqueue: async (jobData) => enqueueJob(jobData),
  list: async (state) => listJobs(state),
  status: async () => summary(),
  retryDLQ: async (id) => retryDLQ(id),
  getById: async (id) => getJobById(id),
};
