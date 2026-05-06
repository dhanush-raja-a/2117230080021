const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function getAuthToken() {
    try {
        const authData = {
            "email": process.env.EMAIL,
            "name": process.env.NAME,
            "rollNo": process.env.ROLL_NO,
            "accessCode": process.env.ACCESS_CODE,
            "clientID": process.env.CLIENT_ID,
            "clientSecret": process.env.CLIENT_SECRET
        };
        
        const response = await axios.post('http://20.207.122.201/evaluation-service/auth', authData);
        return response.data.access_token;
    } catch (error) {
        console.error("Auth Failed:", error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = { getAuthToken };
