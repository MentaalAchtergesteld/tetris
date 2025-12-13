import { Game } from "../../game/game";
import { Piece, TetrominoType } from "../../game/piece";
import { Color, GameTheme } from "../../theme";
import { Size, Widget } from "../widget";
import { BoardWidget } from "./board";
import { HoldContainerWidget } from "./hold_container";
import { Label } from "./label";
import { Center, HBox, SizedBox, Spacer, VBox } from "./layout";
import { PieceQueueWidget } from "./piece_queue";

export class StandardGame extends Widget {
	private root: Widget;
	private infoWidgets: Widget[];

	private gridProvider: () => number[][];
	private sizeProvider: () => { width: number, height: number };
	private visibleHeightProvider: () => number;
	private activePieceProvider: () => Piece | null;
	private previewYProvider: () => number;
	private holdPieceProvider: () => TetrominoType | null;
	private queueProvider: () => TetrominoType[];
	private dangerProvider: () => number;

	constructor(
		game: Game,
		dangerProvider: () => number,
		infoWidgets: Widget[] = [],
	) {
		super();

		this.gridProvider = () => game.getGrid();
		this.sizeProvider = () => game.getDimensions();
		this.visibleHeightProvider = () => game.getVisibleHeight();
		this.activePieceProvider = () => game.getCurrentPiece();
		this.previewYProvider = () => game.getCurrentPieceLowestY();
		this.holdPieceProvider = () => game.getHoldType();
		this.queueProvider = () => game.getQueue(5);
		this.dangerProvider = dangerProvider;

		this.infoWidgets = infoWidgets;
		this.root = this.build();
	}

	build(): Widget {
		const LEFT_COLUMN = new VBox([
			new Label(() => "hold", "title", "left").setFill(true),
			new SizedBox(0, 8),
			new HoldContainerWidget(this.holdPieceProvider, this.dangerProvider),
			new Spacer(),
			...this.infoWidgets,
		], 8).setAlign("start").setFill(true);

		const CENTER_COLUMN = new VBox([
			new BoardWidget(
				this.gridProvider,
				this.sizeProvider,
				this.visibleHeightProvider,
				this.activePieceProvider,
				this.previewYProvider,
				this.dangerProvider,
			),
		], 8).setAlign("start").setFill(true);

		const RIGHT_COLUMN = new VBox([
			new Label(() => "queue", "title", "right").setFill(true),
			new SizedBox(0, 8),
			new PieceQueueWidget(this.queueProvider, this.dangerProvider),
		], 8).setAlign("start").setFill(true);

		return new Center(new HBox([LEFT_COLUMN, CENTER_COLUMN, RIGHT_COLUMN], 16));
	}

	getMinSize(theme: GameTheme): Size {
		return this.root.getMinSize(theme);    
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		this.root.draw(ctx, x, y, w, h, theme);
	}
}
