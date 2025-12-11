import { GameTheme } from "../theme";
import { Game } from "./game"
import { LocalController } from "../input"
import { GameTimer } from "./game_timer";
import { drawLabel } from "../visuals";
import { Center, HBox, SizedBox, Spacer, VBox } from "../render/widgets/layout";
import { Label } from "../render/widgets/label";
import { Widget } from "../render/widget";
import { HoldContainerWidget } from "../render/widgets/hold_container";
import { PieceQueueWidget } from "../render/widgets/piece_queue";
import { BoardWidget } from "../render/widgets/board";

export interface Gamemode {
	name: string;

	onEnter(): void;
	onExit(): void;
	
	update(dt: number): void;
	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void;
}

export class SprintMode implements Gamemode {
	name = "40 Lines";

	private game: Game;
	private controller: LocalController;
	private timer: GameTimer;
	private layout: Widget;

	private linesCleared: number = 0;
	private isFinished: boolean = false;
	private hasStarted: boolean = false;

	private createLayout(): Widget {
		const LEFT_COLUMN = new VBox([
			new HoldContainerWidget(() => this.game.hold.piece),
			new Spacer(),
			new Label(() => "Time", "title", "left").setFill(true),
			new Label(() => this.timer.format(), "data", "right").setFill(true),
			new SizedBox(0, 16),
			new Label(() => "Lines", "title", "left").setFill(true),
			new Label(() => this.linesCleared.toString(), "data", "right").setFill(true),
		], 8).setAlign("start").setFill(true);

		const RIGHT_COLUMN = new VBox([
			new PieceQueueWidget(() => this.game.queue.peek(5)),
		], 8).setAlign("start").setFill(true);

		const UI = new Center(new HBox([
			LEFT_COLUMN,
			new BoardWidget(
				() => this.game.board.grid,
				() => { return { width: this.game.board.width, height: this.game.board.height } },
				() => this.game.currentPiece,
				() => this.game.getLowestPosition(),
			),
			RIGHT_COLUMN,
		], 16));

		return UI;
	}

	constructor() {
		this.game = new Game();
		this.timer = new GameTimer();
		this.controller = new LocalController(this.game);
		this.layout = this.createLayout();

		setTimeout(() => this.start(), 1000);
	}

	lineClearedHandler(count: number) {
		this.linesCleared += count;
	}

	start() {
		this.game.start();
		this.timer.start();
		this.hasStarted = true;

		this.game.events.on("lineClear", (count) => this.lineClearedHandler(count));
	}

	reset() {
		this.linesCleared = 0;
		this.isFinished = false;
		this.hasStarted = false;
		this.game.reset();
		this.timer.reset();

		this.game.events.off("lineClear", this.lineClearedHandler);
	}

	onEnter(): void {
		this.reset(); 
	}

	onExit(): void {}

	update(dt: number): void {
		if (!this.hasStarted) return;
		if (!this.isFinished) {
			this.controller.update(dt);
			this.game.update(dt); 
			this.timer.update(dt);
		}

		if (this.linesCleared >= 40) {
			this.isFinished = true;
			this.timer.stop();
		};
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme, ): void {
		this.layout.draw(ctx, x, y, w, h, theme);
		if (this.isFinished) {
			drawLabel("Winner!", 0, 0, theme.Typography.TitleFontSize, theme.Typography.TitleFontFamily, theme.Colors.TextPrimary, ctx);
		}
	}
}
