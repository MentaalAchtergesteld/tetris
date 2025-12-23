import { Game, GameAction, EventEmitter } from "@tetris/core";
import { InputManager } from "./input_manager";

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

export interface ControllerEvents {
	"action": GameAction,
}

export abstract class Controller {
	public events: EventEmitter<ControllerEvents>
	constructor(
		protected game: Game,
	) {
		this.events = new EventEmitter();
	}
	
	protected triggerAction(action: GameAction): boolean {
		this.events.emit("action", action);
		return this.game.handleInput(action);
	}

	abstract update(dt: number): void;
}

export class LocalController extends Controller {
	private dasTimer = 0;
	private arrTimer = 0;
	private lastDirection: GameAction.MoveLeft | GameAction.MoveRight | null = null;

	constructor(
		game: Game,
		private input: InputManager,
		public settings: ControllerSettings = DEFAULT_CONTROLLER_SETTINGS,
	) { super(game); }

	handleDiscreteActions() {
		if (this.input.isJustPressed(GameAction.RotateCW))  this.triggerAction(GameAction.RotateCW);
		if (this.input.isJustPressed(GameAction.RotateCCW)) this.triggerAction(GameAction.RotateCCW);
		if (this.input.isJustPressed(GameAction.HardDrop))  this.triggerAction(GameAction.HardDrop);
		if (this.input.isJustPressed(GameAction.Hold))      this.triggerAction(GameAction.Hold);
	}

	handleMovement(dt: number) {
		const left = this.input.isDown(GameAction.MoveLeft);
		const right = this.input.isDown(GameAction.MoveRight);

		let dir: GameAction.MoveLeft | GameAction.MoveRight | null = null;
		if (left && !right) dir = GameAction.MoveLeft;
		if (!left && right) dir = GameAction.MoveRight;

		if (dir != this.lastDirection) {
			this.dasTimer = 0;
			this.arrTimer = 0;
			this.lastDirection= dir;
			if (dir != null) this.triggerAction(dir);
			return;
		}

		if (dir == null) return;

		this.dasTimer += dt;
		if (this.dasTimer < this.settings.das) return;
		this.arrTimer += dt;
		
		if (this.settings.arr == 0) {
			while (this.triggerAction(dir));
		} else {
			while (this.arrTimer >= this.settings.arr) {
				this.triggerAction(dir);
				this.arrTimer -= this.settings.arr;
			};
		}
	}

	update(dt: number): void {
		this.handleDiscreteActions();
		this.handleMovement(dt);

		if (this.input.isDown(GameAction.SoftDrop)) {
			this.events.emit("action", GameAction.SoftDrop);
			this.game.softDropFactor = this.settings.sdf;
		} else {
			this.game.softDropFactor = 1;
		}
	}
}
