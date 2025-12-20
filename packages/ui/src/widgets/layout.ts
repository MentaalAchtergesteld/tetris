import { GameTheme } from "../../theme";
import { Size, Widget } from "../widget";

export class VBox extends Widget {
	private children: Widget[];
	private gap: number;

	constructor(children: Widget[], gap: number = 0) {
		super();
		this.children = children;
		this.gap = gap;
	}

	getMinSize(theme: GameTheme): Size {
		if (this.children.length == 0) return { width: 0, height: 0};

		let width = 0, height = 0;
		this.children.forEach(c => {
			const size = c.getMinSize(theme);
			width = Math.max(width, size.width);
			height += size.height;
		});

		height += (this.children.length-1) * this.gap;
		return { width, height };
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		if (this.children.length == 0) return;

		let usedHeight = 0;
		let expandedCount = 0;

		const childSizes= this.children.map(c => {
			const size = c.getMinSize(theme);
			if (c.layout.expand) expandedCount++;
			usedHeight += size.height;
			return size;
		});

		const totalGap = (this.children.length-1) * this.gap;
		const availableSpace = Math.max(0, h - usedHeight - totalGap);
		const extraPerChild = expandedCount > 0 ? (availableSpace / expandedCount) : 0;

		let currentY = y;

		this.children.forEach((child, i) => {
			const minSize = childSizes[i];

			let childHeight = minSize.height;
			if (child.layout.expand) childHeight += extraPerChild;

			let childWidth = minSize.width;
			let drawX = x;

			if (child.layout.fill) {
				childWidth = w;
			} else {
				if (child.layout.align == "center") drawX = x + (w-childWidth)/2;
				else if (child.layout.align == "end") drawX = x + (w-childWidth);
			}

			child.draw(ctx, drawX, currentY, childWidth, childHeight, theme);
			currentY += childHeight + this.gap;
		});
	}
}

export class HBox extends Widget {
	private children: Widget[];
	private gap: number;

	constructor(children: Widget[], gap: number = 0) {
		super();
		this.children = children;
		this.gap = gap;
	}

	getMinSize(theme: GameTheme): Size {
		if (this.children.length == 0) return { width: 0, height: 0};

		let width = 0, height = 0;
		this.children.forEach(c => {
			const size = c.getMinSize(theme);
			width += size.width;
			height = Math.max(height, size.height);
		});

		width += (this.children.length-1) * this.gap;
		return { width, height };
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		if (this.children.length == 0) return;

		let usedWidth = 0; 
		let expandedCount = 0;

		const childSizes = this.children.map(c => {
			const size = c.getMinSize(theme);
			if (c.layout.expand) expandedCount++;
			usedWidth += size.width;
			return size;
		});
		
		const totalGap = (this.children.length-1) * this.gap;
		const availableSpace = Math.max(0, w - usedWidth - totalGap);
		const extraPerChild = expandedCount > 0 ? (availableSpace / expandedCount) : 0;

		let currentX = x;

		this.children.forEach((child, i) => {
			const minSize = childSizes[i];

			let childWidth = minSize.width;
			if (child.layout.expand) childWidth += extraPerChild;

			let childHeight = minSize.height;
			let drawY = y;

			if (child.layout.fill) {
				childHeight = h;
			} else {
				if (child.layout.align == "center") drawY = y + (h-childHeight)/2;
				else if (child.layout.align == "end") drawY = y + (h-childHeight);
			}

			child.draw(ctx, currentX, drawY, childWidth, childHeight, theme);
			currentX += childWidth + this.gap;
		});
	}
}

export class Center extends Widget {
	child: Widget;

	constructor(child: Widget) {
		super();
		this.child = child;
	}

	getMinSize(theme: GameTheme): Size {
		return this.child.getMinSize(theme);
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		const size = this.getMinSize(theme); 

		const drawX = x + (w-size.width)/2;
		const drawY = y + (h-size.height)/2;

		this.child.draw(ctx, drawX, drawY, size.width, size.height, theme);
	}
}

export class Spacer extends Widget {
	constructor() {
		super();
		this.layout.expand = true;
	}

	getMinSize(): Size { return { width: 0, height: 0} }
	draw() {}
}

export class SizedBox extends Widget {
	private width: number;
	private height: number;

	constructor(width: number = 0, height: number = 0) {
		super();
		this.width = width;
		this.height = height;
	}

	getMinSize(): Size {
	    return { width: this.width, height: this.height };
	}

	draw(): void {}
}

export class Overlay extends Widget {
	children: Widget[];

	constructor(children: Widget[]) {
		super();
		this.children = children;
	}

	getMinSize(theme: GameTheme): Size {
		return this.children.reduce((acc, child) => {
			const { width, height } = child.getMinSize(theme);
			return {
				width: Math.max(acc.width, width),
				height: Math.max(acc.height, height),
			}
		}, { width: 0, height: 0});
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void {
		this.children.forEach(c => c.draw(ctx, x, y, w, h, theme)); 
	}
}
