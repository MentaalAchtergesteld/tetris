export interface GameSettings {
	blockSize: number;
	gravity: number;
	boardWidth: number;
	boardHeight: number;
	lockDelay: number;
}

export interface ControllerSettings {
	das: number;
	arr: number;
	sdf: number;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
	blockSize: 32,
	gravity: 1,
	boardWidth: 10,
	boardHeight: 20,
	lockDelay: .5,
}

export const DEFAULT_CONTROLLER_SETTINGS: ControllerSettings = {
	das: 0.120,
	arr: 0.03,
	sdf: 1000,
}
