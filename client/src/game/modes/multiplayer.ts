import { LocalController, RemoteController } from "../../engine/input/controller";
import {  InputManager } from "../../engine/input/input_manager";
import { DEFAULT_GAME_SETTINGS, Game, GameAction, RNG } from "@tetris/shared";
import { GameTheme } from "../../theme"
import { Widget } from "../../ui/widget";
import { ColorBlock } from "../../ui/widgets/color_block";
import { Recoil, Shaker } from "../../ui/widgets/effects";
import { Label } from "../../ui/widgets/label";
import { Center, HBox, Overlay, SizedBox, VBox } from "../../ui/widgets/layout";
import { Conditional, Switch } from "../../ui/widgets/logic";
import { StandardGame } from "../../ui/widgets/standard_game";
import { DangerLevel } from "../danger";
import { GameContext, GameMode } from "../modes"
import { MatchStartPacket, NetworkClient } from "../../engine/network/client";

enum State {
	Queue,
	Ready,
	Running,
	Finished,
	Gameover
}

export class MultiplayerMode implements GameMode {
	private input: InputManager;
	private context: GameContext | null = null;

	private client: NetworkClient;

	private localGame: Game;
	private localController: LocalController;
	private localRNG: RNG;

	private remoteGame: Game;
	private remoteController: RemoteController;
	private remoteRNG: RNG;

	private countdown = 3;
	private countdownTimer = this.countdown;

	private layout: Widget;
	private shaker: Shaker;
	private recoil: Recoil;
	private dangerLevel: DangerLevel;

	private state: State = State.Queue;

	constructor() {
		this.input = new InputManager();

		this.client = new NetworkClient();
		this.client.connect();
		this.client.joinQueue();

		this.localRNG = new RNG(0);
		this.localGame = new Game(this.localRNG, DEFAULT_GAME_SETTINGS);
		this.localController = new LocalController(this.localGame, this.input);

		this.remoteRNG = new RNG(0);
		this.remoteGame = new Game(this.remoteRNG, DEFAULT_GAME_SETTINGS);
		this.remoteController = new RemoteController(this.remoteGame, this.client);

		this.layout = this.createLayout();
		this.dangerLevel = new DangerLevel(this.localGame, this.shaker);

		this.bindBaseEvents();
	}

	private createResultsScreen() {
		return new Conditional(
			() => this.state == State.Finished || this.state == State.Gameover,
			new Overlay([
				new ColorBlock("rgba(0, 0, 0, 0.75)"),
				new Center(new VBox([
					new Label(() => this.state == State.Finished ? "victory" : "game over", "title", "center"),
					new SizedBox(0, 16),
					new Label(() => "press R to restart", "data", "center"),
				])),
			]),
		);
	}

	private createLayout(): Widget {
		const localGame = new StandardGame(this.localGame, [
				new Label(() => "you", "title", "right").setFill(true),
			],
			() => this.dangerLevel.getLevel(),
			() => this.countdownTimer + 1,
		);

		const remoteGame = new StandardGame(this.remoteGame, [
				new Label(() => "other", "title", "right").setFill(true),
			],
			() => this.dangerLevel.getLevel(),
			() => this.countdownTimer + 1,
		);

		const remoteGameWrapper = new Switch(() => this.state != State.Queue, remoteGame, new Label(() => "Searching opponent...", "data", "center"));

		const gameLayer = new Center(new HBox([localGame, new SizedBox(64, 0), remoteGameWrapper]));

		const uiLayer = this.createResultsScreen();

		const base = new Overlay([gameLayer, uiLayer]);

		this.shaker = new Shaker(base);
		this.recoil = new Recoil(this.shaker,
			() => this.context?.recoilTension || 0,
			() => this.context?.recoilDamping || 0,
			() => this.context?.recoilMass || 0,
		);

		return this.recoil;
	} 

	private finish(victory: boolean) {
		this.state = victory ? State.Finished : State.Gameover;
		if (victory) this.context?.effects.playTetrisCleared();
		else {
			this.context?.effects.playGameOver();
			this.shaker.setRumble(0);
		}
	}

	private bindBaseEvents() {
		this.localGame.events.on("lock", () => {
			this.recoil.trigger(100);
			this.context?.effects.playLock();
		});

		this.localGame.events.on("gameOver", () => this.finish(false));
		this.remoteGame.events.on("gameOver", () => this.finish(true));

		this.localGame.events.on("lineClear", (lines: number) => {
			this.shaker.trigger(this.context ? this.context.shakeIntensityMultiplier * lines : 0);

			if (lines < 4) this.context?.effects.playLinesCleared(lines);
			else this.context?.effects.playTetrisCleared();
		});

		
		this.client.events.on("matchStart", (packet: MatchStartPacket) => {
			if (this.state == State.Queue) this.state = State.Ready;
			this.localRNG.setSeed(packet.seed);
			this.remoteRNG.setSeed(packet.seed);
		});

		this.localController.events.on("action", action => {
			if (this.client) this.client.sendAction(action);
		})
	}

	private reset() {
		this.state = State.Queue;
		this.countdownTimer = 2;

		this.localGame.start();
		this.remoteGame.start();

		this.dangerLevel.reset();
		this.shaker.setRumble(0);
	}

	onEnter(ctx: GameContext): void {
	  this.context = ctx;
		this.reset();
	}

	onExit(): void {
		this.client.disconnect();
	  this.context = null; 
	}

	update(dt: number): void {
		this.input.update();
		if (this.input.isJustPressed(GameAction.Reset)) { this.reset(); return; }

		this.shaker.update(dt);
		this.recoil.update(dt);

		if (this.state == State.Finished || this.state == State.Gameover) return;

		this.dangerLevel.update(dt);

		switch (this.state) {
			case State.Ready:
				this.countdownTimer -= dt;
				if (this.countdownTimer <= 0) {
					this.state = State.Running;
					this.context?.effects.playTetrisCleared();
				};
				break;
			case State.Running:
				if (this.countdownTimer > -2.0) this.countdownTimer -= dt;

				this.localController.update(dt);
				this.localGame.update(dt);

				this.remoteController.update(dt);
				this.remoteGame.update(dt);
		}
	}

	draw(ctx: CanvasRenderingContext2D, theme: GameTheme): void {
		this.layout.draw(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height, theme);
	}
}
