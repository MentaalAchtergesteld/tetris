import {  Client2ServerEvents, Game, LobbyState, PacketType, RNG, Server2ClientEvents } from "@tetris/shared";
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

	private countdownTimer: number = -1;
	private state: GameState = GameState.JoiningQueue;

	constructor() {
		this.input = new InputManager();

		this.socket = io("http://localhost:9000", {
			autoConnect: false,
		});

		this.localGame = new Game();
		this.localController = new LocalController(this.localGame, this.input);

		this.remoteGame = new Game();

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
				case LobbyState.WaitingForReady: return this.state = GameState.WaitingForReady;
			}
		});

		this.socket.on(PacketType.MatchStart, (data) => {
			this.localGame.setSeed(data.seed);
			this.remoteGame.setSeed(data.seed);

			this.opponentId = data.opponentId;

			this.remoteGame.start();
			this.localGame.start();
			this.state = GameState.Running;
		});

		this.socket.on(PacketType.MatchEnd, (data) => {
			if (data.winnerId == this.opponentId) {
				this.state = GameState.Gameover;
			} else {
				this.state = GameState.Finished;
			}

			this.isReady = false;
		});

		this.socket.on(PacketType.GarbageIn, (data) => {
			this.localGame.addGarbage(data.amount);
		});

		this.socket.on(PacketType.Action, (data) => {
			if (data.action == GameAction.SoftDrop) {
				this.remoteGame.softDropFactor = data.data;
			} else {
				this.remoteGame.handleInput(data.action);
				this.remoteGame.softDropFactor = 1;
			}
		});

		this.socket.on(PacketType.OppState, ({ grid, currentPiece }) => {
			this.remoteGame.setGrid(grid);
			const gameCurrentPiece = this.remoteGame.getCurrentPiece();

			if (gameCurrentPiece == null || currentPiece == null) return;

			if (
				currentPiece.rotation != gameCurrentPiece.rotation ||
				Math.abs(currentPiece.x - gameCurrentPiece.x) > 3 ||
				Math.abs(currentPiece.y - gameCurrentPiece.y) > 3
			) {
				this.remoteGame.currentPiece = currentPiece;
			}
		});

		this.localController.events.on("action", action => {
			this.socket.emit(PacketType.Action, { action, data: this.localController.settings.sdf })
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

		const lobbyLayout = new Center(new Overlay([
			new Conditional(() => this.state == GameState.JoiningQueue,    new Label(() => "joining queue")),
			new Conditional(() => this.state == GameState.Queue,           new Label(() => "in queue")),
			new Conditional(() => this.state == GameState.WaitingForOpp,   new Label(() => "waiting for opponent")),
			new Conditional(() => this.state == GameState.WaitingForReady, new VBox([
				new Label(() => "not everyone is ready"),
				new Switch(() => this.isReady,
					new Label(() => "waiting for everyone to be ready", "data"),
					new Label(() => "press <space> to ready up", "data"),
				),
			])),
		]));

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
		this.socket.disconnect();
	}

	update(dt: number): void {
		this.input.update();
		this.shaker.update(dt);
		this.recoil.update(dt);

		if (this.state == GameState.WaitingForReady && this.input.isJustPressed(GameAction.HardDrop) && !this.isReady) {
			this.isReady = true;
			this.socket.emit(PacketType.Ready);
		};
		if (this.state != GameState.Running) return;

		this.dangerLevel.update(dt);

		this.localController.update(dt);
		this.localGame.update(dt);

		this.remoteGame.update(dt);
	}

	draw(ctx: CanvasRenderingContext2D, theme: GameTheme): void {
		this.layout.draw(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height, theme);	    
	}
}
