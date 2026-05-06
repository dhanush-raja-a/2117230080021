const axios = require('axios');
const fs = require('fs');

const registrationData = {
   "email": "dhanushrajafour@gmail.com",
   "name": "Dhanush Raja A",
   "mobileNo": "9500814195",
   "githubUsername": "dhanush-raja-a",
   "rollNo": "2117230080021",
   "accessCode": "BTCDqT"
};

async function register() {
    try {
        console.log("Registering with Affordmed Test Server...");
        const response = await axios.post('http://20.207.122.201/evaluation-service/register', registrationData);
        console.log("Registration Successful!");
        console.log(JSON.stringify(response.data, null, 2));
        
        // Save to .env or a local file for subsequent steps
        const envContent = `CLIENT_ID=${response.data.clientID}\nCLIENT_SECRET=${response.data.clientSecret}\nEMAIL=${response.data.email}\nNAME=${response.data.name}\nROLL_NO=${response.data.rollNo}\nACCESS_CODE=${response.data.accessCode}\n`;
        fs.writeFileSync('.env', envContent);
        console.log("Saved credentials to .env file.");
    } catch (error) {
        console.error("Registration Failed:");
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

register();
