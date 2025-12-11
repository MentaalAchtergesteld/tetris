import "../extensions/canvas";

import { drawPieceCentered, drawPieceShape, MAX_PIECE_BOUNDS, Piece, pieceIndexToColor, TETROMINOS, TetrominoType } from "../piece";
import { GameTheme } from "../theme";
import { drawLabel, getTextHeight } from "../visuals";

export interface Widget {
	getHeight(theme: GameTheme): number;
	getWidth(theme: GameTheme): number;
	getSize(theme: GameTheme): { width: number, height: number };

	draw(
		ctx: CanvasRenderingContext2D,
		x: number, y: number,
		theme: GameTheme
	): void;
}

export class VerticalContainerWidget implements Widget {
	private children: Widget[];
	private gap: number;
	
	constructor(children: Widget[], gap: number = 10) {
		this.children = children;
		this.gap = gap;
	}

	getWidth(theme: GameTheme): number {
	  if (this.children.length == 0) return 0;
		return Math.max(...this.children.map(c => c.getWidth(theme)));
	}

	getHeight(theme: GameTheme): number {
	  if (this.children.length == 0) return 0;
		return this.children.reduce((previous, w) => previous + w.getHeight(theme), 0);
	}

	getSize(theme: GameTheme): { width: number; height: number; } {
		return { width: this.getWidth(theme), height: this.getHeight(theme) };
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number,theme: GameTheme): void {
		let currentY = y;

		this.children.forEach(child => {
			const childH = child.getHeight(theme);

			child.draw(ctx, x, currentY, theme);
			currentY += childH + this.gap;
		})
	}
}

export class HorizontalContainerWidget implements Widget {
	private children: Widget[];
	private gap: number;
	
	constructor(children: Widget[], gap: number = 10) {
		this.children = children;
		this.gap = gap;
	}

	getWidth(theme: GameTheme): number {
	  if (this.children.length == 0) return 0;
		return this.children.reduce((previous, w) => previous + w.getWidth(theme), 0);
	}

	getHeight(theme: GameTheme): number {
	  if (this.children.length == 0) return 0;
		return Math.max(...this.children.map(c => c.getHeight(theme)));
	}

	getSize(theme: GameTheme): { width: number; height: number; } {
		return { width: this.getWidth(theme), height: this.getHeight(theme) };
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, theme: GameTheme): void {
		let currentX = x;

		this.children.forEach(child => {
			const childW = child.getWidth(theme);

			child.draw(ctx, currentX, y, theme);
			currentX += childW + this.gap;
		})
	}
}

