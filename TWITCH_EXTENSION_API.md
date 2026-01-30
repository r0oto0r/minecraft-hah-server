# Twitch Extension Backend API Documentation

## Overview
This server now supports Twitch extension clients alongside the existing Minecraft server functionality. Clients can connect, authenticate, and select mob types and lanes.

## Connection

### Twitch Extension Clients
Connect to the WebSocket server without specifying a client type (or with `clientType=twitch`):

```javascript
const socket = io("http://localhost:8080", {
  transports: ["websocket"]
});
```

### Minecraft Server
Connect to the WebSocket server with `clientType=minecraft`:

```javascript
const socket = io("http://localhost:8080", {
  query: { clientType: "minecraft" },
  transports: ["websocket"]
});
```

## Message Types

### Twitch Extension Client Flow

#### 1. Authentication
**Event:** `Authenticate`

**Request:**
```javascript
{
  userId: "user123",
  token: "valid-token-at-least-10-chars"
}
```

**Response:**
```javascript
{
  success: true,
  sessionId: "socket-id-here"
}
// OR
{
  success: false,
  error: "Invalid token or user ID"
}
```

**Example:**
```javascript
socket.emit("Authenticate", {
  userId: "twitch-user-123",
  token: "my-secure-token-123"
}, (response) => {
  if (response.success) {
    console.log("Authenticated:", response.sessionId);
  } else {
    console.error("Auth failed:", response.error);
  }
});
```

#### 2. Select Mob Type
**Event:** `SelectMob`

**Request:**
```javascript
{
  mobType: "ZOMBIE" | "HUNTER" | "MINER" | "WARRIOR" | "WITCH"
}
```

**Example:**
```javascript
socket.emit("SelectMob", {
  mobType: "ZOMBIE"
});
```

#### 3. Select Lane
**Event:** `SelectLane`

**Request:**
```javascript
{
  lane: "LEFT" | "CENTER" | "RIGHT"
}
```

**Example:**
```javascript
socket.emit("SelectLane", {
  lane: "LEFT"
});
```

### Minecraft Server Flow

#### 1. Receive Full State (on connect)
**Event:** `FullStateSync`

**Data:**
```javascript
[
  {
    userId: "user123",
    mobType: "ZOMBIE",
    lane: "LEFT"
  },
  // ... more user selections
]
```

**Example:**
```javascript
socket.on("FullStateSync", (fullState) => {
  console.log("Full state received:", fullState);
  // Process all user selections
});
```

#### 2. Receive State Diffs (throttled updates)
**Event:** `StateDiff`

**Data:**
```javascript
{
  added: [
    {
      userId: "new-user",
      mobType: "WARRIOR",
      lane: "RIGHT"
    }
  ],
  updated: [
    {
      userId: "user123",
      mobType: "WITCH",
      lane: "CENTER"
    }
  ],
  removed: ["disconnected-user-id"]
}
```

**Example:**
```javascript
socket.on("StateDiff", (diff) => {
  console.log("State diff:", diff);
  // Process added users
  diff.added.forEach(user => {
    // Spawn mobs for new user
  });
  // Process updated users
  diff.updated.forEach(user => {
    // Update mobs for changed user
  });
  // Process removed users
  diff.removed.forEach(userId => {
    // Remove mobs for disconnected user
  });
});
```

## State Management

- User selections are stored in memory
- State updates are throttled to a maximum of 1 per second
- When the Minecraft server connects, it receives the full current state
- When state changes, only the diff is sent to the Minecraft server
- When a Twitch client disconnects, their state is removed

## Example Complete Flow

### Twitch Extension Client
```javascript
const io = require("socket.io-client");

const socket = io("http://localhost:8080", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  // Authenticate
  socket.emit("Authenticate", {
    userId: "twitch-user-456",
    token: "secure-token-12345"
  }, (response) => {
    if (response.success) {
      console.log("Connected and authenticated!");
      
      // Select mob type
      socket.emit("SelectMob", { mobType: "HUNTER" });
      
      // Select lane
      socket.emit("SelectLane", { lane: "CENTER" });
    }
  });
});
```

### Minecraft Server
```javascript
const io = require("socket.io-client");

const socket = io("http://localhost:8080", {
  query: { clientType: "minecraft" },
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("Minecraft server connected");
});

socket.on("FullStateSync", (fullState) => {
  console.log("Full state:", fullState);
  // Initialize game with all user selections
});

socket.on("StateDiff", (diff) => {
  console.log("State update:", diff);
  // Update game with changes
});
```

## Enums

### MobType
- `ZOMBIE`
- `HUNTER`
- `MINER`
- `WARRIOR`
- `WITCH`

### Lane
- `LEFT`
- `CENTER`
- `RIGHT`
