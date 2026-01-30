# Example Client Scripts

This directory contains example client scripts that demonstrate how to interact with the Twitch extension backend.

## Prerequisites

Make sure the server is running:
```bash
npm start
```

## Running the Examples

### Minecraft Server Example
This simulates the Minecraft server connecting and receiving state updates:

```bash
node examples/minecraft-server.js
```

This will:
- Connect to the server as a Minecraft client
- Receive the full state on connection
- Listen for state diff updates
- Display all updates in the console

### Twitch Extension Client Example
This simulates a Twitch extension client connecting, authenticating, and making selections:

```bash
node examples/twitch-client.js
```

This will:
- Connect to the server
- Authenticate with a random user ID
- Select a random mob type
- Select a random lane
- Disconnect after 5 seconds

## Testing the Full Flow

1. Start the server:
   ```bash
   npm start
   ```

2. In another terminal, start the Minecraft server example:
   ```bash
   node examples/minecraft-server.js
   ```

3. In another terminal, run the Twitch client example (multiple times if desired):
   ```bash
   node examples/twitch-client.js
   ```

4. Watch the Minecraft server terminal to see state updates being received.
