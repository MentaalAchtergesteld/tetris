import { ActionPayload, Client2ServerEvents, Game, GarbagePayload, LobbyState, LobbyStatePayload, MatchEndPayload, MatchStartPayload, PacketType, RNG, Server2ClientEvents } from "@tetris/shared";
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
import { Center, HBox, Overlay, SizedBox, VBox } from "../../ui/widgets/layout";
import { Conditional, Switch } from "../../ui/widgets/logic";
import { ColorBlock } from "../../ui/widgets/color_block";

export interface MatchStartPacket {
	seed: number;
	opponentId: string;
}

export interface NetworkEvents {
	"connect": string,
	"connectError": string,
	"joinQueue": void,
	"lobbyState": LobbyStatePayload,
	"matchStart": MatchStartPayload,
	"matchEnd": MatchEndPayload,
	"action": ActionPayload,
	"garbage": GarbagePayload,
}

export class NetworkClient {
	private socket: Socket<Server2ClientEvents, Client2ServerEvents>;
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

		this.socket.on(PacketType.LobbyState, (data) => this.events.emit("lobbyState", data));

		this.socket.on(PacketType.MatchStart, (data) => {
			this.events.emit("matchStart", data);
		});

		this.socket.on(PacketType.MatchEnd, (data) => {
			this.events.emit("matchEnd", data);
		});

		this.socket.on(PacketType.Action, (data) => {
			this.events.emit("action", data);
		});

		this.socket.on(PacketType.GarbageIn, (data) => {
			this.events.emit("garbage", data);
		});
	}

	public joinQueue() {
		this.socket.emit(PacketType.JoinQueue);
		this.events.emit("joinQueue", undefined);
	}

	public sendAction(action: GameAction, data: number = 0) {
		this.socket.emit(PacketType.Action, { action, data });
	}
}

enum GameState {
	JoiningQueue,
	Queue,
	WaitingForOpp,
	WaitingForReady,
	Ready,
	Running,
	Finished,
	Gameover
};

export class MultiplayerMode implements GameMode {
	private input: InputManager;
	private socket: Socket<Server2ClientEvents, Client2ServerEvents>;

	private localGame: Game;
	private localController: LocalController;
	private dangerLevel: DangerLevel;
	private isReady = false;

	private remoteGame: Game;
	private opponentId = "";

	private context: GameContext;

	private layout: Widget;
	private shaker: Shaker;
	private recoil: Recoil;

	private countdownTimer: number = 2;
	private state: GameState = GameState.JoiningQueue;

	constructor() {
		this.input = new InputManager();

		this.socket = io("http://localhost:9000", {
			autoConnect: false,
		});

		this.localGame = new Game(new RNG(0));
		this.localController = new LocalController(this.localGame, this.input);

		this.remoteGame = new Game(new RNG(0));

		this.layout = this.buildLayout();
		this.dangerLevel = new DangerLevel(this.localGame, this.shaker);

		this.bindEvents();

		this.socket.connect();
		this.socket.emit(PacketType.JoinQueue);
		this.state = GameState.Queue;
	}

	bindEvents() {
		this.socket.on(PacketType.LobbyState, (data) => {
			switch (data.state) {
				case LobbyState.WaitingForOpp: return this.state = GameState.WaitingForOpp;
				case LobbyState.WaitingForReady: return this.state = GameState.WaitingForOpp;
			}
		});

		this.socket.on(PacketType.MatchStart, (data) => {
			this.localGame.setSeed(data.seed);
			this.remoteGame.setSeed(data.seed);

			this.opponentId = data.opponentId;

			this.state = GameState.Running;
		});

		this.client.events.on("matchEnd", (data) => {
			if (data.winnerId == this.opponentId) {
				this.state = GameState.Gameover;
			} else {
				this.state = GameState.Finished;
			}
		});

		this.client.events.on("garbage", (data) => {
			this.localGame.addGarbage(data.amount);
		});

		this.client.events.on("action", (data) => {
			if (data.action == GameAction.SoftDrop) {
				this.remoteGame.softDropFactor = data.data;
			} else {
				this.remoteGame.handleInput(data.action);
				this.remoteGame.softDropFactor = 1;
			}
		});
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
		const gameLayout = new HBox([localGame, remoteGame], 64);

		const lobbyLayout = new Overlay([
			new Conditional(() => this.state == GameState.JoiningQueue,    new Label(() => "joining queue")),
			new Conditional(() => this.state == GameState.Queue,           new Label(() => "in queue")),
			new Conditional(() => this.state == GameState.WaitingForOpp,   new Label(() => "waiting for opponent")),
			new Conditional(() => this.state == GameState.WaitingForReady, new VBox([
				new Label(() => "not everyone is ready"),
				new Switch(() => this.isReady,
					new Label(() => "press <space> to ready up", "data"),
					new Label(() => "waiting for everyone to be ready", "data"),
				),
			])),
		]);

		const lobbyOrGameLayout = new Switch(() => (
			this.state == GameState.JoiningQueue ||
			this.state == GameState.Queue ||
			this.state == GameState.WaitingForOpp ||
			this.state == GameState.WaitingForReady
		), lobbyLayout, gameLayout);

		const resutlsLayout = new Conditional(
			() => this.state == GameState.Finished || this.state == GameState.Gameover,
			new Overlay([
				new ColorBlock("rgba(0, 0, 0, 0.75)"),
				new Center(new VBox([
					new Label(() => this.state == GameState.Finished ? "victory" : "game over", "title", "center"),
					new SizedBox(0, 16),
				])),
			]),
		);

		const base = new Overlay([lobbyOrGameLayout, resutlsLayout]);

		this.shaker = new Shaker(base);
		this.recoil = new Recoil(this.shaker,
			() => this.context?.recoilTension || 0,
			() => this.context?.recoilDamping || 0,
			() => this.context?.recoilMass || 0,
		);

		return this.recoil;
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
		this.layout.draw(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height, theme);	    
	}
}
