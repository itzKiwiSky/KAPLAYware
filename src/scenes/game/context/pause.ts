import { AudioPlay, TimerController } from "kaplay";
import { pauseAPIs } from "../api";
import k from "../../../engine";

/** The functions that can be paused with WareApp.gamePaused */
export type PauseCtx = Pick<typeof k, typeof pauseAPIs[number]> & {
	sounds: AudioPlay[];
	timers: TimerController[];
	resetContext(): void;
};

/** Creates a small context that includes tween, wait, loop and play, these will be paused if the WareApp is paused */
export function createPauseCtx() {
	const ctx = {
		sounds: [],
		timers: [],
		resetContext() {
			for (let i = this.timers.length - 1; i >= 0; i--) {
				this.timers[i].cancel();
				this.timers.pop();
			}

			for (let i = this.sounds.length - 1; i >= 0; i--) {
				this.sounds[i].stop();
				this.sounds.pop();
			}
		},
	} as PauseCtx;

	for (const api of pauseAPIs) {
		if (api == "play") {
			ctx[api] = (src, opts) => {
				const sound = k.play(src, opts);
				ctx.sounds.push(sound);
				sound.onEnd(() => {
					ctx.sounds.splice(ctx.sounds.indexOf(sound), 1);
				});
				return sound;
			};
		}
		else {
			ctx[api] = (...args: any[]) => {
				// @ts-ignore
				const timer = k[api](...args as unknown as [any]);
				ctx.timers.push(timer);
				// timer.onEnd(() => ctx.timers.splice(ctx.timers.indexOf(timer), 1));
				return timer as any;
			};
		}
	}

	return ctx;
}
