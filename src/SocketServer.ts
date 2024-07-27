import * as socketio from "socket.io";
import http from "http";
import { Log } from "./Log";

export class SocketServer {
	private static io: socketio.Server;
	private static clients: Map<string, socketio.Socket> = new Map<string, socketio.Socket>();

	public static init(httpServer: http.Server) {
		Log.info("Initializing Socket server");

		this.io = new socketio.Server(httpServer, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"]
			},
			allowEIO3: true,
			transports: ["websocket"]
		});

		this.io.on("connection", (socket) => {
			Log.info("Client connected");

			this.clients.set(socket.id, socket);

			socket.on("disconnect", () => {
				this.clients.delete(socket.id);
				Log.info("Client disconnected");
			});
		});
	}

	public static emit(messageType: string, data?: any, callback?: Function) {
		return this.io.emit(messageType, data, callback);
	}

	public static on(messageType: string, callback: (data: any) => void) {
		this.io.on(messageType, callback);
	}

	public static in(room: string) {
		return this.io.in(room);
	}

	public static join(socket: socketio.Socket, room: string) {
		socket.join(room);
	}
}
