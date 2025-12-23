import { GameAction } from "@tetris/core";

export const DEFAULT_KEYBINDS: Record<GameAction, string[]> = {
	[GameAction.MoveLeft]:  ["ArrowLeft"],
	[GameAction.MoveRight]: ["ArrowRight"],
	[GameAction.SoftDrop]:  ["ArrowDown"],
	[GameAction.HardDrop]:  ["Space"],
	[GameAction.RotateCW]:  ["ArrowUp", "KeyX"],
	[GameAction.RotateCCW]: ["ControlLeft", "KeyZ"],
	[GameAction.Hold]:      ["KeyC", "ShiftLeft"],
	[GameAction.Reset]:     ["KeyR"],
}

export class InputManager {
	private liveKeyState: Record<string, boolean> = {};
	private currentKeyState: Record<string, boolean> = {};
	private prevKeyState: Record<string, boolean> = {};

	constructor(private bindings: Record<GameAction, string[]> = DEFAULT_KEYBINDS) {
		window.addEventListener("keydown", e => this.liveKeyState[e.code] = true);
		window.addEventListener("keyup",   e => this.liveKeyState[e.code] = false);
	}

	public update() {
		this.prevKeyState = { ...this.currentKeyState};
		this.currentKeyState = { ...this.liveKeyState };
	}

	public isDown(action: GameAction): boolean {
		const keys = this.bindings[action];
		return keys.some(k => this.currentKeyState[k]);
	}

	public isJustPressed(action: GameAction): boolean {
		const keys = this.bindings[action];
		return keys.some(k => this.currentKeyState[k] && !this.prevKeyState[k]);
	}

	public setBinding(action: GameAction, keys: string[]) {
		this.bindings[action] = keys;
	}
}
