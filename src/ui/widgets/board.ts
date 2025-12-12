import "../../extensions/canvas";
import { Widget, Size } from "../widget";
import { Piece } from "../../game/piece";
import { GameTheme } from "../../theme";
import { drawPieceShape, pieceIndexToColor } from "../util";

export class BoardWidget extends Widget {
		private gridProvider: () => number[][];
		private sizeProvider: () => { width: number, height: number };
		private visibleHeightProvider: () => number;
		private activePieceProvider: () => Piece | null;
		private previewYProvider: () => number;

	constructor(
		gridProvider: () => number[][],
		sizeProvider: () => { width: number, height: number },
		visibleHeightProvider: () => number,
		activePieceProvider: () => Piece | null,
		previewYProvider: () => number,
	) {
		super();
		this.gridProvider = gridProvider;
		this.sizeProvider = sizeProvider;
		this.visibleHeightProvider = visibleHeightProvider;
		this.activePieceProvider = activePieceProvider;
		this.previewYProvider = previewYProvider;
	}

	getMinSize(theme: GameTheme): Size {
		const size = this.sizeProvider();
		const visibleHeight = this.visibleHeightProvider();
		return {
			width: size.width * theme.Layout.BlockSize,
			height: visibleHeight * theme.Layout.BlockSize,
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

		const totalDimensions = this.sizeProvider();
		const visibleHeight = this.visibleHeightProvider();

		const skylineRows = 4;

		const bufferHeight = totalDimensions.height - visibleHeight;

		const pixelWidth = totalDimensions.width * bs;
		const pixelHeight = visibleHeight * bs;

		ctx.fillStyle = theme.Colors.BoardBackground;
		ctx.fillRect(x, y, pixelWidth, pixelHeight);

		ctx.lineWidth = 1;
		ctx.strokeStyle = theme.Colors.PieceBorder;

		for (let row = -skylineRows; row < visibleHeight; row++) {
			const rowIndex = row + bufferHeight;
			const actualRow = grid[rowIndex];
			for (let col = 0; col < totalDimensions.width; col ++) {
				const value = actualRow[col];
				const px = x + (col * bs);
				const py = y + (row * bs);

				if (value != 0) {
					ctx.fillStyle = pieceIndexToColor(value, theme);
					ctx.fillRect(px, py, bs, bs);
				}

				if (row >= 0) {
					ctx.strokeStyle = theme.Colors.PieceBorder;
					ctx.strokeInnerRect(px, py, bs, bs);
				}
			}
		}

		const piece = this.activePieceProvider();
		if (piece) {
			const previewY = this.previewYProvider();
			drawPieceShape(piece.shape, x + (piece.x*bs), y + ((previewY-visibleHeight)*bs), bs, true, theme, ctx);
			drawPieceShape(piece.shape, x + (piece.x*bs), y + ((piece.y-visibleHeight)*bs), bs, false, theme, ctx);
		};

		ctx.lineWidth = theme.Layout.BorderWidth;
		ctx.strokeStyle = theme.Colors.BoardBorder;

		const borderWidth = 4;
		const offset = borderWidth/2;
		ctx.strokeStyle = theme.Colors.BoardBorder;
		ctx.lineWidth = borderWidth;
		ctx.beginPath();
		ctx.moveTo(x-offset, y-borderWidth);
		ctx.lineTo(x-offset, y+pixelHeight+offset);
		ctx.lineTo(x+pixelWidth+offset, y+pixelHeight+offset);
		ctx.lineTo(x+pixelWidth+offset, y-borderWidth);
		ctx.stroke();
	}
}
