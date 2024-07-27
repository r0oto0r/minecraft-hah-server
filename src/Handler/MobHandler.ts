import { Application, Request, Response } from "express";
import { MessageTypes, SpawnMob } from "../Interfaces/Interfaces";
import { Log } from "../Log";
import { SocketServer } from "../SocketServer";

export class MobHandler {
	public static async init(app: Application) {
		app.post("/spawn-mob/", async (req: Request, res: Response) => {
			try {
				const spawnMob: SpawnMob = {
					id: req.body.id,
					team: req.body.team,
					lane: req.body.lane,
					count: req.body.count,
					customNames: req.body.customNames
				};
				Log.info(`Mob spawned: ${spawnMob.id}`);
				SocketServer.emit(MessageTypes.SpawnMob, spawnMob);

				res.status(200).send();
			} catch (error: any) {
				Log.error(`Error occured: ${error}`);
				res.status(500).send();
			}
		});
	}
}
