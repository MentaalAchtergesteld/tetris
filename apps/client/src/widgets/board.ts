import "../../extensions/canvas";
import { Size, StyledWidget, Provider, resolve } from "@tetris/ui";
import { Piece } from "@tetris/core";

export interface BoardStyle {
	blockSize: number;
	borderWidth: number;

	backgroundColor: string;
	gridLineColor: string;
	boardBorderColor: string;
	dangerColor: string;

	pieceColors: Record<number, string>,
	ghostColor: string;
}

const DEFAULT_BOARD_STYLE: BoardStyle = {
    blockSize: 32,
    borderWidth: 4,
    backgroundColor: "hsla(0, 0%, 5%, 0.8)",
    gridLineColor: "hsla(0, 0%, 5%, 0.5)",
    boardBorderColor: "hsl(0, 0%, 90%)",
    dangerColor: "hsl(0, 80%, 50%)",
    ghostColor: "hsla(0, 0%, 25%, 0.5)",
    pieceColors: {
        1: "hsl(190, 90%, 60%)", // I
        2: "hsl(240, 90%, 60%)", // J
        3: "hsl(35, 90%, 60%)",  // L
        4: "hsl(60, 90%, 60%)",  // O
        5: "hsl(110, 90%, 60%)", // S
        6: "hsl(290, 90%, 60%)", // T
        7: "hsl(0, 90%, 60%)",   // Z
        8: "hsl(0, 0%, 40%)"     // Garbage
    }
};

export class BoardWidget extends StyledWidget<BoardStyle> {
	constructor(
		private grid: Provider<number[][]>,
		private size: Provider<Size>,
		private visibleHeight: Provider<number>,
		private activePiece: Provider<Piece | null>,
		private ghostY: Provider<number>,
		private danger: Provider<number>,
	) { super(DEFAULT_BOARD_STYLE); }

	getMinSize(): Size {
		const width = resolve(this.size).width;
		const height = resolve(this.visibleHeight);

		return {
			width: width * this.style.blockSize,
			height: height * this.style.blockSize,
		}
	}

	private drawBlock(
		ctx: CanvasRenderingContext2D,
		x: number, y: number,
		color: string,
	) {
		const bs = this.style.blockSize;
		
		ctx.fillStyle = color;
		ctx.fillRect(x, y, bs, bs);
		ctx.strokeStyle = this.style.gridLineColor;
		ctx.lineWidth = 1;

		ctx.strokeInnerRect(x, y,bs, bs);
	}

	private drawPiece(
		ctx: CanvasRenderingContext2D,
		piece: Piece,
		boardX: number, boardY: number,
		gridY: number,
		visibleHeight: number,
		isGhost: boolean
	) {
		const bs = this.style.blockSize;
		
		piece.shape.forEach((row, dy) => {
			row.forEach((val, dx) => {
				if (val === 0) return;

				const px = boardX + (piece.x + dx) * bs;
				const py = boardY + ((gridY + dy) - visibleHeight) * bs;

				const color = isGhost 
						? this.style.ghostColor 
						: this.style.pieceColors[val] || "white";

				this.drawBlock(ctx, px, py, color);
			});
		});
    }

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
		const grid = resolve(this.grid);
		const size = resolve(this.size);
		const piece = resolve(this.activePiece);
		const ghostY = resolve(this.ghostY);
		const danger = resolve(this.danger);
		const visibleH = resolve(this.visibleHeight);

		const s = this.style;
		const bs = s.blockSize;

		const bufferHeight = size.height - visibleH;

		const pixelWidth = size.width * bs;
		const pixelHeight = visibleH * bs;

		ctx.fillStyle = s.backgroundColor;
		ctx.fillRect(x, y, pixelWidth, pixelHeight);

		for (let row = 0; row < visibleH; row++) {
			const gridRowIndex = row + bufferHeight;
			if (gridRowIndex < 0 || gridRowIndex >= size.height) continue;

			const rowData = grid[gridRowIndex];

			for (let col = 0; col < size.width; col++) {
				const cellValue = rowData[col];

				if (cellValue == 0) continue;
				const color = s.pieceColors[cellValue] || "grey";
				const px = x + (col * bs);
				const py = y + (row * bs);

				this.drawBlock(ctx, px, py, color);
			}
		}

		if (piece) {
			this.drawPiece(ctx, piece, x, y, ghostY + bufferHeight, visibleH, true);
			this.drawPiece(ctx, piece, x, y, piece.y + bufferHeight, visibleH, false);
		}
	}
}

