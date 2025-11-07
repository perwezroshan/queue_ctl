import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { STATES } from "../constants/job.js";
import { getNextJob, updateJobState } from "./jobService.js";

const execAsync = promisify(exec);

function backoffDelay(base, attempts) {
  return Math.pow(base, attempts) * 1000;
}

const FLAG_FILE = "./worker.lock";

export async function startWorker(count = 1, base = 2, maxRetries = 3) {
  console.log(`Starting ${count} worker(s)...`);
  fs.writeFileSync(FLAG_FILE, "RUNNING", "utf8");

  const workers = [];
  for (let i = 0; i < count; i++) {
    workers.push(runWorker(`worker-${i + 1}`, base, maxRetries));
  }

  await Promise.all(workers);
}

async function runWorker(workerId, base, maxRetries) {
  while (true) {
    if (fs.existsSync(FLAG_FILE)) {
      const flag = fs.readFileSync(FLAG_FILE, "utf8").trim();
      if (flag === "STOP") {
        console.log(`[${workerId}]  Stop signal received. Exiting gracefully...`);
        return;
      }
    }

    const job = await getNextJob();
    if (!job) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    console.log(`[${workerId}]  Processing job ${job.id} → ${job.command}`);

    try {
      const shellToUse = process.platform === "win32" ? "powershell.exe" : "/bin/bash";
      const { stdout } = await execAsync(job.command, { shell: shellToUse });
      console.log(`[${workerId}]  Job ${job.id} done: ${stdout?.trim() || "(no output)"}`);

      await updateJobState(job.id, { state: STATES.COMPLETED, last_error: null });
    } catch (err) {
      const newAttempts = job.attempts + 1;
      const delay = backoffDelay(base, newAttempts);
      const nextRetry = new Date(Date.now() + delay);

      if (newAttempts > maxRetries) {
        await updateJobState(job.id, { state: STATES.DEAD, last_error: err.message });
        console.log(`[${workerId}]  Job ${job.id} moved to DLQ`);
      } else {
        await updateJobState(job.id, {
          state: STATES.FAILED,
          attempts: newAttempts,
          retry_at: nextRetry,
          last_error: err.message,
        });
        console.log(`[${workerId}]  Job ${job.id} failed (${err.message}), retrying in ${delay / 1000}s`);
      }
    }
  }
}

export async function stopWorkers() {
  if (!fs.existsSync(FLAG_FILE)) {
    console.log("  No active workers found.");
    return;
  }
  fs.writeFileSync(FLAG_FILE, "STOP", "utf8");
  console.log(" Stop signal sent to all workers. They will exit after finishing their current job.");
}
