import { DEFAULT_CONTROLLER_SETTINGS, LocalController } from "../../engine/input/controller";
import { GameContext, GameMode } from "../modes";
import { DangerLevel } from "../danger";
import { GameAction, DEFAULT_GAME_SETTINGS, Game } from "@tetris/core";
import { InputManager } from "../../engine/input/input_manager";
import { GameTimer } from "../timer";
import { activeTheme } from "../../theme";

// Widgets
import { Widget, Label, Center, Overlay, VBox, SizedBox, Conditional, Panel, TextAlign } from "@tetris/ui";
import { Recoil, Shaker } from "../../widgets/effects.ts";
import { StandardGame } from "../../widgets/standard_game";


export enum GameState {
	Ready,
	Running,
	Finished,
	Gameover
}

export abstract class LocalMode implements GameMode {
	protected game: Game;
	protected input: InputManager;
	protected controller: LocalController;
	protected context: GameContext | null = null;
	protected timer: GameTimer;

	protected layout: Widget;
	protected shaker: Shaker;
	protected recoil: Recoil;
	protected dangerLevel: DangerLevel;

	protected state: GameState = GameState.Ready;
	protected linesCleared = 0;
	protected countdownTimer = 2;

	constructor(timerDirection: "up" | "down", timeLimit: number = 0) {
		this.game = new Game(Math.random(), DEFAULT_GAME_SETTINGS);
		this.input = new InputManager();
		this.controller = new LocalController(this.game, this.input, DEFAULT_CONTROLLER_SETTINGS);
		this.timer = new GameTimer(timerDirection, timeLimit);

		this.layout = this.createLayout();
		this.dangerLevel = new DangerLevel(this.game, this.shaker);

		this.bindBaseEvents();
	}

	protected abstract getModeName(): string;
	protected abstract getSidebarWidgets(): Widget[];
	protected abstract getResultLabel(): string;
	protected abstract onLineClear(lines: number): void;
	protected abstract onReset(): void;
	protected checkWinCondition(): void {};

	private createResultsScreen(): Widget {
		return new Conditional(
			() => this.state == GameState.Finished || this.state == GameState.Gameover,
			new Overlay([
				new Panel().withStyle({ backgroundColor: "rgba(0, 0, 0, 0.75)" }),
				new Center(new VBox([
					new Label(() => this.state == GameState.Finished ? "victory" : "game over")
						.withStyle(activeTheme.typography.title)
						.setTextAlign(TextAlign.Center),
					new SizedBox(0, activeTheme.layout.gap),
					new Label(() => this.getResultLabel())
						.withStyle(activeTheme.typography.data)
						.setTextAlign(TextAlign.Center),
					new SizedBox(0, activeTheme.layout.gap),
					new Label("press R to restart")
						.withStyle(activeTheme.typography.data)
						.setTextAlign(TextAlign.Center),
				])),
			]),
		);
	}

	private createLayout(): Widget {
		const gameLayer = new StandardGame(this.game, [
				new Label(() => this.getModeName())
					.withStyle(activeTheme.typography.title)
					.setFill(true)
					.setTextAlign(TextAlign.Right),
				new SizedBox(0, 16),
				...this.getSidebarWidgets(),
			],
			() => this.dangerLevel.getLevel(),
			() => this.countdownTimer + 1,
		).withStyle(activeTheme.game);

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

	protected finish(victory: boolean) {
		this.state = victory ? GameState.Finished : GameState.Gameover;
		this.timer.stop();
		if (victory) this.context?.effects.playTetrisCleared();
		else {
				this.context?.effects.playGameOver();
				this.shaker.setRumble(0);
			}
	} 

	private bindBaseEvents() {
		this.game.events.on("lock", () => {
			this.recoil.trigger(100);
			this.context?.effects.playLock();
		});

		this.game.events.on("gameOver", () => this.finish(false));

		this.game.events.on("lineClear", (lines: number) => {
			this.linesCleared += lines;
			this.shaker.trigger(this.context ? this.context.shakeIntensityMultiplier * lines : 0);

			if (lines < 4) this.context?.effects.playLinesCleared(lines);
			else this.context?.effects.playTetrisCleared();

			this.onLineClear(lines);
		});
	}

	protected reset(): void {
		this.state = GameState.Ready;
		this.linesCleared = 0;
		this.countdownTimer = 2;
		
		this.game.start();
		this.timer.reset();
		this.dangerLevel.reset();
		this.shaker.setRumble(0);

		this.onReset();
	}

	onEnter(ctx: GameContext): void {
		this.context = ctx;
		this.reset();
	}

	onExit(): void {
	    this.context = null;
	}

	update(dt: number): void {
		this.input.update();
		if (this.input.isJustPressed(GameAction.Reset)) { this.reset(); return; }

		this.shaker.update(dt);
		this.recoil.update(dt);

		if (this.state == GameState.Finished || this.state == GameState.Gameover) return;

		this.dangerLevel.update(dt);

		switch (this.state) {
			case GameState.Ready:
				this.countdownTimer -= dt;
				if (this.countdownTimer <= 0) {
					this.state = GameState.Running;
					this.timer.start();
					this.context?.effects.playTetrisCleared();
				};
				break;
			case GameState.Running:
				if (this.countdownTimer > -2.0) this.countdownTimer -= dt;
				
				this.timer.update(dt);
				this.controller.update(dt);
				this.game.update(dt);

				this.checkWinCondition();
		}
	}

	draw(ctx: CanvasRenderingContext2D): void {
	    this.layout.draw(ctx, 0, 0, ctx.canvas.width, ctx.canvas.height);
	}
}
