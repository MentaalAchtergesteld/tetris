import { MAX_PIECE_BOUNDS, SHAPES, TetrominoType } from "../../game/piece";
import { GameTheme } from "../../theme";
import { drawPieceCentered } from "../util";
import { Size, Widget } from "../widget";

export class PieceQueueWidget extends Widget {
	private queueProvider: () => TetrominoType[];

	constructor(queueProvider: () => TetrominoType[]) {
		super();
		this.queueProvider = queueProvider;
	}

	getMinSize(theme: GameTheme): Size {
		const queue = this.queueProvider();
		const entryHeight = (MAX_PIECE_BOUNDS.height+.5)*theme.Layout.BlockSize;
		return {
			width: (MAX_PIECE_BOUNDS.width+.5)*theme.Layout.BlockSize,
			height: queue.length * entryHeight,
		}
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		const { width, height } = this.getMinSize(theme);

		ctx.fillStyle = theme.Colors.BoardBackground;
		ctx.fillRect(x, y, width, height);

		const borderWidth = 4;
		const offset = borderWidth/2;

		ctx.strokeStyle = theme.Colors.BoardBorder;
		ctx.lineWidth = borderWidth;

		ctx.strokeRect(x-offset,y-offset, width+borderWidth,height+borderWidth);

		const pieces = this.queueProvider();

		const entryHeight = (MAX_PIECE_BOUNDS.height+.5)*theme.Layout.BlockSize;
		for (let i = 0; i < pieces.length; i++) {
			drawPieceCentered(
				SHAPES[pieces[i]],
				x, y+entryHeight*i,
				width, entryHeight,
				theme.Layout.BlockSize,
				theme, ctx
			);
		}
	}
}
