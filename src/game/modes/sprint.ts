import { LocalController, DEFAULT_CONTROLLER_SETTINGS } from "../../engine/input";
import { GameTheme } from "../../theme";
import { Widget } from "../../ui/widget";
import { Game, DEFAULT_GAME_SETTINGS } from "../game";
import { GameContext, GameMode } from "../modes";
import { GameTimer } from "../timer";
import { VBox, Center, SizedBox, Overlay } from "../../ui/widgets/layout";
import { Label } from "../../ui/widgets/label";
import { Conditional } from "../../ui/widgets/logic";
import { ColorBlock } from "../../ui/widgets/color_block";
import { Countdown } from "../../ui/widgets/countdown";
import { StandardGame } from "../../ui/widgets/standard_game";
import { Recoil, Shaker } from "../../ui/widgets/effects";
import { DangerLevel } from "../danger";

enum SprintState {
	Ready,
	Running,
	Finished,
	Gameover,
}

export class SprintMode implements GameMode {
	private game: Game;
	private controller: LocalController;
	private context: GameContext | null = null;

	private layout: Widget;

	private state: SprintState = SprintState.Ready;
	private timer: GameTimer;
	private linesCleared = 0;
	private countdown = 2;
	private countdownTimer = this.countdown;

	private shaker: Shaker;
	private recoil: Recoil;
	private dangerLevel: DangerLevel;

	constructor() {
		this.game = new Game(DEFAULT_GAME_SETTINGS);
		this.controller = new LocalController(this.game, DEFAULT_CONTROLLER_SETTINGS);
		this.layout = this.createLayout();
		this.timer = new GameTimer();
		this.dangerLevel = new DangerLevel(this.game, this.shaker);
	}
	
	private createGameLayer(): Widget {
		return new StandardGame(this.game, () => this.dangerLevel.getLevel(), [
			new Label(() => "40 lines", "title", "right").setFill(true),
			new SizedBox(0, 16),
			new Label(() => "time", "title", "right").setFill(true),
			new Label(() => this.timer.format(), "data", "right").setFill(true),
			new SizedBox(0, 16),
			new Label(() => "lines", "title", "right").setFill(true),
			new Label(() => this.linesCleared.toString(), "data", "right").setFill(true),
		]);
	}

	private createUiLayer(): Widget {
		const countdownLayer = new Center(new Countdown(() => this.countdownTimer+1));

		const resultLayer = new Conditional(
			() => this.state == SprintState.Gameover || this.state == SprintState.Finished,
			new Overlay([
				new ColorBlock("rgba(0, 0, 0, 0.75)"),
				new Center(new VBox([
					new Label(() => this.state == SprintState.Finished ? "victory" : "game over", "title", "center"),
					new SizedBox(0, 16),
					new Label(() => `final time: ${this.timer.format()}`, "data", "center"),
					new SizedBox(0, 16),
					new Label(() => "press R to restart", "data", "center"),
				])),
			])
		)

		return new Overlay([countdownLayer, resultLayer]);
	}

	private createLayout(): Widget {
		const layout = new Overlay([this.createGameLayer(), this.createUiLayer()]);
		this.shaker = new Shaker(layout);
		this.recoil = new Recoil(
			this.shaker,
			() => this.context?.recoilTension || 0,
			() => this.context?.recoilDamping || 0,
			() => this.context?.recoilMass    || 0,
		);
		return this.recoil;
	}

	private victory() {
		this.state = SprintState.Finished;
		this.timer.stop();
	}

	private bindEvents() {
		if (!this.context) return;

		this.game.events.on("lineClear", (lines) => {
			this.linesCleared += lines;
			this.shaker.trigger(this.context!.shakeIntensityMultiplier * lines);

			if (lines < 4) {
				this.context!.effects.playLinesCleared(lines);
			} else {
				this.context!.effects.playTetrisCleared();
			}

			if (this.linesCleared >= 40) this.victory();
		});

		this.game.events.on("lock", () => {
			// this.context!.recoil.trigger(100);
			this.recoil.trigger(100);
			this.context?.effects.playLock();
			this.shaker.setRumble(0);
		});

		this.game.events.on("gameOver", () => {
			this.context!.effects.playGameOver();
			this.state = SprintState.Gameover;
		});

		this.game.events.on("start", () => {
			this.timer.reset();
			this.timer.start();
			this.linesCleared = 0;
		});
	}

	private reset() {
		this.dangerLevel.reset();
		this.game.reset();

		this.linesCleared = 0;
		this.timer.reset();
		this.countdownTimer = this.countdown;
		this.state = SprintState.Ready;

		this.game.events.clear();
		this.bindEvents();
		this.game.start();
	}

	onEnter(ctx: GameContext): void {
		this.context = ctx;
		this.reset();
	}

	onExit(): void {
		this.game.events.clear();
		this.context = null;
	}

	update(dt: number): void {
		if (this.shaker) this.shaker.update(dt);
		if (this.recoil) this.recoil.update(dt);
		this.dangerLevel.update(dt);

		if (this.controller.input.isDown("KeyR")) this.reset();
		if (this.state == SprintState.Finished || this.state == SprintState.Gameover) return;

		switch (this.state) {
			case SprintState.Ready:
				this.countdownTimer -= dt;
				if (this.countdownTimer <= 0) {
					this.state = SprintState.Running;
					this.context?.effects.playTetrisCleared();
				}
				break;
			case SprintState.Running:
				if (this.countdownTimer > -2.0) this.countdownTimer -= dt;
				this.timer.update(dt);
				this.controller.update(dt);
				this.game.update(dt);
		}
	}

	draw(ctx: CanvasRenderingContext2D, theme: GameTheme): void {
		const w = ctx.canvas.width;
		const h = ctx.canvas.height;
		this.layout.draw(ctx, 0, 0, w, h, theme);
	}
}
