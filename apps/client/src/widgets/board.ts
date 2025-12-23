import "../extensions/canvas"
import { Size, StyledWidget, Provider, resolve } from "@tetris/ui";
import { Piece } from "@tetris/core";
import { DEFAULT_GAME_STYLE, GameStyle } from "./standard_game";

export class BoardWidget extends StyledWidget<GameStyle> {
	constructor(
		private grid: Provider<number[][]>,
		private size: Provider<Size>,
		private visibleHeight: Provider<number>,
		private activePiece: Provider<Piece | null>,
		private ghostY: Provider<number>,
		private danger: Provider<number>,
	) { super(DEFAULT_GAME_STYLE); }

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
		const danger = resolve(this.danger);
		const visibleH = resolve(this.visibleHeight);

		const s = this.style;
		const bs = s.blockSize;

		const bufferHeight = size.height - visibleH;

		const pixelWidth = size.width * bs;
		const pixelHeight = visibleH * bs;

		ctx.save();
		// ctx.translate(x, y);

		ctx.fillStyle = s.backgroundColor;
		ctx.fillRect(x, y, pixelWidth, pixelHeight);

		for (let row = 0; row < visibleH; row++) {
			const gridRowIndex = row + bufferHeight;
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

		const piece = resolve(this.activePiece);
		if (piece) {
			const ghostY = resolve(this.ghostY);
			this.drawPiece(ctx, piece, x, y, ghostY+bufferHeight, visibleH, true);
			this.drawPiece(ctx, piece, x, y, ghostY+bufferHeight, visibleH, false);
		}

		const borderOffset = s.borderWidth/2;
		const borderWidth = this.style.borderWidth;
		ctx.beginPath();
		ctx.moveTo(x-borderOffset, y-borderWidth);
		ctx.lineTo(x-borderOffset, y+pixelHeight+borderOffset);
		ctx.lineTo(x+pixelWidth+borderOffset, y+pixelHeight+borderOffset);
		ctx.lineTo(x+pixelWidth+borderOffset, y-borderWidth);

		ctx.lineWidth = borderWidth;
		ctx.strokeStyle = this.style.boardBorderColor;
		ctx.stroke();

		if (danger > 0) {
			ctx.globalAlpha = danger;
			ctx.strokeStyle = s.dangerColor;
			ctx.stroke();
		}

		ctx.restore();
	}
}
