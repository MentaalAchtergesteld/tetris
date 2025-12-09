import { COLORS, Piece, pieceIndexToColor } from "./piece";
import { ColorTheme } from "./theme";

export class Board {
	width: number;
	height: number;
	grid: number[][];

	constructor(width: number = 10, height: number = 20) {
		this.width = width;
		this.height = height;

		this.initializeGrid();
	}

	initializeGrid() {
		this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(0));
	}

	isEmpty(x: number, y: number): boolean {
		return (
			x >= 0 &&
			x < this.width &&
			y >= 0 &&
			y < this.height &&
			this.grid[y][x] === 0
		)
	}

	lockPiece(piece: Piece) {
		piece.shape.forEach((row, y) => {
			row.forEach((value, x) => {
				if (value == 0) return;
				const boardX = piece.x + x;
				const boardY = piece.y + y;

				if (boardX < 0 || boardX >= this.width) return;
				if (boardY < 0 || boardY >= this.height) return;
				this.grid[boardY][boardX] = value;
			})
		})
	}

	checkLineClear(): number {
		let linesCleared = 0;
		for (let y = this.height-1; y >= 0; y--) {
			if(this.grid[y].includes(0)) continue;
			this.grid.splice(y, 1);
			const emptyRow = Array(this.width).fill(0);
			this.grid.unshift(emptyRow);
			y++;
			linesCleared++;
		}
		return linesCleared;
	}

	print() {
		console.table(this.grid);
	}

	draw(blockSize: number, theme: ColorTheme, ctx: CanvasRenderingContext2D) {
		const width = this.width * blockSize;
		const height = this.height * blockSize;

		ctx.fillStyle = theme.BoardBackground;
		ctx.fillRect(0, 0, width, height);

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				ctx.strokeStyle = theme.TileBorder;
				ctx.strokeRect(x*blockSize, y*blockSize, blockSize, blockSize);

				if (this.grid[y][x] == 0) continue;
				const blockColor = pieceIndexToColor(this.grid[y][x], theme);
				ctx.fillStyle = blockColor;
				ctx.fillRect(x*blockSize, y*blockSize, blockSize, blockSize);
			}
		}

		const borderWidth = 4;
		const offset = borderWidth/2;
		ctx.strokeStyle = theme.BoardBorder;
		ctx.lineWidth = borderWidth;
		ctx.beginPath();
		ctx.moveTo(-offset, -offset);
		ctx.lineTo(-offset, height+offset);
		ctx.lineTo(width+offset, height+offset);
		ctx.lineTo(width+offset, -offset);
		ctx.stroke();
	}
}
