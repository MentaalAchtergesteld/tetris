import { DEFAULT_CONTROLLER_SETTINGS, LocalController } from "../../engine/input";
import { GameTheme } from "../../theme";
import { Widget } from "../../ui/widget";
import { BoardWidget } from "../../ui/widgets/board";
import { ColorBlock } from "../../ui/widgets/color_block";
import { HoldContainerWidget } from "../../ui/widgets/hold_container";
import { Label } from "../../ui/widgets/label";
import { Center, HBox, Overlay, SizedBox, Spacer, VBox } from "../../ui/widgets/layout";
import { Conditional } from "../../ui/widgets/logic";
import { PieceQueueWidget } from "../../ui/widgets/piece_queue";
import { DEFAULT_GAME_SETTINGS, Game } from "../game";
import { GameContext, GameMode } from "../modes";
import { GameTimer } from "../timer";

enum BlitzState {
	Ready,
	Running,
	Finished,
	Gameover,
}

export class BlitzMode implements GameMode {
	private game: Game;
	private controller: LocalController;
	private context: GameContext | null = null;
	
	private layout: Widget;

	private state: BlitzState;
	private timer: GameTimer;
	private countdown = 0;
	private linesCleared = 0;

	constructor() {
		this.game = new Game(DEFAULT_GAME_SETTINGS);
		this.controller = new LocalController(this.game, DEFAULT_CONTROLLER_SETTINGS);
		this.layout = this.createLayout();
		this.timer = new GameTimer("down", 120);
	}

	private createGameLayer(): Widget {
		const LEFT_COLUMN = new VBox([
			new Label(() => "hold", "title", "left").setFill(true),
			new SizedBox(0, 8),
			new HoldContainerWidget(() => this.game.getHoldType()),
			new Spacer(),
			new Label(() => "blitz", "title", "right").setFill(true),
			new SizedBox(0, 16),
			new Label(() => "time", "title", "right").setFill(true),
			new Label(() => this.timer.format(), "data", "right").setFill(true),
			new SizedBox(0, 16),
			new Label(() => "lines", "title", "right").setFill(true),
			new Label(() => this.linesCleared.toString(), "data", "right").setFill(true),
		], 8).setAlign("start").setFill(true);

		const CENTER_COLUMN = new VBox([
			new BoardWidget(
				() => this.game.getGrid(),
				() => this.game.getDimensions(),
				() => this.game.getVisibleHeight(),
				() => this.game.getCurrentPiece(),
				() => this.game.getCurrentPieceLowestY(),
			),
		], 8).setAlign("start").setFill(true);

		const RIGHT_COLUMN = new VBox([
			new Label(() => "queue", "title", "right").setFill(true),
			new SizedBox(0, 8),
			new PieceQueueWidget(() => this.game.getQueue(5)),
		], 8).setAlign("start").setFill(true);

		return new Center(new HBox([LEFT_COLUMN, CENTER_COLUMN, RIGHT_COLUMN], 16));
	}

	private createUiLayer(): Widget {
		const countdownLayer = new Conditional(
			() => this.state == BlitzState.Ready,
			new Center(new Label(() => {
				const t = Math.ceil(this.countdown);
				return t > 0 ? t.toString() : "GO!";
			}, "title", "center").setFill(true)),
		);

		const resultLayer = new Conditional(
			() => this.state == BlitzState.Gameover || this.state == BlitzState.Finished,
			new Overlay([
				new ColorBlock("rgba(0, 0, 0, 0.75)"),
				new Center(new VBox([
					new Label(() => this.state == BlitzState.Finished ? "victory" : "game over", "title", "center"),
					new SizedBox(0, 16),
					new Label(() => `final score: ${this.linesCleared}`, "data", "center"),
					new SizedBox(0, 16),
					new Label(() => "press R to restart", "data", "center"),
				])),
			])
		)

		return new Overlay([countdownLayer, resultLayer]);
	}

	private createLayout(): Widget { return new Overlay([this.createGameLayer(), this.createUiLayer()]) }

	private victory() {
		this.state = BlitzState.Finished;
		this.timer.stop();
	}

	private bindEvents() {
		if (!this.context) return;

		this.game.events.on("lineClear", (lines) => {
			this.linesCleared += lines;
			this.context!.shake.trigger(this.context!.shakeIntensityMultiplier * lines);

			if (lines < 4) {
				this.context!.effects.playLinesCleared(lines);
			} else {
				this.context!.effects.playTetrisCleared();
			}

			const currentLevel = Math.floor(this.linesCleared / 10) + 1;

			this.game.gravityMultiplier = Math.max(1, currentLevel*0.8);
			if (this.timer.time <= 0) this.victory();
		});

		this.game.events.on("lock", () => {
			this.context!.recoil.trigger(100);
			this.context?.effects.playLock();
		});

		this.game.events.on("gameOver", () => {
			this.context!.effects.playGameOver();
			this.state = BlitzState.Gameover;
		});

		this.game.events.on("start", () => {
			this.timer.reset();
			this.timer.start();
			this.linesCleared = 0;
		});
	}

	private reset() {
		this.game.reset();

		this.linesCleared = 0;
		this.countdown = 3;
		this.state = BlitzState.Ready;

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
		if (this.controller.input.isDown("KeyR")) this.reset();
		if (this.state == BlitzState.Finished || this.state == BlitzState.Gameover) return;

		switch (this.state) {
			case BlitzState.Ready:
				this.countdown -= dt;
				if (this.countdown <= 0) {
					this.state = BlitzState.Running;
					this.context?.effects.playTetrisCleared();
				}
				break;
			case BlitzState.Running:
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
