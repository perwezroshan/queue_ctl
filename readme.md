# 🚀 QueueCTL — Node.js Job Queue & Worker CLI

**QueueCTL** is a simple yet powerful **CLI-based job queue system** built with **Node.js**, **MongoDB**, and **Mongoose**, following the **MVC architecture**.  
It lets you **enqueue commands**, **process them with multiple workers**, **retry failed jobs with exponential backoff**, and **move unprocessed jobs to a Dead Letter Queue (DLQ)** — all through the **CLI**.

---

## 🧩 Features

- ✅ **Job Queue Management** – Enqueue and process jobs using commands.
- 🔁 **Retry with Exponential Backoff** – Automatically retries failed jobs.
- ⚰️ **Dead Letter Queue (DLQ)** – Moves permanently failed jobs to DLQ after max retries.
- 🧠 **Persistent Storage** – Jobs are stored in MongoDB and survive restarts.
- ⚙️ **Multiple Worker Support** – Parallel job processing without overlap.
- ⚡ **Graceful CLI Interface** – Simple commands for job management and control.

---

## 📁 Project Structure
queuectl/
├── src/
│ ├── models/
│ │ └── Job.js
│ ├── services/
│ │ └── JobService.js
│ ├── controllers/
│ │ └── JobController.js
│ ├── cli.js
│ └── database.js
├── .env
├── package.json
└── README.md


## 🔍 How It Works

1. **Enqueue** – A job (command) is added to MongoDB with the state `pending`.
2. **Worker** – Periodically polls for pending jobs.
3. **Processing** – Executes the job’s command using `child_process.exec`.
4. **Retry** – On failure, retries the job with **exponential backoff** (based on retry count).
5. **DLQ (Dead Letter Queue)** – After maximum retries, the job is moved to the Dead Letter Queue for inspection.
6. **Persistence** – All jobs and their states are **persisted in MongoDB**, even after system restarts.
