/**
 * Example Minecraft Server Client
 * 
 * This script demonstrates how the Minecraft server would connect
 * and receive state updates from Twitch extension clients.
 */

const io = require("socket.io-client");

// Connect to the server as a Minecraft client
const socket = io("http://localhost:8080", {
  query: { clientType: "minecraft" },
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("✓ Minecraft server connected");
});

// Receive full state on connection
socket.on("FullStateSync", (fullState) => {
  console.log("\n=== FULL STATE RECEIVED ===");
  console.log(`Total users: ${fullState.length}`);
  
  fullState.forEach((user, index) => {
    console.log(`  ${index + 1}. User: ${user.userId}`);
    console.log(`     Mob Type: ${user.mobType}`);
    console.log(`     Lane: ${user.lane}`);
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
      console.log(`  + ${user.userId}: ${user.mobType} in ${user.lane} lane`);
    });
  }
  
  if (diff.updated.length > 0) {
    console.log(`Updated users (${diff.updated.length}):`);
    diff.updated.forEach(user => {
      console.log(`  ~ ${user.userId}: ${user.mobType} in ${user.lane} lane`);
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
console.log("Press Ctrl+C to exit\n");
