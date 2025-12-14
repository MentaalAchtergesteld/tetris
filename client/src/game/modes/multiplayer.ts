import { Game, RNG } from "@tetris/shared";
import { io, Socket } from "socket.io-client";
import { GameContext, GameMode } from "../modes";
import { LocalController } from "../../engine/input/controller";
import { GameAction } from "@tetris/shared";
import { EventEmitter } from "@tetris/shared";
import { GameTheme } from "../../theme";
import { Widget } from "../../ui/widget";
import { InputManager } from "../../engine/input/input_manager";
import { StandardGame } from "../../ui/widgets/standard_game";
import { Label } from "../../ui/widgets/label";
import { DangerLevel } from "../danger";
import { Recoil, Shaker } from "../../ui/widgets/effects";
import { HBox } from "../../ui/widgets/layout";

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

enum GameState {
	Queue,
	Lobby,
	Ready,
	Running,
	Finished,
	Gameover
};

export class MultiplayerMode implements GameMode {
	private input: InputManager;

	private localGame: Game;
	private localRng: RNG;
	private localController: LocalController;
	private dangerLevel: DangerLevel;

	private remoteGame: Game;
	private remoteRNG: RNG;

	private context: GameContext;

	private layout: Widget;
	private shaker: Shaker;
	private recoil: Recoil;

	private countdownTimer: number = 2;

	constructor() {
		this.input = new InputManager();

		this.localRng = new RNG(0);
		this.localGame = new Game(this.localRng);
		this.localController = new LocalController(this.localGame, this.input);

		this.remoteRNG = new RNG(0);
		this.remoteGame = new Game(this.localRng);

		this.layout = this.buildLayout();
		this.dangerLevel = new DangerLevel(this.localGame, this.shaker);
	}

	buildGameLayout(game: Game, isLocal: boolean): Widget {
		const labelText = isLocal ? "you" : "other";
		const dangerProvider = isLocal ? () => this.dangerLevel.getLevel() : () => 0;
		return new StandardGame(game, [
			new Label(() => labelText, "title", "right"),
		], dangerProvider, () => this.countdownTimer+1);
	}

	buildLayout(): Widget {
		const localGame = this.buildGameLayout(this.localGame, true);
		const remoteGame = this.buildGameLayout(this.remoteGame, false)

		const gameLayout = HBox([localGame, remoteGame]);
	}

	onEnter(ctx: GameContext): void {
		this.context = ctx;  
	}

	onExit(): void {
	  this.context = null; 
	}

	update(dt: number): void {
		this.input.update();  
	}

	draw(ctx: CanvasRenderingContext2D, theme: GameTheme): void {
	    
	}
}
