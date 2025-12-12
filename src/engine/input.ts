import { Game } from "../game/game";

export interface ControllerSettings {
	das: number;
	arr: number;
	sdf: number;
}

export const DEFAULT_CONTROLLER_SETTINGS: ControllerSettings = {
	das: 0.13,
	arr: 0.03,
	sdf: 10000,
}

class InputState {
	keys: Record<string, boolean> = {};
	constructor() {
		window.addEventListener("keydown", e => this.keys[e.code] = true);
		window.addEventListener("keyup", e => this.keys[e.code] = false);
	}

	isDown(code: string) { return !!this.keys[code]; }
}

export interface Controller {
	update(dt: number): void
}

export class LocalController implements Controller {
	private game: Game;
	private input: InputState;
	settings: ControllerSettings;

	private dasTimer = 0;
	private arrTimer =  0;
	private lastDir : "ArrowLeft" | "ArrowRight" | null = null;

	private rotatePressed = false;
	private hardDropPressed = false;

	constructor(game: Game, settings: ControllerSettings = DEFAULT_CONTROLLER_SETTINGS) {
		this.game = game;
		this.settings = settings;
		this.input = new InputState();
	}

	update(dt: number): void {
		this.game.softDropFactor = this.input.isDown("ArrowDown") ? this.settings.sdf : 1;
		this.handleMovement(dt);
		this.handleActions();
	}

	private handleMovement(dt: number) {
		const left = this.input.isDown("ArrowLeft");
		const right = this.input.isDown("ArrowRight");

		let dir: "ArrowLeft" | "ArrowRight" | null = null;
		if (left && !right) dir = "ArrowLeft";
		if (!left && right) dir = "ArrowRight";

		if (dir != this.lastDir) {
			this.dasTimer = 0;
			this.arrTimer = 0;
			this.lastDir = dir;
			if (dir) this.game.moveCurrentPiece(dir == "ArrowLeft" ? -1 : 1, 0);
			return;
		}

		if (!dir) return;

		this.dasTimer += dt;
		if (this.dasTimer < this.settings.das) return;
		this.arrTimer += dt;
		const moveVal = dir == "ArrowLeft" ? -1 : 1;
		
		if (this.settings.arr == 0) {
			while (this.game.moveCurrentPiece(moveVal, 0));
		} else {
			while (this.arrTimer >= this.settings.arr) {
				this.game.moveCurrentPiece(moveVal, 0);
				this.arrTimer -= this.settings.arr;
			};
		}
	}

	private handleActions() {
		if (this.input.isDown("ArrowUp")) {
			if (!this.rotatePressed) {
				this.game.rotateCurrentPiece(1);
				this.rotatePressed = true;
			}
		} else this.rotatePressed = false;

		if (this.input.isDown("Space")) {
			if (!this.hardDropPressed) {
				this.game.hardDrop();
				this.hardDropPressed = true;
			}
		} else this.hardDropPressed = false;

		if (this.input.isDown("KeyC")) this.game.swapHold();
		if (this.input.isDown("KeyR")) { this.game.reset(); this.game.start(); };
	}
}
