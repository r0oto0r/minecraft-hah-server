import { Application, Request, Response } from "express";
import { MessageTypes, SpawnMob } from "../Interfaces/Interfaces";
import { Log } from "../Log";
import { SocketServer } from "../SocketServer";

export class MobHandler {
	public static async init(app: Application) {
		app.post("/spawn-mob/", async (req: Request, res: Response) => {
			try {
				for(const spawnMob of req.body) {
					Log.info(`Mob spawned: ${spawnMob.id}`);
					SocketServer.emit(MessageTypes.SpawnMob, spawnMob);
				}

				res.status(200).send();
			} catch (error: any) {
				Log.error(`Error occured: ${error}`);
				res.status(500).send();
			}
		});
	}
}
