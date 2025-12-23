import { Provider, resolve, Size, StyledWidget } from "@tetris/ui";
import { MAX_PIECE_BOUNDS, SHAPES, TetrominoType } from "@tetris/core";
import { drawPieceCentered } from "../util";
import { DEFAULT_GAME_STYLE, GameStyle } from "./standard_game";

export class PieceQueueWidget extends StyledWidget<GameStyle> {
	constructor(
		private queue: Provider<TetrominoType[]>,
		private danger: Provider<number>,
	) {	super(DEFAULT_GAME_STYLE); }

	getMinSize(): Size {
		const queue = resolve(this.queue);
		const entryHeight = (MAX_PIECE_BOUNDS.height+.5)*this.style.blockSize;
		return {
			width: (MAX_PIECE_BOUNDS.width+.5)*this.style.blockSize,
			height: queue.length * entryHeight,
		}
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
		const { width, height } = this.getMinSize();

		ctx.fillStyle = this.style.backgroundColor;
		ctx.fillRect(x, y, width, height);

		const borderWidth = 4;
		const offset = borderWidth/2;

		ctx.save();
		ctx.lineWidth = borderWidth;
		ctx.strokeStyle = this.style.boardBorderColor;
		ctx.strokeRect(x-offset,y-offset, width+borderWidth,height+borderWidth);
		ctx.strokeStyle = this.style.dangerColor;
		ctx.globalAlpha = resolve(this.danger);
		ctx.strokeRect(x-offset,y-offset, width+borderWidth,height+borderWidth);
		ctx.restore();

		const pieces = resolve(this.queue);

		const entryHeight = (MAX_PIECE_BOUNDS.height+.5)*this.style.blockSize;
		for (let i = 0; i < pieces.length; i++) {
			drawPieceCentered(
				SHAPES[pieces[i]],
				x, y+entryHeight*i,
				width, entryHeight,
				this.style.blockSize,
				this.style.pieceColors,
				this.style.ghostColor,
				ctx
			);
		}
	}
}
