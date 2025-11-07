import { startWorker } from "../services/workerService.js";

export const WorkerController = {
  start: async (count, base, retries) => startWorker(count, base, retries),
};
