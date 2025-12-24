import { AudioManager, EffectsManager } from "../engine/audio";
import { GameTheme } from "../theme";

export interface GameContext {
	theme: GameTheme,
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
	draw(ctx: CanvasRenderingContext2D): void;
}
