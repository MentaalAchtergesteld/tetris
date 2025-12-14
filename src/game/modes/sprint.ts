import { Widget } from "../../ui/widget";
import { Label } from "../../ui/widgets/label";
import { SizedBox } from "../../ui/widgets/layout";
import { LocalMode } from "./local";

export class SprintMode extends LocalMode {
	private readonly GOAL_LINES = 40;

	constructor() {
		super("up");
	}
	
	protected getModeName(): string { return "40 lines"; }

	protected getSidebarWidgets(): Widget[] {
		return [
			new Label(() => "time", "title", "right").setFill(true),
			new Label(() => this.timer.format(), "data", "right").setFill(true),
			new SizedBox(0, 16),
			new Label(() => "lines", "title", "right").setFill(true),
			new Label(() => `${this.linesCleared} / ${this.GOAL_LINES}`, "data", "right").setFill(true),
		];
	}

	protected getResultLabel(): string { return `final time: ${this.timer.format()}`; }

	protected onReset(): void {}

	protected onLineClear(lines: number): void {
		if (this.linesCleared >= this.GOAL_LINES) this.finish(true);
	}
}

