/**
 * Example Twitch Extension Client
 * 
 * This script demonstrates how a Twitch extension client would connect,
 * authenticate, and select mob types and lanes.
 */

const io = require("socket.io-client");

// Connect to the server
const socket = io("http://localhost:8080", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("✓ Connected to server");
  
  // Authenticate with user ID and token
  const userId = `twitch-user-${Math.floor(Math.random() * 1000)}`;
  const token = "valid-token-1234567890"; // Must be at least 10 characters
  
  console.log(`Authenticating as ${userId}...`);
  
  socket.emit("Authenticate", {
    userId: userId,
    token: token
  }, (response) => {
    if (response.success) {
      console.log(`✓ Authenticated successfully! Session ID: ${response.sessionId}`);
      
      // Wait a moment, then select a mob type
      setTimeout(() => {
        const mobTypes = ["ZOMBIE", "HUNTER", "MINER", "WARRIOR", "WITCH"];
        const selectedMob = mobTypes[Math.floor(Math.random() * mobTypes.length)];
        
        console.log(`Selecting mob type: ${selectedMob}`);
        socket.emit("SelectMob", { mobType: selectedMob });
      }, 1000);
      
      // Wait a moment, then select a lane
      setTimeout(() => {
        const lanes = ["LEFT", "CENTER", "RIGHT"];
        const selectedLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        console.log(`Selecting lane: ${selectedLane}`);
        socket.emit("SelectLane", { lane: selectedLane });
      }, 2000);
      
      // Disconnect after 5 seconds
      setTimeout(() => {
        console.log("Disconnecting...");
        socket.disconnect();
      }, 5000);
    } else {
      console.error(`✗ Authentication failed: ${response.error}`);
      socket.disconnect();
    }
  });
});

socket.on("disconnect", () => {
  console.log("✓ Disconnected from server");
  process.exit(0);
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
  process.exit(1);
});
