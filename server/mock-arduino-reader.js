const axios = require('axios');

// Define data ranges for mock data
const RANGES = {
    lat: { min: 29.9, max: 30.2 },
    long: { min: 31.1, max: 31.4 },
    temp: { min: 15, max: 35 },
    humidity: { min: 30, max: 70 }
};

// Generate random number within range
function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

// Generate mock data with 10% chance of invalid data
function generateMockData() {
    // 10% chance of invalid data
    if (Math.random() < 0.1) {
        return `*****, *****, *****, ${new Date().toLocaleTimeString('en-US')}, *****, *****`;
    }

    const lat = randomInRange(RANGES.lat.min, RANGES.lat.max).toFixed(6);
    const long = randomInRange(RANGES.long.min, RANGES.long.max).toFixed(6);
    const alt = (Math.random() * 100).toFixed(2); // Random altitude between 0-100m
    const time = new Date().toLocaleTimeString('en-US');
    const temp = randomInRange(RANGES.temp.min, RANGES.temp.max).toFixed(2);
    const humidity = randomInRange(RANGES.humidity.min, RANGES.humidity.max).toFixed(2);

    return `${lat}, ${long}, ${alt}, ${time}, ${temp}, ${humidity}`;
}

// Parse sensor data line
function parseSensorData(line) {
    const [gps_lat, gps_long, altitude, time, temperature, humidity] = line.split(',').map(s => s.trim());

    // Check for invalid data
    if ([gps_lat, gps_long, temperature, humidity].includes('*****')) {
        return null;
    }

    return {
        status: 'في الطريق', // Always set to "In Transit" per Arduino memory
        gps_lat: parseFloat(gps_lat),
        gps_long: parseFloat(gps_long),
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity)
    };
}

// Start mock data generation
async function startMockDataGeneration() {
    console.log('Starting mock Arduino data generation');
    console.log('Data ranges:');
    console.log('Latitude range:', RANGES.lat);
    console.log('Longitude range:', RANGES.long);
    console.log('Temperature range:', RANGES.temp);
    console.log('Humidity range:', RANGES.humidity);
    console.log('-----------------------------------');

    // Generate data every 5 seconds
    setInterval(async () => {
        const mockLine = generateMockData();
        console.log('Raw data:', mockLine);

        const data = parseSensorData(mockLine);
        if (!data) {
            console.log('Invalid data detected, skipping update');
            return;
        }

        try {
            console.log('Sending data to server:', data);
            const response = await axios.post('http://localhost:3000/api/shipments/latest/status', data);
            console.log('Server response:', response.data);
        } catch (error) {
            console.error('Failed to send data to server:', error.message);
        }
    }, 5000); // 5 second interval per Arduino memory
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('Stopping mock Arduino data generation');
    process.exit();
});

// Start the mock data generation
startMockDataGeneration();
