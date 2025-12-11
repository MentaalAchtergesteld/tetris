import { GameTheme } from "../theme";
import { Game } from "./game"
import { BoardWidget, GameTimerWidget, HoldContainerWidget, HorizontalContainerWidget, PieceQueueWidget, SpacerWidget, VerticalContainerWidget, Widget } from "../render/widget"
import { LocalController } from "../input"
import { GameTimer } from "./game_timer";
import { drawLabel } from "../visuals";

export interface Gamemode {
	name: string;

	onEnter(): void;
	onExit(): void;
	
	update(dt: number): void;
	draw(theme: GameTheme, ctx: CanvasRenderingContext2D): void;
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
		return new HorizontalContainerWidget([
			new VerticalContainerWidget([
				new HoldContainerWidget(() => this.game.hold.piece),
				new SpacerWidget(0, 100),
				new GameTimerWidget("Time", () => this.timer.format()),
			], 8),
			new BoardWidget(
				() => this.game.board.grid,
				() => { return { width: this.game.board.width, height: this.game.board.height } },
				() => this.game.currentPiece,
				() => this.game.getLowestPosition(),
			),
			new PieceQueueWidget(() => this.game.queue.peek(5))
		], 16);
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

	draw(theme: GameTheme, ctx: CanvasRenderingContext2D): void {
		this.layout.draw(ctx, 0, 0, theme);
		if (this.isFinished) {
			drawLabel("Winner!", 0, 0, theme.Typography.TitleFontSize, theme.Typography.TitleFontFamily, theme.Colors.TextPrimary, ctx);
		}
	}
}
