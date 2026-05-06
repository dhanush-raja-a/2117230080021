const express = require('express');
const axios = require('axios');
const { Log } = require('../logging_middleware');
const { getAuthToken } = require('../logging_middleware/auth');
const { solveKnapsack } = require('./scheduler');

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/schedule', async (req, res) => {
    const startTime = Date.now();
    await Log("backend", "info", "route", "Received request for vehicle maintenance scheduling.");

    try {
        const token = await getAuthToken();
        await Log("backend", "debug", "service", "Authentication token obtained successfully.");

        // 1. Fetch Depots
        await Log("backend", "info", "api", "Fetching depots from test server...");
        const depotsResponse = await axios.get('http://20.207.122.201/evaluation-service/depots', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const depots = depotsResponse.data.depots;
        await Log("backend", "info", "api", `Successfully fetched ${depots.length} depots.`);

        // 2. Fetch Vehicles
        await Log("backend", "info", "api", "Fetching vehicles from test server...");
        const vehiclesResponse = await axios.get('http://20.207.122.201/evaluation-service/vehicles', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vehicles = vehiclesResponse.data.vehicles;
        await Log("backend", "info", "api", `Successfully fetched ${vehicles.length} vehicles.`);

        // 3. Run Scheduling for each Depot
        const results = depots.map(depot => {
            const solution = solveKnapsack(vehicles, depot.MechanicHours);
            return {
                depotID: depot.ID,
                availableHours: depot.MechanicHours,
                totalImpact: solution.totalImpact,
                totalDuration: solution.totalDuration,
                tasksCount: solution.selectedTasks.length,
                tasks: solution.selectedTasks
            };
        });

        const duration = Date.now() - startTime;
        await Log("backend", "info", "service", `Scheduling completed for all depots in ${duration}ms.`);

        res.json({
            success: true,
            results
        });

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        await Log("backend", "error", "handler", `Scheduling failed: ${errorMessage.substring(0, 40)}`);
        
        res.status(500).json({
            success: false,
            error: "Failed to process scheduling."
        });
    }
});

app.listen(PORT, () => {
    Log("backend", "info", "service", `Vehicle Scheduler running on port ${PORT}`);
    console.log(`Vehicle Scheduler running on http://localhost:${PORT}`);
});
