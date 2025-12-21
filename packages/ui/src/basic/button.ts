import { Size } from "../core/types";
import { StyledWidget } from "../core/widget";
import { Label, LabelStyle, TextAlign } from "./label";
import { Panel, PanelStyle } from "./panel";

export interface ButtonStyle {
	defaultPanel: PanelStyle;
	label: LabelStyle;

	hoverPanel?: Partial<PanelStyle>;
	activePanel?: Partial<PanelStyle>;
}

const DEFAULT_BUTTON_STYLE: ButtonStyle = {
	defaultPanel: {
		backgroundColor: "#444",
		borderColor: "transparent",
		borderWidth: 0,
		cornerRadius: 4,
		shadowColor: "transparent",
		shadowBlur: 0,
	},
	label: {
		fontFamily: "Arial",
		fontSize: 16,
		fontWeight: "normal",
		color: "#fff",
		textAlign: TextAlign.Center,
	},
	hoverPanel: {
		backgroundColor: "#555",
	},
	activePanel: {
		backgroundColor: "#222",
	}
};

export class Button extends StyledWidget<ButtonStyle> {
	private internalPanel: Panel;
	private internalLabel: Label;

	private isHovered = false;
	private isDown = false;

	constructor(text: string) {
		super(DEFAULT_BUTTON_STYLE);

		this.internalPanel = new Panel();
		this.internalLabel = new Label(text).withStyle(this.style.label);
	}

	setHover(val: boolean) { this.isHovered = val; }
	setDown(val: boolean) { this.isDown = val; }

	getMinSize(): Size {
		const s = this.internalLabel.getMinSize();
		return { width: s.width + 20, height: s.height + 20 };
	}

	draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
		let currentPanelStyle = { ...this.style.defaultPanel };

		if (this.isHovered && this.style.hoverPanel) {
			Object.assign(currentPanelStyle, this.style.hoverPanel);
		}

		if (this.isDown && this.style.activePanel) {
			Object.assign(currentPanelStyle, this.style.activePanel);
		}

		this.internalPanel
			.withStyle(currentPanelStyle)
			.draw(ctx, x, y, w, h);

		this.internalPanel.draw(ctx, x, y, w, h);
	}
}
