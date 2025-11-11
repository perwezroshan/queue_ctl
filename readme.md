
# QueueCTL

QueueCTL is a small CLI-based background job queue system made using **Node.js**.  
It lets you add shell commands as jobs, process them using worker processes, and automatically retry failed jobs with exponential backoff.  
All data is stored in local JSON files — no external database is used.

---

## 1. Setup Instructions

### Requirements
- Node.js (v14 or above)
- npm installed

### Steps to run locally
1. Clone the project  
   ```bash
   git clone https://github.com/roshanperwez/QueueCTL.git
   cd QueueCTL


2. Install the dependencies

   ```bash
   npm install
   ```

3. Run the CLI

   ```bash
   node src/cli.js --help
   ```

If you want to use it globally (so you can type `queuectl` instead of `node src/cli.js`):

```bash
npm link
```

---

## 2. Usage Examples

### Add (enqueue) a job

You can add a job by passing a shell command like this:

```bash
node src/cli.js enqueue '{"command": "echo Hello World"}'
```

Output:

```
[INFO] Enqueued job 123abc: echo Hello World
```

---

### Run a worker

To process jobs in the current terminal:

```bash
node src/cli.js worker:run
```

Example output:

```
[Worker] Started and waiting for jobs...
[Worker] Running job 123abc: echo Hello World
[Worker] Job 123abc succeeded: Hello World
```

---

### Start or stop background workers

You can also run multiple background workers:

```bash
node src/cli.js worker:start --count 3
```

And stop them when needed:

```bash
node src/cli.js worker:stop
```

---

### Check queue status

```bash
node src/cli.js status
```

Example:

```
Jobs in queue: 2 | DLQ: 0
```

---

### Manage failed jobs (DLQ)

When jobs fail after all retries, they move to the Dead Letter Queue (DLQ).

View them:

```bash
node src/cli.js dlq:list
```

Retry a job:

```bash
node src/cli.js dlq:retry <jobId>
```

Clear all failed jobs:

```bash
node src/cli.js dlq:clear
```

---

### Update config values

You can view or update retry and backoff settings:

```bash
node src/cli.js config:get
node src/cli.js config:set maxRetries 3
node src/cli.js config:set backoffBase 2
```

---

## 3. Architecture Overview

The system is built around three main parts: **jobs**, **workers**, and **storage**.

### Job lifecycle

1. When you enqueue a job, it’s saved in `data/jobs.json`.
2. Workers keep checking for jobs that are ready to run.
3. Each worker runs the job’s shell command using `child_process.exec()`.
4. If it succeeds → the job is removed.
5. If it fails → it is retried after a short delay (exponential backoff).
6. After `maxRetries` → it moves to `data/dlq.json` (Dead Letter Queue).

### Data persistence

All job data is stored in simple JSON files:

| File          | Description                     |
| ------------- | ------------------------------- |
| `jobs.json`   | List of active and pending jobs |
| `dlq.json`    | Failed jobs                     |
| `config.json` | Retry/backoff configuration     |
| `pids.json`   | Worker process IDs              |

### Worker logic

* Workers constantly look for jobs marked `"ready"`.
* They lock a job before running it (so no two workers process the same one).
* If a command fails, it retries after `backoffBase ^ retries` seconds.
* Workers handle shutdown gracefully when you press Ctrl + C.

---

## 4. Assumptions & Trade-offs

* The project uses **file-based JSON storage** to keep things simple.
  (It’s not meant for production scale, but easy to understand and test.)
* Jobs are **executed as shell commands**, so they must be valid on your system.
  (For Windows users, commands like `echo Hello` work fine.)
* **Polling** is used instead of event-driven architecture.
* Designed for **clarity, learning, and demonstration**, not for handling thousands of jobs.

---

## 5. Testing Instructions

Here’s how you can test everything end-to-end:

1. **Start a worker**

   ```bash
   node src/cli.js worker:run
   ```

2. **In another terminal, add jobs**

   ```bash
   node src/cli.js enqueue '{"command": "echo First Job"}'
   node src/cli.js enqueue '{"command": "sleep 2"}'
   ```

3. **Watch the worker output**

   ```
   [Worker] Running job ...: echo First Job
   [Worker] Job ... succeeded: First Job
   [Worker] Running job ...: sleep 2
   [Worker] Job ... succeeded:
   ```

4. **Test a failed job**

   ```bash
   node src/cli.js enqueue '{"command": "invalidCommand"}'
   ```

   After retries, it will move to DLQ:

   ```bash
   node src/cli.js dlq:list
   ```

5. **Stop background workers**

   ```bash
   node src/cli.js worker:stop
   ```

Everything is persisted under the `/data` folder.

---

**Author:** Roshan Perwez
**License:** MIT

```

