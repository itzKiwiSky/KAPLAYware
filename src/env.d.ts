import type { Microgame } from "./types/Microgame.ts";

declare global {
	interface Window {
		DEV_DIFFICULTY: 1 | 2 | 3;
		DEV_SPEED: number;
		DEV_MICROGAME: string;
		/** All the micro-games loaded inside KAPLAYWare/ */
		microgames: Microgame[];
	}
}
