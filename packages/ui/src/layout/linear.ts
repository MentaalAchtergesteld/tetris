import { Container } from "../core/container";
import { Align, Size } from "../core/types";
import { Widget } from "../core/widget";
import { BaseTheme } from "../theme";

export enum Orientation {
	Horizontal, Vertical
}

export abstract class LinearLayout extends Container {
	constructor(
		children: Widget[],
		protected gap: number,
		private orientation: Orientation
	) {
		super(children);
	}

	private getMain(size: Size): number {
		return this.orientation == Orientation.Vertical ? size.height : size.width;
	}

	private getCross(size: Size): number {
		return this.orientation == Orientation.Vertical ? size.width : size.height;
	}

	private createSize(main: number, cross: number): Size {
		return this.orientation == Orientation.Vertical
			? { width: cross, height: main }
			: { width: main, height: cross };
	}

	getMinSize(theme: BaseTheme): Size {
		if (this.children.length == 0) return { width: 0, height: 0 };
		
		let totalMain = 0;
		let maxCross = 0;

		this.children.forEach(c => {
			const size = c.getMinSize(theme);

			totalMain += this.getMain(size);
			maxCross = Math.max(maxCross, this.getCross(size));
		});

		totalMain += (this.children.length-1)*this.gap;

		return this.createSize(totalMain, maxCross);
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: BaseTheme): void {
		if (this.children.length == 0) return;

		const isVertical = this.orientation == Orientation.Vertical;

		const availableMainSpace = isVertical ? h : w;
		const availableCrossSpace = isVertical ? w : h;

		let usedMainSpace = 0;
		let expandedCount = 0;

		const childSizes = this.children.map(c => {
			const size = c.getMinSize(theme);
			usedMainSpace += this.getMain(size);
			if (c.layout.expand) expandedCount++;
			return size;
		});

		const totalGap = (this.children.length-1) * this.gap;
		const freeSpace = Math.max(0, availableMainSpace - usedMainSpace - totalGap);
		const extraPerChild = expandedCount > 0 ? (freeSpace/expandedCount) : 0;

		let currentPos = isVertical ? y : x;

		this.children.forEach((child, i) => {
			const minSize = childSizes[i];

			let childMain = this.getMain(minSize);
			let childCross = this.getCross(minSize);

			if (child.layout.expand) childMain += extraPerChild;
			
			let drawX = x;
			let drawY = y;
			let offsetCross = 0;

			if (!child.layout.fill) {
				if      (child.layout.align == Align.Center) offsetCross = (availableMainSpace-childCross)/2;
				else if (child.layout.align == Align.End)    offsetCross = (availableMainSpace-childCross);
			} else {
				childCross = availableCrossSpace;
			}

			if (isVertical) {
				drawX = x + offsetCross;
				drawY = currentPos;
			} else {
				drawX = currentPos;
				drawY = y + offsetCross;
			}

			const finalW = isVertical ? childCross : childMain;
			const finalH = isVertical ? childMain : childCross;

			child.draw(ctx, drawX, drawY, finalW, finalH, theme);

			currentPos += childMain + this.gap;
		});
	}
}
