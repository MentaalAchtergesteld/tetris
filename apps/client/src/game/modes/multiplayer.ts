import { io, Socket } from "socket.io-client";
import { GameTheme } from "../../theme";
import { GameContext, GameMode } from "../modes";
import { Game, GameAction } from "@tetris/core";
import { LocalController } from "../../engine/input/controller";
import { InputManager } from "../../engine/input/input_manager";
import { DangerLevel } from "../danger";

// Widgets
import { Widget, Label, Center, Overlay, Conditional, Panel, Switch, HBox } from "@tetris/ui";
import { Recoil, Shaker } from "../../widgets/effects";
import { StandardGame } from "../../widgets/standard_game";

enum GameState {
	Connecting,
	Connected,
	JoiningQueue,
	InQueue,
	InRoom,
	Ready,
	InMatch,
	AfterMatch,
	FinishMatch,
}

export class MultiplayerMode implements GameMode {
	private readonly URL = "http://localhost:9000";

	private state: GameState;
	private socket: Socket<S2CEvents, C2SEvents>;
	private input: InputManager;
	private context: GameContext | null = null;
	private countdownTimer: number = -1;
	private hasWonlastMatch: boolean = false;

	private layout: Widget;
	private dangerLevel: DangerLevel;
	private shaker: Shaker;
	private recoil: Recoil;

	private localGame: Game;
	private remoteGame: Game;

	private localController: LocalController;

	constructor() {
		this.state = GameState.Connecting;
		this.socket = io(this.URL);
		this.input = new InputManager();

		this.localGame = new Game();
		this.remoteGame = new Game();

		this.localController = new LocalController(this.localGame, this.input);

		this.layout = this.buildLayout();
		this.dangerLevel = new DangerLevel(this.localGame, this.shaker);

		this.bindEvents();
		this.connect();
	}

	private connect() {
		this.socket.once("connect", () => this.joinQueue());
		this.socket.connect();
	};

	private joinQueue() {
		this.socket.emit(PacketType.JoinQueue);
		this.state = GameState.InQueue;
	}

	private bindEvents() {
		this.socket.on(PacketType.JoinRoom, () => {
			this.state = GameState.InRoom;
		});

		this.socket.on(PacketType.PlayerJoined, (packet) => {
			console.log(`Player ${packet.playerId} joined the room.`);
		});

		this.socket.on(PacketType.Seed, (packet) => {
			console.log(packet.seed);
			this.localGame.setSeed(packet.seed);
			this.remoteGame.setSeed(packet.seed);

			this.socket.emit(PacketType.Ready);
		});

		this.socket.on(PacketType.StartMatch, () => {
			this.state = GameState.InMatch;
			this.localGame.start();
			this.remoteGame.start();
		});

		this.socket.on(PacketType.Action, (packet) => {
			if (this.state != GameState.InMatch) return;
			if (packet.action == GameAction.SoftDrop) {
				this.remoteGame.softDropFactor = packet.data;
			} else {
				this.remoteGame.softDropFactor = 1;
				this.remoteGame.handleInput(packet.action);
			}
		});

		this.socket.on(PacketType.SelfState, (packet) => {
			
		});

		this.socket.on(PacketType.OppState, (packet) => {
			this.remoteGame.setGrid(packet.grid);

			const gameCurrentPiece = this.remoteGame.getCurrentPiece();
			if (!gameCurrentPiece || !packet.currentPiece) return;

			const xDistance = Math.abs(gameCurrentPiece.x - packet.currentPiece.x);
			const yDistance = Math.abs(gameCurrentPiece.y - packet.currentPiece.y);

			if (packet.currentPiece.rotation != gameCurrentPiece.rotation || xDistance > 5 || yDistance > 5) {
				this.remoteGame.currentPiece = packet.currentPiece;
			}
		});

		this.socket.on(PacketType.GarbageIn, (packet) => {
			this.localGame.addGarbage(packet.amount);
		});

		this.socket.on(PacketType.GarbageOut, (packet) => {});

		this.socket.on(PacketType.EndMatch, (packet) => {
			this.state = GameState.AfterMatch;
		});

		this.socket.on(PacketType.FinishMatch, (packet) => {
			this.state = GameState.FinishMatch;
		});

		this.localController.events.on("action", (action) => {
			this.socket.emit(PacketType.Action, { action, data: this.localController.settings.sdf });
		})
	}

	private buildGameLayout(game: Game, isLocal: boolean): Widget {
		const dangerProvider = isLocal ? () => this.dangerLevel.getLevel() : () => 0;
		return new StandardGame(game, [
			new Label(isLocal ? "you" : "other"),
		], dangerProvider, () => this.countdownTimer+1);
	}

	private buildResultsLayout(): Widget {
		return new Conditional(() => this.state == GameState.FinishMatch, new Overlay([
			new Panel().withStyle({ backgroundColor: "rgba(0, 0, 0, 0.75)" }),
			new Switch(() => this.hasWonlastMatch ? 1 : 0, [
				new Label("match won").setExpand(true),
				new Label("match lost").setExpand(true),
			])
		]));
	}

	private buildLayout(): Widget {
		const localGame = this.buildGameLayout(this.localGame, true);
		const remoteGame = this.buildGameLayout(this.remoteGame, false);
		const gameLayout = new HBox([localGame, remoteGame], 64);

		const lobbyOrGameLayout = new Switch(() => {
			switch (this.state) {
				case GameState.Connecting:   return 0;
				case GameState.Connected:    return 1;
				case GameState.JoiningQueue: return 2;
				case GameState.InQueue:      return 3;
				case GameState.InRoom:       return 4;
				default: return 5;
			}
		},[
			new Label("connecting"),
			new Label("connected"),
			new Label("joining queue"),
			new Label("in queue"),
			new Label("in room"),
			gameLayout
		]);

		const resultsLayout = this.buildResultsLayout();

		const base = new Center(new Overlay([lobbyOrGameLayout, resultsLayout]));

		this.shaker = new Shaker(base);
		this.recoil = new Recoil(this.shaker,
			() => this.context?.recoilTension || 0,
			() => this.context?.recoilDamping|| 0,
			() => this.context?.recoilMass || 0,
		);

		return this.recoil;
	}

	onEnter(ctx: GameContext): void {
		this.context = ctx;	    
	}

	onExit(): void {
		this.socket.disconnect(); 
	}

	update(dt: number): void {
		if (this.state != GameState.InMatch) return; 

		this.input.update();
		this.localController.update(dt);
		this.localGame.update(dt);
		this.remoteGame.update(dt);
	}

	draw(ctx: CanvasRenderingContext2D, theme: GameTheme): void {
		this.layout.draw(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height); 
	}
}
