/**
 * Example Minecraft Server Client
 * 
 * This script demonstrates how the Minecraft server would connect,
 * set the channel mode, and receive state updates from Twitch extension clients.
 */

const io = require("socket.io-client");

// Connect to the server as a Minecraft client
const socket = io("http://localhost:8080", {
  query: { clientType: "minecraft" },
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("✓ Minecraft server connected");
  
  // Set the channel mode (SINGLE or DUAL)
  // You can change this to test different modes
  const mode = process.argv[2] || "SINGLE"; // Default to SINGLE, can pass DUAL as argument
  
  console.log(`Setting mode to: ${mode}`);
  socket.emit("SetMode", { mode: mode });
});

// Receive full state on connection
socket.on("FullStateSync", (fullState) => {
  console.log("\n=== FULL STATE RECEIVED ===");
  console.log(`Total users: ${fullState.length}`);
  
  fullState.forEach((user, index) => {
    console.log(`  ${index + 1}. User: ${user.userId}`);
    console.log(`     Mob Type: ${user.mobType}`);
    console.log(`     Lane: ${user.lane}`);
    if (user.team) {
      console.log(`     Team: ${user.team}`);
    }
    if (user.channelName) {
      console.log(`     Channel: ${user.channelName}`);
    }
  });
  
  if (fullState.length === 0) {
    console.log("  (no users currently connected)");
  }
  console.log("===========================\n");
});

// Receive state diffs (throttled updates)
socket.on("StateDiff", (diff) => {
  console.log("\n=== STATE DIFF RECEIVED ===");
  
  if (diff.added.length > 0) {
    console.log(`Added users (${diff.added.length}):`);
    diff.added.forEach(user => {
      let details = `${user.mobType} in ${user.lane} lane`;
      if (user.team) details += ` (team: ${user.team})`;
      if (user.channelName) details += ` (channel: ${user.channelName})`;
      console.log(`  + ${user.userId}: ${details}`);
    });
  }
  
  if (diff.updated.length > 0) {
    console.log(`Updated users (${diff.updated.length}):`);
    diff.updated.forEach(user => {
      let details = `${user.mobType} in ${user.lane} lane`;
      if (user.team) details += ` (team: ${user.team})`;
      if (user.channelName) details += ` (channel: ${user.channelName})`;
      console.log(`  ~ ${user.userId}: ${details}`);
    });
  }
  
  if (diff.removed.length > 0) {
    console.log(`Removed users (${diff.removed.length}):`);
    diff.removed.forEach(userId => {
      console.log(`  - ${userId}`);
    });
  }
  
  console.log("===========================\n");
});

socket.on("disconnect", () => {
  console.log("✓ Disconnected from server");
  process.exit(0);
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
  process.exit(1);
});

// Keep the script running
console.log("Minecraft server listening for state updates...");
console.log("Usage: node minecraft-server.js [SINGLE|DUAL]");
console.log("Press Ctrl+C to exit\n");
