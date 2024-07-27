import { io, Socket } from 'socket.io-client';
import { Log } from "./Log";

export class SocketClient {
	private socket: Socket;
	private connected: boolean;
	private serverAddress: string;

	public constructor(address: string) {
		this.serverAddress = address;
		this.connected = false;

		this.connectToServer();
	}

	public connectToServer() {
		if(!this.connected) {
			this.initSocket();
		}
	}

	public disconnectFromServer() {
		if(this.socket) {
			this.socket.offAny();
			this.socket.disconnect();
			this.socket.close();
		}
	}

	private initSocket() {
		if(this.socket) {
			this.socket.offAny();
			this.socket.disconnect();
			this.socket.close();
		}

		Log.info(`Connecting to ${this.serverAddress}`);

		this.socket = io(this.serverAddress, {
			transports: [ 'websocket' ]
		});

		this.socket.on('connect', () => {
			Log.info(`Connected to ${this.serverAddress}`);
			this.connected = true;
		});

		this.socket.on('disconnect', () => {
			Log.warn(`Disconnected from ${this.serverAddress}`);
			this.connected = false;
		});

		this.socket.on('Error', error => {
			Log.error(error);
		});
	}

	public emit(messageType: string, data?: any, callback?: Function) {
		if(this.connected) {
			this.socket.emit(messageType, data, callback);
		}
	}

	public on(messageType: string, callback: (data: any) => void) {
		this.socket.on(messageType, callback);
	}

	public get isConnected(): boolean {
		return this.connected;
	}
}
