# Twitch Extension Backend API Documentation

## Overview
This server supports Twitch extension clients alongside the existing Minecraft server functionality. The server operates in two modes:

- **Single Channel Mode**: Users must select a team before selecting mob types
- **Dual Channel Mode**: Channel names are used instead of teams

The mode is set by the Minecraft server and communicated to clients during authentication.

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

## Channel Modes

### Single Channel Mode
- Users must select a **team** before selecting mob types
- Team selection is required for mob spawning
- Used when running a single channel event

### Dual Channel Mode
- Users provide their **channel name** during authentication
- No team selection required
- Used when running dual channel events

## Message Types

### Twitch Extension Client Flow

#### 1. Authentication
**Event:** `Authenticate`

**Request:**
```javascript
{
  userId: "user123",
  token: "valid-token-at-least-10-chars",
  channelName?: "channel-name" // Required in dual channel mode
}
```

**Response:**
```javascript
{
  success: true,
  sessionId: "socket-id-here",
  mode: "SINGLE" | "DUAL"
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
  token: "my-secure-token-123",
  channelName: "my-channel" // Include in dual channel mode
}, (response) => {
  if (response.success) {
    console.log("Authenticated:", response.sessionId);
    console.log("Mode:", response.mode);
  } else {
    console.error("Auth failed:", response.error);
  }
});
```

#### 2. Select Team (Single Channel Mode Only)
**Event:** `SelectTeam`

**Request:**
```javascript
{
  team: "team-name"
}
```

**Example:**
```javascript
// Must be called BEFORE selecting mob type in single channel mode
socket.emit("SelectTeam", {
  team: "red"
});
```

**Note:** Team selection is only valid in single channel mode. In dual channel mode, this message is ignored.

#### 3. Select Mob Type
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

**Important:** In single channel mode, you must call `SelectTeam` first, or the mob selection will be ignored.

#### 4. Select Lane
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

#### 1. Set Mode
**Event:** `SetMode`

The Minecraft server can change the mode at any time.

**Request:**
```javascript
{
  mode: "SINGLE" | "DUAL"
}
```

**Example:**
```javascript
socket.emit("SetMode", {
  mode: "SINGLE"
});
```

#### 2. Receive Full State (on connect)
**Event:** `FullStateSync`

**Data:**
```javascript
[
  {
    userId: "user123",
    mobType: "ZOMBIE",
    lane: "LEFT",
    team?: "red",           // Present in single channel mode
    channelName?: "channel" // Present in dual channel mode
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

#### 3. Receive State Diffs (throttled updates)
**Event:** `StateDiff`

**Data:**
```javascript
{
  added: [
    {
      userId: "new-user",
      mobType: "WARRIOR",
      lane: "RIGHT",
      team?: "blue",
      channelName?: "new-channel"
    }
  ],
  updated: [
    {
      userId: "user123",
      mobType: "WITCH",
      lane: "CENTER",
      team?: "red",
      channelName?: "channel"
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

## Mode-Specific Behaviors

### Single Channel Mode
1. Client authenticates with userId and token
2. Client **must** select a team using `SelectTeam`
3. Client selects mob type (only allowed after team is selected)
4. Client selects lane
5. State includes `team` field

### Dual Channel Mode
1. Client authenticates with userId, token, and channelName
2. Client selects mob type (no team selection required)
3. Client selects lane
4. State includes `channelName` field

## Example Complete Flows

### Single Channel Mode - Twitch Extension Client
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
    if (response.success && response.mode === "SINGLE") {
      console.log("Connected in SINGLE mode!");
      
      // Must select team first
      socket.emit("SelectTeam", { team: "red" });
      
      // Then select mob type
      socket.emit("SelectMob", { mobType: "HUNTER" });
      
      // And lane
      socket.emit("SelectLane", { lane: "CENTER" });
    }
  });
});
```

### Dual Channel Mode - Twitch Extension Client
```javascript
const io = require("socket.io-client");

const socket = io("http://localhost:8080", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  // Authenticate with channel name
  socket.emit("Authenticate", {
    userId: "twitch-user-789",
    token: "secure-token-12345",
    channelName: "mychannel"
  }, (response) => {
    if (response.success && response.mode === "DUAL") {
      console.log("Connected in DUAL mode!");
      
      // No team selection needed in dual mode
      // Select mob type directly
      socket.emit("SelectMob", { mobType: "WARRIOR" });
      
      // And lane
      socket.emit("SelectLane", { lane: "RIGHT" });
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
  
  // Set the mode (single or dual channel)
  socket.emit("SetMode", { mode: "SINGLE" });
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

### ChannelMode
- `SINGLE` - Single channel mode (requires team selection)
- `DUAL` - Dual channel mode (uses channel names)
