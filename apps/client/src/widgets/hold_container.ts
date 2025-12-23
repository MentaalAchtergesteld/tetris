import { MAX_PIECE_BOUNDS, SHAPES, TetrominoType } from "@tetris/core";
import { Provider, resolve, Size, StyledWidget } from "@tetris/ui";
import { drawPieceCentered } from "../util";
import { DEFAULT_GAME_STYLE, GameStyle } from "./standard_game";

export class HoldContainerWidget extends StyledWidget<GameStyle> {
	constructor(
		private holdPiece: Provider<TetrominoType | null>,
		private danger: Provider<number>,
	) { super(DEFAULT_GAME_STYLE); }

	getMinSize(): Size {
		return {
			width: (MAX_PIECE_BOUNDS.width+.5)*this.style.blockSize,
		  height: (MAX_PIECE_BOUNDS.height+1)*this.style.blockSize,
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

		const piece = resolve(this.holdPiece);
		if (!piece) return;

		drawPieceCentered(
			SHAPES[piece],
			x, y,
			width, height,
			this.style.blockSize,
			this.style.pieceColors,
			this.style.ghostColor,
			ctx
		);
		}
}
