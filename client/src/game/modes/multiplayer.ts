import { io, Socket } from "socket.io-client";
import { GameTheme } from "../../theme";
import { GameContext, GameMode } from "../modes";
import { C2SEvents, Game, GameAction, PacketType, S2CEvents } from "@tetris/shared";
import { LocalController } from "../../engine/input/controller";
import { InputManager } from "../../engine/input/input_manager";
import { DangerLevel } from "../danger";
import { Widget } from "../../ui/widget";
import { Recoil, Shaker } from "../../ui/widgets/effects";
import { Center, HBox, Overlay, SizedBox, VBox } from "../../ui/widgets/layout";
import { Conditional, Switch } from "../../ui/widgets/logic";
import { StandardGame } from "../../ui/widgets/standard_game";
import { Label } from "../../ui/widgets/label";
import { ColorBlock } from "../../ui/widgets/color_block";

enum GameState {
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
	private countdownTimer: number = 0;
	private hasWonlastMatch: boolean = false;

	private layout: Widget;
	private dangerLevel: DangerLevel;
	private shaker: Shaker;
	private recoil: Recoil;

	private localGame: Game;
	private remoteGame: Game;

	private localController: LocalController;

	constructor() {
		this.state = GameState.JoiningQueue;
		this.socket = io(this.URL);

		this.localGame = new Game();
		this.remoteGame = new Game();

		this.localController = new LocalController(this.localGame, this.input);

		this.layout = this.buildLayout();
		this.dangerLevel = new DangerLevel(this.localGame, this.shaker);

		this.bindEvents();
		this.joinQueue();
	}

	private joinQueue() {
		this.socket.connect();
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
			this.localGame.setSeed(packet.seed);
			this.remoteGame.setSeed(packet.seed);

			this.socket.emit(PacketType.Ready);
		});

		this.socket.on(PacketType.StartMatch, () => {
			this.state = GameState.InMatch;
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

		this.socket.on(PacketType.SelfState,    (packet) => {
			
		});

		this.socket.on(PacketType.OppState,     (packet) => {
			this.remoteGame.setGrid(packet.grid);

			const gameCurrentPiece = this.remoteGame.getCurrentPiece();
			if (!gameCurrentPiece || !packet.currentPiece) return;

			const xDistance = Math.abs(gameCurrentPiece.x - packet.currentPiece.x);
			const yDistance = Math.abs(gameCurrentPiece.y - packet.currentPiece.y);

			if (packet.currentPiece.rotation != gameCurrentPiece.rotation || xDistance > 5 || yDistance > 5) {
				this.remoteGame.currentPiece = packet.currentPiece;
			}
		});

		this.socket.on(PacketType.GarbageIn,    (packet) => {
			this.localGame.addGarbage(packet.amount);
		});

		this.socket.on(PacketType.GarbageOut,   (packet) => {});

		this.socket.on(PacketType.EndMatch,     (packet) => {
			this.state = GameState.AfterMatch;
		});

		this.socket.on(PacketType.FinishMatch,  (packet) => {
			this.state = GameState.FinishMatch;
		});
	}

	private buildGameLayout(game: Game, isLocal: boolean): Widget {
		const labelText = isLocal ? "you" : "other";
		const dangerProvider = isLocal ? () => this.dangerLevel.getLevel() : () => 0;
		return new StandardGame(game, [
			new Label(() => labelText, "title", "right"),
		], dangerProvider, () => this.countdownTimer+1);
	}

	private buildResultsLayout(): Widget {
		return new Overlay([
			new ColorBlock("rgba(0, 0, 0, .75)"),
			new Switch(() => this.hasWonlastMatch ? 1 : 0, [
				new Label(() => "match won", "title", "center").setExpand(true),
				new Label(() => "match lost", "title", "center").setExpand(true),
			])
		]);
	}

	private buildLayout(): Widget {
		const localGame = this.buildGameLayout(this.localGame, true);
		const remoteGame = this.buildGameLayout(this.remoteGame, false);
		const gameLayout = new HBox([localGame, remoteGame], 64);

		const lobbyOrGameLayout = new Switch(() => {
			switch (this.state) {
				case GameState.JoiningQueue: return 0;
				case GameState.InQueue:      return 1;
				case GameState.InRoom:       return 2;
				default: return 3;
			}
		},[
			new Label(() => "joining queue", "title", "center"),
			new Label(() => "in queue", "title", "center"),
			new Label(() => "in room", "title", "center"),
			gameLayout
		]);

		const resultsLayout = this.buildResultsLayout();

		const base = new Overlay([lobbyOrGameLayout, resultsLayout]);

		this.shaker = new Shaker(base);
		this.recoil = new Recoil(this.shaker,
			() => this.context?.recoilTension || 0,
			() => this.context?.recoilDamping|| 0,
			() => this.context?.recoilMass || 0,
		);

		return this.recoil;
	}

	onEnter(ctx: GameContext): void {
	    
	}

	onExit(): void {
	    
	}

	update(dt: number): void {
	    
	}

	draw(ctx: CanvasRenderingContext2D, theme: GameTheme): void {
	    
	}
}
