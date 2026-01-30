import * as socketio from "socket.io";
import { MessageTypes, AuthRequest, AuthResponse, SelectMobRequest, SelectLaneRequest, SelectTeamRequest, SetModeRequest, ChannelMode } from "../Interfaces/Interfaces";
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

		// Listen for team selection (single channel mode)
		socket.on(MessageTypes.SelectTeam, (request: SelectTeamRequest) => {
			this.handleTeamSelection(socket, request);
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

		// Listen for mode changes from Minecraft server
		socket.on(MessageTypes.SetMode, (request: SetModeRequest) => {
			this.handleSetMode(request);
		});

		// Send full state to Minecraft server
		const fullState = UserStateManager.getFullState();
		socket.emit(MessageTypes.FullStateSync, fullState);
		Log.info(`Sent full state to Minecraft server: ${fullState.length} users`);
	}

	/**
	 * Handle mode change request from Minecraft server
	 * @param request Set mode request
	 */
	private static handleSetMode(request: SetModeRequest) {
		UserStateManager.setMode(request.mode);
		Log.info(`Mode changed to: ${request.mode}`);
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
		const { userId, token, channelName } = authRequest;

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

		// In dual channel mode, set the channel name
		if (UserStateManager.getMode() === ChannelMode.DUAL && channelName) {
			UserStateManager.setUserChannelName(userId, channelName);
		}

		const response: AuthResponse = {
			success: true,
			sessionId: socket.id,
			mode: UserStateManager.getMode()
		};

		if (callback) {
			callback(response);
		}

		Log.info(`User ${userId} authenticated successfully (session: ${socket.id}, mode: ${UserStateManager.getMode()})`);
	}

	/**
	 * Handle team selection (single channel mode only)
	 * @param socket The socket making the selection
	 * @param request Team selection request
	 */
	private static handleTeamSelection(socket: socketio.Socket, request: SelectTeamRequest) {
		const userId = this.authenticatedUsers.get(socket.id);

		if (!userId) {
			Log.warn(`Unauthenticated socket ${socket.id} attempted team selection`);
			socket.disconnect();
			return;
		}

		// Team selection is only relevant in single channel mode
		if (UserStateManager.getMode() !== ChannelMode.SINGLE) {
			Log.warn(`User ${userId} attempted team selection in ${UserStateManager.getMode()} mode`);
			return;
		}

		UserStateManager.updateUserTeam(userId, request.team);
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

		// In single channel mode, team must be set before mob selection
		if (!UserStateManager.canSelectMob(userId)) {
			Log.warn(`User ${userId} attempted mob selection without team in single channel mode`);
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
