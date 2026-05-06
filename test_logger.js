const { Log } = require('./logging_middleware');

async function testLogger() {
    console.log("Testing Logging Middleware...");
    
    // Testing a backend log
    await Log("backend", "info", "middleware", "Logger tested successfully.");
    
    // Testing an error log
    await Log("backend", "error", "handler", "Simulated error log.");

    console.log("Check the console for any errors. If nothing appeared above 'Testing completed', logs were sent successfully.");
    console.log("Testing completed.");
}

testLogger();
