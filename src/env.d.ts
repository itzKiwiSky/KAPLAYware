import type { Microgame } from "./types/Microgame.ts";

declare global {
	interface Window {
		/** Wheter we're running a singular game to record its inputs */
		DEV_RECORDINPUT: boolean;
		DEV_DIFFICULTY: 1 | 2 | 3;
		DEV_SPEED: number;
		DEV_MICROGAME: string;
		/** All the micro-games loaded inside KAPLAYWare/ */
		microgames: Microgame[];
	}
}
