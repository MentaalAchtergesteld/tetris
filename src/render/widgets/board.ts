import { Widget, Size } from "../widget";
import { drawPieceShape, Piece, pieceIndexToColor } from "../../piece";
import { GameTheme } from "../../theme";

export class BoardWidget extends Widget {
		private gridProvider: () => number[][];
		private sizeProvider: () => { width: number, height: number };
		private activePieceProvider: () => Piece | null;
		private previewYProvider: () => number;

	constructor(
		gridProvider: () => number[][],
		sizeProvider: () => { width: number, height: number },
		activePieceProvider: () => Piece | null,
		previewYProvider: () => number,
	) {
		super();
		this.gridProvider = gridProvider;
		this.sizeProvider = sizeProvider;
		this.activePieceProvider = activePieceProvider;
		this.previewYProvider = previewYProvider;
	}

	getMinSize(theme: GameTheme): Size {
		const size = this.sizeProvider();
		return {
			width: size.width * theme.Layout.BlockSize,
			height: size.height * theme.Layout.BlockSize,
		}
	}

	drawShape(
		ctx: CanvasRenderingContext2D,
		shape: number[][],
		bx: number, by: number,
		bs: number,
		theme: GameTheme,
		isPreview: boolean
	) {
		shape.forEach((row, dy) => {
			row.forEach((val, dx) => {
				if (val == 0) return;

				const px = bx + dx * bs;
				const py = by + dy * bs;

				let color = pieceIndexToColor(val, theme);
				if (isPreview) color = theme.Colors.PiecePreview;

				ctx.fillStyle = color;
				ctx.fillRect(px, py, bs, bs);

				ctx.strokeStyle = theme.Colors.PieceBorder;
				ctx.lineWidth = 2;
				ctx.strokeInnerRect(px, py, bs, bs);
			});
		});
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, w: number, theme: GameTheme): void {
		const bs = theme.Layout.BlockSize; 
		const grid = this.gridProvider();

		const { width, height } = this.getMinSize(theme);

		ctx.fillStyle = theme.Colors.BoardBackground;
		ctx.fillRect(x, y, width, height);

		ctx.lineWidth = 1;
		ctx.strokeStyle = theme.Colors.PieceBorder;

		for (let row = 0; row < grid.length; row++) {
			for (let col = 0; col < grid[row].length; col ++) {
				const value = grid[row][col];
				if (value == 0) continue;
				
				const px = x + (col * bs);
				const py = y + (row * bs);

				ctx.fillStyle = pieceIndexToColor(value, theme);
				ctx.fillRect(px, py, bs, bs);
				ctx.strokeInnerRect(px, py, bs, bs);
			}
		}

		const piece = this.activePieceProvider();
		if (piece) {
			const previewY = this.previewYProvider();
			drawPieceShape(piece.shape, x + (piece.x*bs), y + (previewY*bs), bs, true, theme, ctx);
			drawPieceShape(piece.shape, x + (piece.x*bs), y + (piece.y*bs), bs, false, theme, ctx);
		};

		ctx.lineWidth = theme.Layout.BorderWidth;
		ctx.strokeStyle = theme.Colors.BoardBorder;

		const borderWidth = 4;
		const offset = borderWidth/2;
		ctx.strokeStyle = theme.Colors.BoardBorder;
		ctx.lineWidth = borderWidth;
		ctx.beginPath();
		ctx.moveTo(x-offset, y-borderWidth);
		ctx.lineTo(x-offset, y+height+offset);
		ctx.lineTo(x+width+offset, y+height+offset);
		ctx.lineTo(x+width+offset, y-borderWidth);
		ctx.stroke();
	}
}
