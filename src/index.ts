import { Log } from './Log';
import config from 'config';
import http from "http";
import { ExpressServer } from './ExpressServer';
import { SocketServer } from './SocketServer';
import { MobHandler } from './Handler/MobHandler';

(async () => {
    try {
		Log.info(`Booting Minecraft HaH Server Version ${process.env.npm_package_version}`);

		const app =	ExpressServer.init();

		const httpServer = http.createServer(app);
		const port = config.has("port") ? config.get("port") : 8080;

		SocketServer.init(httpServer);
		
		httpServer.listen(port, (): void => {
            Log.info(`Accepting connections on port ${port}`);
        });

		await MobHandler.init(app);
    } catch (error: any) {
        Log.error(`Error occured: ${error}`);
    }
})();
