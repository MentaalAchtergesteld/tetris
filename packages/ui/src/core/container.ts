import { BaseTheme } from "../theme";
import { Widget } from "./widget";

export abstract class Container<Theme extends BaseTheme = BaseTheme> extends Widget {
	protected children: Widget<Theme>[] = [];

	constructor(children: Widget<Theme>[] = []) {
		super();
		this.children = children;
	}

	withChild(child: Widget<Theme>): this {
		this.children.push(child);
		return this;
	}
}
