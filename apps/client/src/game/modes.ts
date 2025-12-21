import { GameTheme } from "../theme";
import { AudioManager, EffectsManager } from "../engine/audio";

export interface GameContext {
	effects: EffectsManager,
	audio: AudioManager;
	shakeDecay: number;
	shakeIntensityMultiplier: number;
	recoilTension: number;
	recoilDamping: number;
	recoilMass: number;
}

export interface GameMode {
	onEnter(ctx: GameContext): void;
	onExit(): void;

	update(dt: number): void;
	draw(ctx: CanvasRenderingContext2D, theme: GameTheme): void;
}
