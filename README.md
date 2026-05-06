# Backend Engineering Evaluation - Microservices Suite

This repository contains a suite of microservices and packages developed as part of a technical evaluation. The project focuses on algorithmic efficiency, system design, and observability through custom middleware.

## Project Structure

- **`/logging_middleware`**: A reusable Node.js package for centralized logging.
  - Communicates with a remote test server to log application events.
  - Supports different log levels: `debug`, `info`, `warn`, `error`, `fatal`.
- **`/vehicle_scheduling`**: A microservice for optimizing vehicle maintenance schedules.
  - Implements a **0/1 Knapsack algorithm** to maximize operational impact within a defined budget of mechanic hours.
  - Integrates with external APIs to fetch real-time depot and task data.
- **`/notification_app_be`**: A microservice for campus-wide notifications.
  - **`/priority_inbox.js`**: A script to identify and sort the top 10 most critical unread notifications based on custom weights and recency.
- **`notification_system_design.md`**: A comprehensive design document covering:
  - REST API contracts and real-time notification mechanisms (WebSockets).
  - Database schema and scalability strategies (sharding, caching, archiving).
  - Performance optimization and distributed reliability using Message Queues.

## How to Run

### Pre-requisites
- Node.js (v14 or higher)
- Access to the evaluation test server

### Setup
1. Install dependencies in the root and individual microservice folders:
   ```bash
   npm install
   cd logging_middleware && npm install
   cd ../vehicle_scheduling && npm install
   cd ../notification_app_be && npm install
   ```

### Running the Services
- **Vehicle Scheduler**: 
  ```bash
  node vehicle_scheduling/index.js
  ```
- **Priority Inbox**:
  ```bash
  node notification_app_be/priority_inbox.js
  ```

## Submission Folders
- Screenshots of the outputs are located in the respective `screenshots/` subfolders within each microservice directory.
