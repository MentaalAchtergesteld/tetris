import { io, Socket } from "socket.io-client";

export class NetworkClient {
	public socket: Socket;

	constructor() {
		this.socket = io("http://localhost:9000", {
			autoConnect: false,
		});

		this.setupDebugEvents();
	}

	public connect() {
		this.socket.connect();
	}

	private setupDebugEvents() {
		this.socket.on("connect", () => {
			console.log(`Connected with server! ID: ${this.socket.id}`);
		});

		this.socket.on("connect_error", (err) => {
			console.log(`Connection error: ${err.message}`);
		});

		this.socket.on("match_start", (data: { seed: number, opponentId: string }) => {
			console.log(`Match start! Playing against ${data.opponentId} | Seed: ${data.seed}`);
		});
	}

	public joinQueue() {
		console.log("Joining queue...");
		this.socket.emit("join_queue");
	}
}