// export class BoardWidget extends Widget {
// 	constructor(
// 		private gridProvider: () => number[][],
// 		private sizeProvider: () => { width: number, height: number },
// 		private visibleHeightProvider: () => number,
// 		private activePieceProvider: () => Piece | null,
// 		private previewYProvider: () => number,
// 		private dangerProvider: () => number,
// 	) { super(); }
//
// 	getMinSize(): Size {
// 		const size = this.sizeProvider();
// 		const visibleHeight = this.visibleHeightProvider();
// 		return {
// 			width: size.width * theme.Layout.BlockSize,
// 			height: visibleHeight * theme.Layout.BlockSize,
// 		}
// 	}
//
// 	drawShape(
// 		ctx: CanvasRenderingContext2D,
// 		shape: number[][],
// 		bx: number, by: number,
// 		bs: number,
// 		theme: GameTheme,
// 		isPreview: boolean
// 	) {
// 		shape.forEach((row, dy) => {
// 			row.forEach((val, dx) => {
// 				if (val == 0) return;
//
// 				const px = bx + dx * bs;
// 				const py = by + dy * bs;
//
// 				let color = pieceIndexToColor(val, theme);
// 				if (isPreview) color = theme.Colors.PiecePreview;
//
// 				ctx.fillStyle = color;
// 				ctx.fillRect(px, py, bs, bs);
//
// 				ctx.strokeStyle = theme.Colors.PieceBorder;
// 				ctx.lineWidth = 2;
// 				ctx.strokeInnerRect(px, py, bs, bs);
// 			});
// 		});
// 	}
//
// 	draw(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, w: number, theme: GameTheme): void {
// 		const bs = theme.Layout.BlockSize; 
// 		const grid = this.gridProvider();
//
// 		const totalDimensions = this.sizeProvider();
// 		const visibleHeight = this.visibleHeightProvider();
//
// 		const skylineRows = 4;
//
// 		const bufferHeight = totalDimensions.height - visibleHeight;
//
// 		const pixelWidth = totalDimensions.width * bs;
// 		const pixelHeight = visibleHeight * bs;
//
// 		ctx.fillStyle = theme.Colors.BoardBackground;
// 		ctx.fillRect(x, y, pixelWidth, pixelHeight);
//
// 		ctx.lineWidth = 1;
// 		ctx.strokeStyle = theme.Colors.PieceBorder;
//
// 		for (let row = -skylineRows; row < visibleHeight; row++) {
// 			const rowIndex = row + bufferHeight;
// 			const actualRow = grid[rowIndex];
// 			for (let col = 0; col < totalDimensions.width; col ++) {
// 				const value = actualRow[col];
// 				const px = x + (col * bs);
// 				const py = y + (row * bs);
//
// 				if (value != 0) {
// 					ctx.fillStyle = pieceIndexToColor(value, theme);
// 					ctx.fillRect(px, py, bs, bs);
// 				}
//
// 				if (row >= 0) {
// 					ctx.strokeStyle = theme.Colors.PieceBorder;
// 					ctx.strokeInnerRect(px, py, bs, bs);
// 				}
// 			}
// 		}
//
// 		const piece = this.activePieceProvider();
// 		if (piece) {
// 			const previewY = this.previewYProvider();
// 			drawPieceShape(piece.shape, x + (piece.x*bs), y + ((previewY-visibleHeight)*bs), bs, true, theme, ctx);
// 			drawPieceShape(piece.shape, x + (piece.x*bs), y + ((piece.y-visibleHeight)*bs), bs, false, theme, ctx);
// 		};
//
// 		ctx.lineWidth = theme.Layout.BorderWidth;
// 		ctx.strokeStyle = theme.Colors.BoardBorder;
//
// 		const borderWidth = 4;
// 		const offset = borderWidth/2;
// 		ctx.lineWidth = borderWidth;
// 		ctx.lineWidth = borderWidth;
//
// 		ctx.save();
// 		ctx.beginPath();
// 		ctx.moveTo(x-offset, y-borderWidth);
// 		ctx.lineTo(x-offset, y+pixelHeight+offset);
// 		ctx.lineTo(x+pixelWidth+offset, y+pixelHeight+offset);
// 		ctx.lineTo(x+pixelWidth+offset, y-borderWidth);
// 		ctx.strokeStyle = theme.Colors.BoardBorder;
// 		ctx.stroke();
// 		ctx.strokeStyle = theme.Colors.DangerBorder;
// 		ctx.globalAlpha = this.dangerProvider();
// 		ctx.stroke();
// 		ctx.restore();
// 	}
// }
