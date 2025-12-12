import { Piece, TetrominoType } from "../../game/piece";
import { GameTheme } from "../../theme";
import { Size, Widget } from "../widget";
import { BoardWidget } from "./board";
import { HoldContainerWidget } from "./hold_container";
import { Label } from "./label";
import { Center, HBox, SizedBox, Spacer, VBox } from "./layout";
import { PieceQueueWidget } from "./piece_queue";

export class StandardGame extends Widget {
	private root: Widget;
	private infoWidgets: Widget[];

	constructor(
		private gridProvider: () => number[][],
		private sizeProvider: () => { width: number, height: number },
		private visibleHeightProvider: () => number,
		private activePieceProvider: () => Piece | null,
		private previewYProvider: () => number,
		private holdPieceProvider: () => TetrominoType | null,
		private queueProvider: () => TetrominoType[],
		infoWidgets: Widget[] = [],
	) {
		super();
		this.infoWidgets = infoWidgets;
		this.root = this.build();
	}

	build(): Widget {
		const LEFT_COLUMN = new VBox([
			new Label(() => "hold", "title", "left").setFill(true),
			new SizedBox(0, 8),
			new HoldContainerWidget(this.holdPieceProvider),
			new Spacer(),
			...this.infoWidgets,
		], 8).setAlign("start").setFill(true);

		const CENTER_COLUMN = new VBox([
			new BoardWidget(
				this.gridProvider,
				this.sizeProvider,
				this.visibleHeightProvider,
				this.activePieceProvider,
				this.previewYProvider
			),
		], 8).setAlign("start").setFill(true);

		const RIGHT_COLUMN = new VBox([
			new Label(() => "queue", "title", "right").setFill(true),
			new SizedBox(0, 8),
			new PieceQueueWidget(this.queueProvider),
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
