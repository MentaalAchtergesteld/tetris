import { Provider, resolve, Size } from "../core/types";
import { StyledWidget } from "../core/widget";
import { measureText } from "../util";

export enum TextAlign {
	Left, Center, Right
};

export type FontWeight = "normal" | "bold" | "bolder" | "lighter" | number;

export interface LabelStyle {
	fontFamily: string;
	fontSize: number;
	fontWeight: FontWeight;
	color: string;
	textAlign: TextAlign;
}

const DEFAULT_LABEL_STYLE: LabelStyle = {
	fontFamily: "Arial",
	fontSize: 16,
	fontWeight: "normal",
	color: "#fff",
	textAlign: TextAlign.Left,
}

export class Label extends StyledWidget<LabelStyle> {
	constructor(
		private text: Provider<string>,
	) { super(DEFAULT_LABEL_STYLE); }

	setFontFamily(fontFamily: string): this {
		return this.withStyle({ fontFamily })
	}

	setFontSize(fontSize: number): this {
		return this.withStyle({ fontSize });
	}

	setFontWeight(fontWeight: FontWeight): this {
		return this.withStyle({ fontWeight });
	}

	setColor(color: string): this {
		return this.withStyle({ color });
	}

	setTextAlign(textAlign: TextAlign): this {
		return this.withStyle({ textAlign });
	}

	getMinSize(): Size {
		const size = measureText(
			resolve(this.text),
			this.style.fontFamily,
			this.style.fontSize,
			this.style.fontWeight
		);

		return {
			width: size.width,
			height: this.style.fontSize,
		}
	}

	getComputedStyle() {
		return `${this.style.fontWeight} ${this.style.fontSize}px ${this.style.fontFamily}`;
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
		ctx.save();
		ctx.font = this.getComputedStyle();
		ctx.fillStyle = this.style.color;

		let drawX = x;
		switch (this.style.textAlign) {
			case TextAlign.Left:
				ctx.textAlign = "left";
				break;
			case TextAlign.Center:
				drawX = x + (w/2);
				ctx.textAlign = "center";
				break;
			case TextAlign.Right:
				drawX = x + w;
				ctx.textAlign = "right";
				break;
		}

		ctx.textBaseline = "middle";
		ctx.fillText(resolve(this.text), drawX, y + (h/2));
		ctx.restore();
	}
}
