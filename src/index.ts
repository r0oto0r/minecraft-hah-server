import { Log } from './Log';
import config from 'config';
import http from "http";
import { ExpressServer } from './ExpressServer';
import { SocketServer } from './SocketServer';
import { MobHandler } from './Handler/MobHandler';
import { TwitchExtensionHandler } from './Handler/TwitchExtensionHandler';

(async () => {
    try {
		Log.info(`Booting Minecraft HaH Server Version ${process.env.npm_package_version}`);

		const app =	ExpressServer.init();

		const httpServer = http.createServer(app);
		const port = config.has("port") ? config.get("port") : 8080;

		SocketServer.init(httpServer);

		// Initialize Twitch Extension Handler
		TwitchExtensionHandler.init();

		// Set up connection handler to route connections appropriately
		SocketServer.setConnectionHandler((socket) => {
			// Check for client type in handshake query
			const clientType = socket.handshake.query.clientType as string;

			if (clientType === "minecraft") {
				TwitchExtensionHandler.handleMinecraftConnection(socket);
			} else {
				// Default to Twitch extension client
				TwitchExtensionHandler.handleConnection(socket);
			}
		});
		
		httpServer.listen(port, (): void => {
            Log.info(`Accepting connections on port ${port}`);
        });

		await MobHandler.init(app);
    } catch (error: any) {
        Log.error(`Error occured: ${error}`);
    }
})();
