import { Command } from "commander";
import dotenv from "dotenv";
import chalk from "chalk";
import prettyMs from "pretty-ms";
import { connectDB, disconnectDB } from "./config/db.js";
import { JobController } from "./controllers/jobController.js";
import { WorkerController } from "./controllers/workerController.js";
import { STATES } from "./constants/job.js";

dotenv.config();

const program = new Command();
program
  .name("queuectl")
  .description("Simple CLI-based background job queue (Node.js + MongoDB)")
  .version("1.0.0");

function withDB(fn) {
  return async (...args) => {
    try {
      await connectDB();
      await fn(...args);
    } catch (err) {
      console.error(chalk.red(" Error:"), err.message);
    } finally {
      await disconnectDB();
    }
  };
}

program
  .command("enqueue")
  .argument("<json>", "Job JSON (e.g. '{\"id\":\"job1\",\"command\":\"echo hello\"}')")
  .description("Add a new job to the queue")
  .action(withDB(async (jsonStr) => {
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      console.error(chalk.red("Invalid JSON format. Example: {\"id\":\"job1\",\"command\":\"echo hi\"}"));
      process.exit(1);
    }

    if (!data.id || !data.command) {
      console.error(chalk.red(" Job must include both 'id' and 'command'."));
      process.exit(1);
    }

    const job = await JobController.enqueue(data);
    console.log(chalk.green(`Enqueued job: ${job.id}`));
  }));

program
  .command("list")
  .option("--state <state>", `Filter by state (${Object.values(STATES).join(", ")})`)
  .description("List jobs by state")
  .action(withDB(async (opts) => {
    const jobs = await JobController.list(opts.state);
    if (!jobs.length) return console.log(chalk.yellow(" No jobs found."));

    for (const j of jobs) {
      const age = prettyMs(Date.now() - new Date(j.created_at).getTime(), { compact: true });
      const retryIn = j.retry_at ? `${Math.max(0, Math.ceil((new Date(j.retry_at) - Date.now()) / 1000))}s` : "-";
      console.log(`${j.id} | ${j.state.padEnd(10)} | attempts=${j.attempts}/${j.max_retries} | retry_in=${retryIn} | cmd="${j.command}" | age=${age}`);
    }
  }));

program
  .command("status")
  .description("Show summary of all job states")
  .action(withDB(async () => {
    const summary = await JobController.status();
    console.log(chalk.bold("\n Job Summary:"));
    for (const [k, v] of Object.entries(summary))
      console.log(`  ${k.padEnd(10)} : ${String(v).padStart(3)}`);
  }));

program
  .command("worker:start")
  .option("--count <n>", "Number of workers to start", "1")
  .option("--base <n>", "Exponential backoff base", process.env.BACKOFF_BASE || "2")
  .option("--max-retries <n>", "Maximum retry attempts", process.env.DEFAULT_MAX_RETRIES || "3")
  .description("Start one or more workers")
  .action(withDB(async (opts) => {
    const count = Number(opts.count);
    const base = Number(opts.base);
    const retries = Number(opts.maxRetries);
    console.log(chalk.blue(` Starting ${count} worker(s)...`));
    await WorkerController.start(count, base, retries);
  }));

program
  .command("dlq:retry")
  .argument("<id>", "Job ID to retry from DLQ")
  .description("Retry a job that was moved to DLQ")
  .action(withDB(async (id) => {
    try {
      const job = await JobController.retryDLQ(id);
      console.log(chalk.green(`  Re-queued job from DLQ: ${job.id}`));
    } catch (err) {
      console.error(chalk.red(" DLQ Retry Error:"), err.message);
    }
  }));

program
  .command("dlq:list")
  .description("List all jobs in the Dead Letter Queue")
  .action(withDB(async () => {
    const jobs = await JobController.list("dead");
    if (!jobs.length) return console.log(chalk.green(" DLQ is empty."));
    console.log(chalk.bold("Dead Letter Queue:"));
    for (const j of jobs)
      console.log(`${j.id} | attempts=${j.attempts} | cmd="${j.command}" | err="${j.last_error}"`);
  }));

program
  .command("worker:stop")
  .description("Gracefully stop all running workers")
  .action(withDB(async () => {
    const { stopWorkers } = await import("./services/workerService.js");
    await stopWorkers();
  }));


program.parseAsync();
