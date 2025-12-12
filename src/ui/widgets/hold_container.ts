import {  MAX_PIECE_BOUNDS, SHAPES, TetrominoType } from "../../game/piece";
import { GameTheme } from "../../theme";
import { Size, Widget } from "../widget";
import { drawPieceCentered } from "../util";

export class HoldContainerWidget extends Widget {
	private holdPieceProvider: () => TetrominoType | null;

	constructor(holdPieceProvider: () => TetrominoType | null) {
		super();
		this.holdPieceProvider = holdPieceProvider;
	}

	getMinSize(theme: GameTheme): Size {
		return {
			width: (MAX_PIECE_BOUNDS.width+.5)*theme.Layout.BlockSize,
		  height: (MAX_PIECE_BOUNDS.height+1)*theme.Layout.BlockSize,
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

		const piece = this.holdPieceProvider();
		if (!piece) return;

		drawPieceCentered(
			SHAPES[piece],
			x, y,
			width, height,
			theme.Layout.BlockSize,
			theme, ctx
		);
		}
}
