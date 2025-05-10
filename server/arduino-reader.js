const { SerialPort, ReadlineParser } = require('serialport');
// منستدعي مكتبة serialport عشان نقدر نقرأ بيانات من الأردوينو، و ReadlineParser عشان نحلل كل سطر لحاله.
const axios = require('axios');
// منستدعي مكتبة axios عشان نقدر نبعت البيانات لسيرفرنا عن طريق HTTP POST.


// Function to parse sensor data
function parseSensorData(line) {
  try {
    const parts = line.trim().split(",");
    console.log('Parsing data parts:', parts);
    
    // Check if we have all 6 parts (latitude, longitude, altitude, time, temperature, humidity)
    if (parts.length !== 6) {
      console.log('Invalid data format: expected 6 parts, got', parts.length);
      return null;
    }

    const [latStr, lngStr, altStr, timeStr, tempStr, humStr] = parts;

    // Check for invalid data
    if (latStr === "*****" || lngStr === "*****" || altStr === "*****" || 
        timeStr === "*****" || tempStr === "*****" || humStr === "*****") {
      console.log('Invalid sensor data received');
      return null;
    }

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);
    const altitude = parseFloat(altStr);
    const temperature = parseFloat(tempStr);
    const humidity = parseFloat(humStr);

    // Validate numeric values
    if ([latitude, longitude, altitude, temperature, humidity].some(isNaN)) {
      console.log('Invalid numeric values in data');
      return null;
    }

    // Validate time format
    if (!/^\d\d:\d\d:\d\d$/.test(timeStr)) {
      console.log('Invalid time format');
      return null;
    }

    return {
      temperature,
      humidity,
      gps_lat: latitude,
      gps_long: longitude,
      status: 'في الطريق'
    };
  } catch (error) {
    console.error('Error parsing sensor data:', error.message);
    return null;
  }
}

// Initialize Serial Port
const serial = new SerialPort({
  path: 'COM6',
  baudRate: 9600,
  autoOpen: true,
});

const parser = new ReadlineParser();
serial.pipe(parser);

// Store the latest valid data
let latestData = null;

// Handle serial port errors
serial.on('error', (err) => {
  console.error('Serial Port Error:', err.message);
});

// Process incoming data
parser.on('data', (line) => {
  console.log('Received raw data:', line);
  const data = parseSensorData(line);
  if (!data) {
    console.log('Invalid or incomplete data received');
    return;
  }
  
  // Store the latest valid data
  latestData = data;
});

// Function to send data to server
async function sendDataToServer() {
  if (!latestData) {
    console.log('No valid data available to send');
    return;
  }

  try {
    // Send data to our Express server
    const response = await axios.post('http://localhost:3000/api/shipments/latest/status', {
      gps_lat: latestData.gps_lat,
      gps_long: latestData.gps_long,
      temperature: latestData.temperature,
      humidity: latestData.humidity,
      status: latestData.status
    });

    if (response.data.ok) {
      console.log('Data sent successfully:', {
        temperature: latestData.temperature,
        humidity: latestData.humidity,
        gps_lat: latestData.gps_lat,
        gps_long: latestData.gps_long,
        status: latestData.status
      });
    } else {
      console.error('Server returned error:', response.data.error);
    }
  } catch (error) {
    if (error.response) {
      console.error('Server error response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received from server. Is the server running?');
    } else {
      console.error('Error setting up request:', error.message);
    }
  }
}

// Send data every 60 seconds
setInterval(sendDataToServer, 60000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Closing serial port...');
  serial.close(() => {
    console.log('Serial port closed');
    process.exit();
  });
}); 
