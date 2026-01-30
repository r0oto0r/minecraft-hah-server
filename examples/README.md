# Example Client Scripts

This directory contains example client scripts that demonstrate how to interact with the Twitch extension backend in both single and dual channel modes.

## Prerequisites

Make sure the server is running:
```bash
npm start
```

## Channel Modes

The server supports two modes:

### Single Channel Mode
- Users must select a **team** before selecting mob types
- Used for single channel events
- Example: `twitch-client-single-mode.js`

### Dual Channel Mode
- Users provide their **channel name** during authentication
- No team selection required
- Example: `twitch-client-dual-mode.js`

## Running the Examples

### Minecraft Server Example
This simulates the Minecraft server connecting, setting the mode, and receiving state updates:

```bash
# Run in single channel mode (default)
node examples/minecraft-server.js

# Run in dual channel mode
node examples/minecraft-server.js DUAL
```

This will:
- Connect to the server as a Minecraft client
- Set the channel mode (SINGLE or DUAL)
- Receive the full state on connection
- Listen for state diff updates
- Display all updates in the console

### Twitch Extension Client Examples

#### Single Channel Mode
This simulates a Twitch extension client in single channel mode:

```bash
node examples/twitch-client-single-mode.js
```

This will:
- Connect to the server
- Authenticate with a random user ID
- Select a random team (red or blue)
- Select a random mob type
- Select a random lane
- Disconnect after 5 seconds

#### Dual Channel Mode
This simulates a Twitch extension client in dual channel mode:

```bash
node examples/twitch-client-dual-mode.js
```

This will:
- Connect to the server
- Authenticate with a random user ID and channel name
- Select a random mob type (no team selection needed)
- Select a random lane
- Disconnect after 5 seconds

#### Legacy Example (Auto-detects mode)
```bash
node examples/twitch-client.js
```

This is the original example that works regardless of the server mode.

## Testing the Full Flow

### Single Channel Mode Test

1. Start the server:
   ```bash
   npm start
   ```

2. In another terminal, start the Minecraft server in SINGLE mode:
   ```bash
   node examples/minecraft-server.js SINGLE
   ```

3. In another terminal, run the single channel mode Twitch client:
   ```bash
   node examples/twitch-client-single-mode.js
   ```

4. Watch the Minecraft server terminal to see:
   - Team selection
   - Mob and lane selections
   - State updates with team information

### Dual Channel Mode Test

1. Start the server:
   ```bash
   npm start
   ```

2. In another terminal, start the Minecraft server in DUAL mode:
   ```bash
   node examples/minecraft-server.js DUAL
   ```

3. In another terminal, run the dual channel mode Twitch client:
   ```bash
   node examples/twitch-client-dual-mode.js
   ```

4. Watch the Minecraft server terminal to see:
   - No team selection required
   - Mob and lane selections
   - State updates with channel name information

## Expected Output

### Single Channel Mode
```
Minecraft server connected
Setting mode to: SINGLE
✓ Connected to server
Authenticating as twitch-user-123...
✓ Authenticated successfully! Session ID: abc123
✓ Mode: SINGLE
Selecting team: red
Selecting mob type: WARRIOR
Selecting lane: LEFT

=== STATE DIFF RECEIVED ===
Added users (1):
  + twitch-user-123: WARRIOR in LEFT lane (team: red)
===========================
```

### Dual Channel Mode
```
Minecraft server connected
Setting mode to: DUAL
✓ Connected to server
Authenticating as twitch-user-456 (channel: channel-42)...
✓ Authenticated successfully! Session ID: def456
✓ Mode: DUAL
Selecting mob type: HUNTER
Selecting lane: CENTER

=== STATE DIFF RECEIVED ===
Added users (1):
  + twitch-user-456: HUNTER in CENTER lane (channel: channel-42)
===========================
```
