import { DEFAULT_CONTROLLER_SETTINGS, LocalController } from "../../engine/input";
import { GameTheme } from "../../theme"
import { Recoil, Shaker } from "../../ui/widgets/effects";
import { DangerLevel } from "../danger";
import { DEFAULT_GAME_SETTINGS, Game } from "../game"
import { GameContext, GameMode } from "../modes"

export class MultiplayerMode implements GameMode {
	private localGame: Game;
	private localController: LocalController;

	private remoteGame: Game;
	private remoteController;

	private countdown = 3;
	private countdownTimer = this.countdown;

	private shaker: Shaker;
	private recoil: Recoil;
	private dangerLevel: DangerLevel;

	constructor() {
		this.localGame = new Game(DEFAULT_GAME_SETTINGS);
		this.localController = new LocalController(this.localGame, DEFAULT_CONTROLLER_SETTINGS);

		this.remoteGame = new Game(DEFAULT_GAME_SETTINGS);
		this.remoteController = new RemoteController(this.remoteGame);
	}

	onEnter(ctx: GameContext): void {
	    
	}

	onExit(): void {
	    
	}

	update(dt: number): void {
	    
	}

	draw(ctx: CanvasRenderingContext2D, theme: GameTheme): void {
	    
	}
}
