import { Label, SizedBox, TextAlign, Widget } from "@tetris/ui";
import { LocalMode } from "./local";
import { activeTheme } from "../../theme";

export class SprintMode extends LocalMode {
	private readonly GOAL_LINES = 40;

	constructor() {
		super("up");
	}
	
	protected getModeName(): string { return "40 lines"; }

	protected getSidebarWidgets(): Widget[] {
		return [
			new Label(() => "time")
				.withStyle(activeTheme.typography.title)
				.setTextAlign(TextAlign.Right)
				.setFill(true),
			new Label(() => this.timer.format())
				.withStyle(activeTheme.typography.data)
				.setTextAlign(TextAlign.Right)
				.setFill(true),
			new SizedBox(0, 16),
			new Label(() => "lines")
				.withStyle(activeTheme.typography.title)
				.setTextAlign(TextAlign.Right)
				.setFill(true),
			new Label(() => `${this.linesCleared} / ${this.GOAL_LINES}`)
				.withStyle(activeTheme.typography.title)
				.setTextAlign(TextAlign.Right)
				.setFill(true),
		];
	}

	protected getResultLabel(): string { return `final time: ${this.timer.format()}`; }

	protected onReset(): void {}

	protected onLineClear(_: number): void {
		if (this.linesCleared >= this.GOAL_LINES) this.finish(true);
	}
}

