import { Align, LayoutData, LayoutOptions, Size } from "./types";

export abstract class Widget {
	public layout: LayoutData = {
		expand: false,
		fill: false,
		align: Align.Center,
	}

	public setExpand(val: boolean): this {
		this.layout.expand = val; 
		return this;
	}

	public setFill(val: boolean): this {
		this.layout.fill = val;
		return this;
	}

	public setAlign(val: Align): this {
		this.layout.align = val;
		return this;
	}

	public setLayout(opts: LayoutOptions): this {
		Object.assign(this.layout, opts);
		return this;
	}

	abstract getMinSize(): Size;

	abstract draw(
		ctx: CanvasRenderingContext2D,
		x: number, y: number,
		w: number, h: number,
	): void;
}

export abstract class StyledWidget<S extends object> extends Widget {
	protected style: S;

	constructor(defaultStyle: S) {
		super();
		this.style = { ...defaultStyle };
	}

	public withStyle(s: Partial<S>): this {
		Object.assign(this.style, s);
		return this;
	}
}
