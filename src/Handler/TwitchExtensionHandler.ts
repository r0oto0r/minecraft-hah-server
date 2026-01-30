import * as socketio from "socket.io";
import { MessageTypes, AuthRequest, AuthResponse, SelectMobRequest, SelectLaneRequest } from "../Interfaces/Interfaces";
import { Log } from "../Log";
import { UserStateManager } from "../Services/UserStateManager";
import { SocketServer } from "../SocketServer";

export class TwitchExtensionHandler {
	private static authenticatedUsers: Map<string, string> = new Map(); // socketId -> userId

	/**
	 * Initialize the Twitch Extension handler
	 */
	public static init() {
		Log.info("Initializing Twitch Extension Handler");

		// Set up the state update callback to send diffs to Minecraft server
		UserStateManager.setUpdateCallback((diff) => {
			SocketServer.in("minecraft").emit(MessageTypes.StateDiff, diff);
		});
	}

	/**
	 * Handle a new socket connection
	 * @param socket The connected socket
	 */
	public static handleConnection(socket: socketio.Socket) {
		// Listen for authentication
		socket.on(MessageTypes.Authenticate, (authRequest: AuthRequest, callback?: Function) => {
			this.handleAuthentication(socket, authRequest, callback);
		});

		// Listen for mob type selection
		socket.on(MessageTypes.SelectMob, (request: SelectMobRequest) => {
			this.handleMobSelection(socket, request);
		});

		// Listen for lane selection
		socket.on(MessageTypes.SelectLane, (request: SelectLaneRequest) => {
			this.handleLaneSelection(socket, request);
		});

		// Handle disconnect
		socket.on("disconnect", () => {
			this.handleDisconnect(socket);
		});
	}

	/**
	 * Handle Minecraft server connection
	 * @param socket The Minecraft server socket
	 */
	public static handleMinecraftConnection(socket: socketio.Socket) {
		Log.info("Minecraft server connected");
		
		// Join the minecraft room
		SocketServer.join(socket, "minecraft");

		// Send full state to Minecraft server
		const fullState = UserStateManager.getFullState();
		socket.emit(MessageTypes.FullStateSync, fullState);
		Log.info(`Sent full state to Minecraft server: ${fullState.length} users`);
	}

	/**
	 * Handle authentication request
	 * @param socket The socket requesting authentication
	 * @param authRequest Authentication request data
	 * @param callback Optional callback function
	 */
	private static handleAuthentication(
		socket: socketio.Socket,
		authRequest: AuthRequest,
		callback?: Function
	) {
		const { userId, token } = authRequest;

		// Simple token validation (in production, this would verify against a real auth service)
		if (!userId || !token || token.length < 10) {
			const response: AuthResponse = {
				success: false,
				error: "Invalid token or user ID"
			};
			
			if (callback) {
				callback(response);
			}
			
			Log.warn(`Authentication failed for user ${userId}`);
			socket.disconnect();
			return;
		}

		// Store the authenticated user
		this.authenticatedUsers.set(socket.id, userId);
		SocketServer.join(socket, "twitch-extensions");

		const response: AuthResponse = {
			success: true,
			sessionId: socket.id
		};

		if (callback) {
			callback(response);
		}

		Log.info(`User ${userId} authenticated successfully (session: ${socket.id})`);
	}

	/**
	 * Handle mob type selection
	 * @param socket The socket making the selection
	 * @param request Mob selection request
	 */
	private static handleMobSelection(socket: socketio.Socket, request: SelectMobRequest) {
		const userId = this.authenticatedUsers.get(socket.id);

		if (!userId) {
			Log.warn(`Unauthenticated socket ${socket.id} attempted mob selection`);
			socket.disconnect();
			return;
		}

		UserStateManager.updateUserMobType(userId, request.mobType);
	}

	/**
	 * Handle lane selection
	 * @param socket The socket making the selection
	 * @param request Lane selection request
	 */
	private static handleLaneSelection(socket: socketio.Socket, request: SelectLaneRequest) {
		const userId = this.authenticatedUsers.get(socket.id);

		if (!userId) {
			Log.warn(`Unauthenticated socket ${socket.id} attempted lane selection`);
			socket.disconnect();
			return;
		}

		UserStateManager.updateUserLane(userId, request.lane);
	}

	/**
	 * Handle socket disconnection
	 * @param socket The disconnecting socket
	 */
	private static handleDisconnect(socket: socketio.Socket) {
		const userId = this.authenticatedUsers.get(socket.id);

		if (userId) {
			UserStateManager.removeUser(userId);
			this.authenticatedUsers.delete(socket.id);
			Log.info(`User ${userId} disconnected`);
		}
	}
}
