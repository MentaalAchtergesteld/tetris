import { Align, Center, HBox, Label, Overlay, Provider, Size, SizedBox, Spacer, StyledWidget, VBox, Widget } from "@tetris/ui";
import { BoardWidget } from "./board";
import { Countdown } from "./countdown";
import { HoldContainerWidget } from "./hold_container";
import { PieceQueueWidget } from "./piece_queue";
import { Game, Piece, TetrominoType } from "@tetris/core";
import { DEFAULT_THEME, GameTheme } from "../theme";

export interface GameStyle {
	blockSize: number;
	borderWidth: number;

	backgroundColor: string;
	gridLineColor: string;
	boardBorderColor: string;
	dangerColor: string;

	pieceColors: Record<number, string>,
	ghostColor: string;
}

export const DEFAULT_GAME_STYLE: GameStyle = {
	blockSize: 32,
	borderWidth: 4,
	backgroundColor: "hsla(0, 0%, 5%, 0.8)",
	gridLineColor: "hsla(0, 0%, 5%, 0.5)",
	boardBorderColor: "hsl(0, 0%, 90%)",
	dangerColor: "hsl(0, 80%, 50%)",
	ghostColor: "hsla(0, 0%, 25%, 0.5)",
	pieceColors: {
			1: "hsl(0, 0%, 40%)",    // Garbage
			2: "hsl(190, 90%, 60%)", // I
			3: "hsl(240, 90%, 60%)", // J
			4: "hsl(35, 90%, 60%)",  // L
			5: "hsl(60, 90%, 60%)",  // O
			6: "hsl(110, 90%, 60%)", // S
			7: "hsl(290, 90%, 60%)", // T
			8: "hsl(0, 90%, 60%)",   // Z
	}
};

export class StandardGame extends StyledWidget<GameTheme> {
	private root: Widget;
	private infoWidgets: Widget[];

	private grid: Provider<number[][]>;
	private size: Provider<Size>;
	private visibleH: Provider<number>;
	private activePiece: Provider<Piece | null>;
	private ghostY: Provider<number>;
	private holdPiece: Provider<TetrominoType>;
	private queue: Provider<TetrominoType[]>;
	private danger: Provider<number>;
	private time: Provider<number>;
	private timerLabels: string[];

	constructor(
		game: Game,
		infoWidgets: Widget[],
		dangerProvider: () => number,
		timerProvider: () => number,
		timerLabels: string[] = ["ready", "set", "go"],
	) {
		super(DEFAULT_THEME);

		this.grid = () => game.getGrid();
		this.size = () => game.getDimensions();
		this.visibleH = () => game.getVisibleHeight();
		this.activePiece = () => game.getCurrentPiece();
		this.ghostY = () => game.getCurrentPieceLowestY();
		this.holdPiece = () => game.getHoldType();
		this.queue = () => game.getQueue(5);
		this.danger = dangerProvider;
		this.time = timerProvider;
		this.timerLabels = timerLabels;

		this.infoWidgets = infoWidgets;

		this.root = this.build();
	}

	build(): Widget {
		const LEFT_COLUMN = new VBox([
			new Label(() => "hold")
				.withStyle(this.style.typography.title)
				.setFill(true),
			new SizedBox(0, 4),
			new HoldContainerWidget(this.holdPiece, this.danger)
				.withStyle(this.style.game),
			new Spacer(),
			...this.infoWidgets,
		], 8).setAlign(Align.Start).setFill(true);

		const CENTER_COLUMN = new VBox([
			new BoardWidget(
				this.grid,
				this.size,
				this.visibleH,
				this.activePiece,
				this.ghostY,
				this.danger,
			).withStyle(this.style.game),
		], 8).setAlign(Align.Start);

		const RIGHT_COLUMN = new VBox([
			new Label(() => "queue")
				.withStyle(this.style.typography.title)
				.setFill(true),
			new SizedBox(0, 4),
			new PieceQueueWidget(this.queue, this.danger)
				.withStyle(this.style.game),
		], 8).setAlign(Align.Start);

		const gameLayer = new HBox([LEFT_COLUMN, CENTER_COLUMN, RIGHT_COLUMN], 24);
		const timer = new Center(new Countdown(this.time, this.timerLabels).withStyle(this.style.typography.title));

		return new Center(new Overlay([gameLayer, timer]));
	}

	getMinSize(): Size {
		return this.root.getMinSize();    
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
		this.root.draw(ctx, x, y, w, h);
	}
}
