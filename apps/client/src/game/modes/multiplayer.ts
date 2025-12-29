import { io, Socket } from "socket.io-client";

export class NetworkClient {
	private socket: Socket;

	constructor(url: string) {
		this.socket = io(url, {
			autoConnect: false
		});
	}

	connect() {
		this.socket.connect();
	}

	disconnect() {
		this.socket.disconnect();
	}

	send<T extends keyof C2sEvents>
}
