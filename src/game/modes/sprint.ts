import { LocalController, DEFAULT_CONTROLLER_SETTINGS } from "../../engine/input";
import { GameTheme } from "../../theme";
import { Widget } from "../../ui/widget";
import { Game, DEFAULT_GAME_SETTINGS } from "../game";
import { GameContext, GameMode } from "../modes";
import { GameTimer } from "../timer";
import { VBox, HBox, Center, Spacer, SizedBox } from "../../ui/widgets/layout";
import { HoldContainerWidget } from "../../ui/widgets/hold_container";
import { PieceQueueWidget } from "../../ui/widgets/piece_queue";
import { BoardWidget } from "../../ui/widgets/board";
import { Label } from "../../ui/widgets/label";

export class SprintMode implements GameMode {
	private game: Game;
	private controller: LocalController;
	private timer: GameTimer;
	private layout: Widget;

	private context: GameContext | null = null;

	private linesCleared = 0;

	constructor() {
		this.game = new Game(DEFAULT_GAME_SETTINGS);
		this.controller = new LocalController(this.game, DEFAULT_CONTROLLER_SETTINGS);
		this.layout = this.createLayout();
		this.timer = new GameTimer();
	}

	createLayout(): Widget {
		const LEFT_COLUMN = new VBox([
			new HoldContainerWidget(() => this.game.getHoldType()),
			new Spacer(),
			new Label(() => "Time", "title", "left").setFill(true),
			new Label(() => this.timer.format(), "data", "right").setFill(true),
			new SizedBox(0, 16),
			new Label(() => "Lines", "title", "left").setFill(true),
			new Label(() => this.linesCleared.toString(), "data", "right").setFill(true),
		], 8).setAlign("start").setFill(true);

		const CENTER_COLUMN = new VBox([
			new BoardWidget(
				() => this.game.getGrid(),
				() => this.game.getDimensions(),
				() => this.game.getCurrentPiece(),
				() => this.game.getCurrentPieceLowestY(),
			),
		], 8).setAlign("start").setFill(true);

		const RIGHT_COLUMN = new VBox([
			new PieceQueueWidget(() => this.game.getQueue(5)),
		], 8).setAlign("start").setFill(true);
		
		return new Center(new HBox([LEFT_COLUMN, CENTER_COLUMN, RIGHT_COLUMN], 16));
	}

	finish() {
		this.timer.stop();
	}

	onEnter(ctx: GameContext): void {
		this.context = ctx;

		this.game.reset();
		this.linesCleared = 0;
		this.timer.reset();

		this.game.events.on("lineClear", (lines) => {
			this.linesCleared += lines;
			ctx.shake.trigger(ctx.shakeIntensityMultiplier * lines); // REPLACE WITH SETTING
			ctx.effects.playLinesCleared(lines);

			if (this.linesCleared >= 40) this.finish();
		});

		this.game.events.on("lock", () => {
			ctx.recoil.trigger(100);
			ctx.effects.playHardDrop();
		});

		this.game.events.on("gameOver", () => {
			console.log("RIP");
			ctx.effects.playGameOver();
		});

		this.game.events.on("start", () => {
			this.timer.reset();
			this.timer.start();
		});

		this.game.start();
	}

	onExit(): void {
		this.game.events.clear();
		this.context = null;
	}

	update(dt: number): void {
		if (this.game.isGameOver) return; 
		this.timer.update(dt);
		this.controller.update(dt);
		this.game.update(dt);
	}

	draw(ctx: CanvasRenderingContext2D, theme: GameTheme): void {
		const w = ctx.canvas.width;
		const h = ctx.canvas.height;
		this.layout.draw(ctx, 0, 0, w, h, theme);
	}
}
