# Campus Notifications Microservice Design

## Stage 1: API Design & Real-time Mechanism

### Core Actions Supported
1. **Fetch Notifications**: Get a list of notifications for the logged-in student.
2. **Mark as Read**: Mark a specific notification or all notifications as read.
3. **Delete Notification**: Remove a notification from the user's view.
4. **Subscription Management**: Manage user preferences for notification types (Event, Result, Placement).

### REST API Endpoints

#### 1. GET /notifications
- **Description**: Fetches all notifications for the authenticated student.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "notifications": [
    {
      "id": "uuid-1",
      "type": "Placement",
      "message": "CSX Corporation hiring process started.",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:18Z"
    }
  ]
}
```

#### 2. PATCH /notifications/{id}/read
- **Description**: Marks a specific notification as read.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{ "message": "Notification marked as read" }
```

#### 3. POST /notifications/notify-all (Admin)
- **Description**: Sends a notification to all students.
- **Request Body**:
```json
{
  "type": "Event",
  "message": "Annual Tech Fest starts tomorrow!"
}
```

### Real-time Notification Mechanism
I propose using **WebSockets (Socket.io)** for real-time notifications.
- **Rationale**: WebSockets provide a full-duplex communication channel over a single TCP connection. This allows the server to push notifications to the client instantly as they occur, rather than the client polling the server.
- **Workflow**: 
  1. Student logs in and establishes a WebSocket connection.
  2. Server maps the `studentID` to the active `socketID`.
  3. When a new event occurs (e.g., a result is published), the server identifies the target students and emits a `new_notification` event via their active socket.

---

## Stage 2: Persistent Storage & Scalability

### Database Choice: MySQL (Relational)
- **Rationale**: Since the notifications involve structured data with clear relationships (Students -> Notifications), a relational database is ideal. MySQL provides strong ACID compliance, ensuring that "Read" statuses are reliably updated.
- **Schema**:
```sql
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100)
);

CREATE TABLE notifications (
    notification_id VARCHAR(36) PRIMARY KEY,
    student_id INT,
    type ENUM('Event', 'Result', 'Placement') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);
```

### Scalability Challenges
As data volume increases (e.g., millions of notifications):
1. **Query Latency**: Fetching unread notifications for a student becomes slow as the table grows.
2. **Storage Costs**: Storing millions of historical notifications that are rarely accessed.
3. **Write Throughput**: High volume of concurrent inserts during "Notify All" events.

### Solutions
1. **Indexing**: Add a composite index on `(student_id, is_read, created_at)` to optimize the fetch query.
2. **Database Sharding**: Partition the `notifications` table by `student_id` range or hash to distribute the load across multiple DB instances.
3. **Archiving**: Move notifications older than 6 months to a cold storage (e.g., S3 or a separate "archive" table).
4. **Caching**: Use Redis to store the "Unread Count" or the most recent 10 notifications for each student.

---

## Stage 3: Query Optimization

### Query Analysis
`SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC;`

1. **Accuracy**: The query is accurate for fetching unread notifications for a specific student, sorted by recency.
2. **Why is it slow?**
   - **Full Table Scan**: With 5 million rows, the database must scan every row to find matches for `studentID` and `isRead` unless there is an index.
   - **Sorting Overhead**: `ORDER BY createdAt DESC` requires a sort operation on the filtered results, which is expensive for large sets.
3. **Optimizations**:
   - **Composite Index**: Create an index on `(studentID, isRead, createdAt)`. This allows the DB to jump directly to the student's unread notifications and provides them pre-sorted by `createdAt`.
   - **Computation Cost**: The index will increase storage size slightly and add a small overhead to `INSERT` operations (O(log N)), but it will reduce `SELECT` time from O(N) to O(log N), providing a massive speedup.
4. **Index on every column?**
   - **Ineffective**: This is bad advice. Indices consume memory and disk space. More importantly, every write (Insert/Update/Delete) must update all indices, significantly slowing down write operations. Only index columns used in `WHERE`, `JOIN`, or `ORDER BY` clauses.

### Placement Notification Query
To find students who received a placement notification in the last 7 days:
```sql
SELECT DISTINCT studentID 
FROM notifications 
WHERE notificationType = 'Placement' 
  AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## Stage 4: Performance Improvement

### Suggested Solutions
1. **Application Level Caching (Redis)**:
   - **Strategy**: Store the `unread_count` for each student in Redis. Increment/decrement it on notification events.
   - **Tradeoffs**: Fast reads, but requires cache-invalidation logic to keep it synced with the DB.
2. **CDN & Browser Caching**: Cache static notification content if applicable.
3. **Database Read Replicas**: Distribute read queries across multiple read-only database instances.
4. **Pagination**: Never fetch "all" notifications; always use `LIMIT` and `OFFSET` (or cursor-based pagination).

---

## Stage 5: Reliable Notification Redesign

### Shortcomings of Current Implementation
1. **Blocking/Synchronous**: The loop waits for each `send_email` (an external API call) to finish before moving to the next. Processing 50,000 students would take hours.
2. **Unreliability**: If the server crashes at index 10,000, the remaining 40,000 students never get notified. There is no persistence of "pending" tasks.
3. **No Error Handling**: The 200 failures are lost because there is no retry mechanism.

### Redesigned Architecture
Use a **Message Queue (e.g., BullMQ with Redis or RabbitMQ)**:
1. **Producer**: The "Notify All" action adds 50,000 individual "jobs" to the queue.
2. **Consumer (Workers)**: Multiple worker processes pick up jobs from the queue and execute them.
3. **Separation of Concerns**: Saving to the DB and sending emails should be separate jobs. If an email fails, only the email job is retried, without re-inserting into the DB.

### Revised Pseudocode
```python
# Producer
function notify_all(student_ids, message):
    for student_id in student_ids:
        # Add to message queue for async processing
        notification_queue.add({
            "student_id": student_id,
            "message": message,
            "type": "ALL_CHANNELS"
        })

# Consumer / Worker
function process_job(job):
    # 1. Save to DB (Reliable)
    save_to_db(job.student_id, job.message)
    
    # 2. Trigger individual channel workers
    email_queue.add({"student_id": job.student_id, "message": job.message})
    push_queue.add({"student_id": job.student_id, "message": job.message})

# Email Worker (with retry logic)
function send_email_worker(job):
    try:
        api_call_send_email(job.student_id, job.message)
    except Exception:
        # Queue system automatically retries based on configuration
        raise RetryException()
```
