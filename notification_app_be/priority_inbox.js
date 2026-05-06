const axios = require('axios');
const { Log } = require('../logging_middleware');
const { getAuthToken } = require('../logging_middleware/auth');

// Priority weights
const WEIGHTS = {
    "Placement": 3,
    "Result": 2,
    "Event": 1
};

async function getPriorityNotifications() {
    await Log("backend", "info", "service", "Starting Priority Inbox processing.");

    try {
        const token = await getAuthToken();
        
        // 1. Fetch Notifications
        await Log("backend", "info", "service", "Fetching notifications...");
        const response = await axios.get('http://20.207.122.201/evaluation-service/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const notifications = response.data.notifications;
        await Log("backend", "info", "service", `Received ${notifications.length} notifications.`);

        // 2. Sort Logic: Combination of Weight and Recency
        const sortedNotifications = notifications.sort((a, b) => {
            const weightA = WEIGHTS[a.Type] || 0;
            const weightB = WEIGHTS[b.Type] || 0;

            if (weightB !== weightA) {
                return weightB - weightA; // Sort by weight descending
            }

            // If weights are equal, sort by timestamp descending
            return new Date(b.Timestamp) - new Date(a.Timestamp);
        });

        // 3. Get Top 10
        const top10 = sortedNotifications.slice(0, 10);
        await Log("backend", "info", "service", "Found top 10 priority items.");

        console.log("\n--- TOP 10 PRIORITY NOTIFICATIONS ---");
        top10.forEach((n, index) => {
            console.log(`${index + 1}. [${n.Type}] ${n.Message} (${n.Timestamp})`);
        });
        console.log("--------------------------------------\n");

        return top10;

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        await Log("backend", "error", "handler", `Priority Inbox failed: ${errorMessage.substring(0, 40)}`);
        console.error("Error fetching priority notifications:", errorMessage);
    }
}

// Run the function
getPriorityNotifications();