export class BoardWidget implements Widget {
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
		this.gridProvider = gridProvider;
		this.sizeProvider = sizeProvider;
		this.activePieceProvider = activePieceProvider;
		this.previewYProvider = previewYProvider;
	}


	getWidth(theme: GameTheme): number {
		return this.sizeProvider().width * theme.Layout.BlockSize; 
	}

	getHeight(theme: GameTheme): number {
		return this.sizeProvider().height * theme.Layout.BlockSize; 
	}

	getSize(theme: GameTheme): { width: number; height: number; } {
		return { width: this.getWidth(theme), height: this.getHeight(theme) }; 
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

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, theme: GameTheme): void {
		const bs = theme.Layout.BlockSize; 
		const grid = this.gridProvider();

		const { width, height } = this.getSize(theme);

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

export class HoldContainerWidget implements Widget {
	private holdPieceProvider: () => Piece | null;

	constructor(holdPieceProvider: () => Piece | null) {
		this.holdPieceProvider = holdPieceProvider;
	}

	getWidth(theme: GameTheme): number {
		return (MAX_PIECE_BOUNDS.width+.5)*theme.Layout.BlockSize;
	}

	getHeight(theme: GameTheme): number {
		return (MAX_PIECE_BOUNDS.height+1)*theme.Layout.BlockSize;
	}

	getSize(theme: GameTheme): { width: number; height: number; } {
		return { width: this.getWidth(theme), height: this.getHeight(theme) }; 
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, theme: GameTheme): void {
	const { width, height } = this.getSize(theme);

	const labelText = "hold";
	const textHeight = getTextHeight(labelText, theme.Typography.TitleFontSize, theme.Typography.TitleFontFamily, ctx);

	y += textHeight;

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

export class PieceQueueWidget implements Widget {
	private queueProvider: () => TetrominoType[];

	constructor(queueProvider: () => TetrominoType[]) {
		this.queueProvider = queueProvider;
	}

	getWidth(theme: GameTheme): number {
		return (MAX_PIECE_BOUNDS.width+.5)*theme.Layout.BlockSize;
	}

	getHeight(theme: GameTheme): number {
		const queue = this.queueProvider(); 
		const entryHeight = (MAX_PIECE_BOUNDS.height+.5)*theme.Layout.BlockSize;
		return queue.length * entryHeight;
	}

	getSize(theme: GameTheme): { width: number; height: number; } {
		return { width: this.getWidth(theme), height: this.getHeight(theme) }; 
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, theme: GameTheme): void {
		const { width, height } = this.getSize(theme);

		const labelText = "queue";
		const textHeight = getTextHeight(labelText, theme.Typography.TitleFontSize, theme.Typography.TitleFontFamily, ctx);

		y += textHeight;

		drawLabel(labelText, x, y, theme.Typography.TitleFontSize, theme.Typography.TitleFontFamily, theme.Colors.TextPrimary, ctx);

		y += 8;

		ctx.fillStyle = theme.Colors.BoardBackground;
		ctx.fillRect(x, y, width, height);

		const borderWidth = 4;
		const offset = borderWidth/2;

		ctx.strokeStyle = theme.Colors.BoardBorder;
		ctx.lineWidth = borderWidth;

		ctx.strokeRect(x-offset,y-offset, width+borderWidth,height+borderWidth);

		const pieces = this.queueProvider();

		const entryHeight = (MAX_PIECE_BOUNDS.height+.5)*theme.Layout.BlockSize;
		for (let i = 0; i < pieces.length; i++) {
			drawPieceCentered(
				TETROMINOS[pieces[i]],
				x, y+entryHeight*i,
				width, entryHeight,
				theme.Layout.BlockSize,
				theme, ctx
			);
		}
	}
}

export class SpacerWidget implements Widget {
	constructor(private width: number, private height: number) {}

	getWidth(): number { return this.width }
	getHeight(): number { return this.height }
	getSize(): { width: number; height: number; } {
	    return { width: this.getWidth(), height: this.getHeight() }
	}

	draw(): void {}
}

export class GameTimerWidget implements Widget {
	private label: string;
	private formattedTimeProvider: () => string;

	constructor(label: string, formattedTimeProvider: () => string) {
		this.label = label;
		this.formattedTimeProvider = formattedTimeProvider;
	}

	getWidth(theme: GameTheme): number {
		return (MAX_PIECE_BOUNDS.width+.5)*theme.Layout.BlockSize;
	}

	getHeight(theme: GameTheme): number {
		return 2.5 * theme.Layout.BlockSize;
	}

	getSize(theme: GameTheme): { width: number; height: number; } {
		return { width: this.getWidth(theme), height: this.getHeight(theme) } 
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, theme: GameTheme): void {
		const { width, height } = this.getSize(theme); 
		
		const timeText = this.formattedTimeProvider();

		ctx.font = `12px ${theme.Typography.TitleFontFamily}`;
		ctx.fillStyle = theme.Colors.TextSecondary;
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText(this.label, x, y);

		ctx.font = `24px ${theme.Typography.DataFontFamily}`;
		ctx.fillStyle = theme.Colors.TextPrimary;
		ctx.textAlign = "right";
		ctx.textBaseline = "bottom";
		ctx.fillText(timeText, x+width, y+height);

		ctx.fillStyle = theme.Colors.BoardBorder;
		ctx.fillRect(x, y + height, width, 2);
	}
}
