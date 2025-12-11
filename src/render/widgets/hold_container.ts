import { drawPieceCentered, MAX_PIECE_BOUNDS, Piece } from "../../piece";
import { GameTheme } from "../../theme";
import { drawLabel } from "../../visuals";
import { measureText, Size, Widget } from "../widget";

export class HoldContainerWidget extends Widget {
	private holdPieceProvider: () => Piece | null;

	constructor(holdPieceProvider: () => Piece | null) {
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
		console.log("HOLD Y " + y);
	const { width, height } = this.getMinSize(theme);

	const labelText = "hold";
	const textSize = measureText(labelText, theme.Typography.TitleFontFamily, theme.Typography.TitleFontSize);

	y += textSize.height;

	drawLabel(labelText, x, y, theme.Typography.TitleFontSize, theme.Typography.TitleFontFamily, theme.Colors.BoardBorder, ctx);

	y += 8;

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
		piece.shape,
		x, y,
		width, height,
		theme.Layout.BlockSize,
		theme, ctx
	);
	}
}
