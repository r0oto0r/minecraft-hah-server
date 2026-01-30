/**
 * Example Twitch Extension Client - Dual Channel Mode
 * 
 * This script demonstrates how a Twitch extension client would connect,
 * authenticate with a channel name, and select mob types and lanes in
 * dual channel mode (no team selection required).
 */

const io = require("socket.io-client");

// Connect to the server
const socket = io("http://localhost:8080", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("✓ Connected to server");
  
  // Authenticate with user ID, token, and channel name
  const userId = `twitch-user-${Math.floor(Math.random() * 1000)}`;
  const token = "valid-token-1234567890"; // Must be at least 10 characters
  const channelName = `channel-${Math.floor(Math.random() * 100)}`;
  
  console.log(`Authenticating as ${userId} (channel: ${channelName})...`);
  
  socket.emit("Authenticate", {
    userId: userId,
    token: token,
    channelName: channelName
  }, (response) => {
    if (response.success) {
      console.log(`✓ Authenticated successfully! Session ID: ${response.sessionId}`);
      console.log(`✓ Mode: ${response.mode}`);
      
      if (response.mode === "DUAL") {
        // In dual channel mode, no team selection needed
        // Select mob type directly
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
        console.log("⚠️  Server is not in DUAL mode!");
        socket.disconnect();
      }
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
