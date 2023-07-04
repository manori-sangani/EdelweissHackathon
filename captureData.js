const { spawn } = require('child_process');
const WebSocket = require('ws');

const javaCommand = 'java';
const javaArgs = [
  '-Ddebug=true',
  '-Dspeed=2.0',
  '-classpath',
  'D:\\Manori_React_Projs\\edel_socket\\feed-play-1.0.jar',
  'hackathon.player.Main',
  'D:\\Manori_React_Projs\\edel_socket\\dataset.csv',
  '9011',
];

// Spawn the Java process
const javaProcess = spawn(javaCommand, javaArgs);

// Create a WebSocket connection to the server
const socket = new WebSocket('ws://localhost:8080/data');

// Function to convert the captured packet into JSON format
const convertPacketToJSON = (packet) => {
    const keyValuePairs = packet.match(/[^{}=,]+=[^{}=,]+/g); // Extract key-value pairs from the packet
  
    const jsonData = {};
  
    keyValuePairs.forEach((pair) => {
      const [key, value] = pair.split('='); // Split each pair into key and value
  
      let parsedValue = value.replace(/'/g, '').trim(); // Remove surrounding single quotes from the value
  
      // Check if the parsed value is a number
      if (!isNaN(parsedValue)) {
        parsedValue = Number(parsedValue); // Convert the value to a number
      }
  
      // Add the key-value pair to the JSON object
      jsonData[key.trim()] = parsedValue;
    });
  
    return jsonData;
  };  
  

// Capture the standard output of the Java process and forward it to the WebSocket server
javaProcess.stdout.on('data', (data) => {
    const packet = data.toString().trim(); // Assuming each line is a packet, adjust as per your data format
    try {
      const jsonData = convertPacketToJSON(packet); // Convert the packet to JSON format
      socket.send(JSON.stringify(jsonData)); // Send the JSON-formatted data to the server
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });

// Handle any errors or process exit
javaProcess.on('error', (err) => {
  console.error('Java process error:', err);
});

javaProcess.on('exit', (code, signal) => {
  console.log(`Java process exited with code ${code} and signal ${signal}`);
  socket.close();
});
