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

