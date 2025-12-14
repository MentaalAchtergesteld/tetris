import { GameAction } from "@tetris/shared";
import { EventEmitter } from "@tetris/shared";
import { io, Socket } from "socket.io-client";

export interface MatchStartPacket {
	seed: number;
	opponentId: string;
}

export interface NetworkEvents {
	"connect": string,
	"connectError": string,
	"joinQueue": void,
	"matchStart": {
		seed: number,
		opponentId: string,
	},
	"action": GameAction,
	"garbage": number,
}

export class NetworkClient {
	private socket: Socket;
	public events: EventEmitter<NetworkEvents>;

	constructor() {
		this.socket = io("http://localhost:9000", {
			autoConnect: false,
		});

		this.events = new EventEmitter();

		this.setupEvents();
	}

	public connect() {
		this.socket.connect();
	}

	public disconnect() {
		this.socket.disconnect();
	}

	private setupEvents() {
		this.socket.on("connect", () => {
			this.events.emit("connect", this.socket.id);
		});

		this.socket.on("connect_error", (err) => {
			this.events.emit("connectError", err.message);
		});

		this.socket.on("match_start", (packet: MatchStartPacket) => {
			this.events.emit("matchStart", packet);
		});

		this.socket.on("action", (action: GameAction) => {
			this.events.emit("action", action);
		});

		this.socket.on("garbage", (amount: number) => {
			this.events.emit("garbage", amount);
		});
	}

	public joinQueue() {
		this.socket.emit("join_queue");
		this.events.emit("joinQueue", undefined);
	}

	public sendAction(action: GameAction, data: number = 0) {
		this.socket.emit("action", { action, data });
	}
}
