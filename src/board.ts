import { COLORS, Piece } from "./piece";

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

	draw(blockSize: number, ctx: CanvasRenderingContext2D) {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				ctx.fillStyle = "hsla(0, 0%, 15%, 0.1)";
				ctx.strokeStyle = "hsla(0, 0%, 5%, 0.1)";
				ctx.fillRect(x*blockSize, y*blockSize, blockSize, blockSize);
				ctx.strokeRect(x*blockSize, y*blockSize, blockSize, blockSize);

				if (this.grid[y][x] == 0) continue;
				const blockColor = COLORS[this.grid[y][x]] || "transparent";
				ctx.fillStyle = blockColor;
				ctx.strokeStyle  = "hsla(0, 0%, 5%, 1.0)";
				ctx.fillRect(x*blockSize, y*blockSize, blockSize, blockSize);
				ctx.strokeRect(x*blockSize, y*blockSize, blockSize, blockSize);
			}
		}
	}
}
