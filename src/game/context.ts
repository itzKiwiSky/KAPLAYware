import {
	Asset,
	AudioPlay,
	Color,
	CompList,
	EaseFunc,
	GameObj,
	KAPLAYCtx,
	KEventController,
	Key,
	SpriteAtlasData,
	SpriteComp,
	SpriteCompOpt,
	SpriteData,
	TimerController,
	Uniform,
	Vec2,
} from "kaplay";
import k from "../engine";
import { InputButton, Minigame, MinigameAPI } from "./types";
import { getGameID, isDefaultAsset, pickKeysInObj } from "./utils";
import { gameAPIs, generalEventControllers, loadAPIs, pauseAPIs, timerControllers } from "./api";
import { WareApp } from "./kaplayware";
import { assets } from "@kaplayjs/crew";

/** The allowed load functions */
export type LoadCtx = Pick<KAPLAYCtx, typeof loadAPIs[number]>;

/** Creates the context exclusive for loading the assets of a minigame */
export function createLoadCtx(game: Minigame) {
	// load game assets
	const loadCtx = {};

	for (const api of loadAPIs) {
		loadCtx[api] = k[api];
	}

	// patch loadXXX() functions to scoped asset names
	const loaders = [
		"loadSprite",
		"loadSpriteAtlas",
		"loadAseprite",
		"loadPedit",
		"loadJSON",
		"loadSound",
		"loadFont",
		"loadBitmapFont",
		"loadShader",
		"loadShaderURL",
	];

	for (const loader of loaders) {
		loadCtx[loader] = (name: string, ...args: any) => {
			if (typeof name === "string") {
				name = `${getGameID(game)}-${name}`;
			}
			return k[loader](name, ...args);
		};

		if (loader == "loadSpriteAtlas") {
			loadCtx[loader] = (path: string, data: SpriteAtlasData) => {
				Object.keys(data).forEach((key) => {
					delete Object.assign(data, { [`${getGameID(game)}-${key}`]: data[key] })[key]; // renames the keys
				});
				return k.loadSpriteAtlas(path, data);
			};
		}
	}

	// patch loadRoot() to consider g.urlPrefix
	if (game.urlPrefix != undefined) {
		loadCtx["loadRoot"] = (p: string) => {
			if (p) k.loadRoot(game.urlPrefix + p);
			return k.loadRoot().slice(game.urlPrefix.length);
		};
		k.loadRoot(game.urlPrefix);
	}
	else {
		k.loadRoot("");
	}

	return loadCtx as LoadCtx;
}

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

// TODO: could move a lot of game context to a different file

type Friend = keyof typeof assets | `${keyof typeof assets}-o`;
type AtFriend = `@${Friend}`;
type CustomSprite<T extends string> = T extends AtFriend | string & {} ? AtFriend | string & {} : string;

/**
 * A modified {@link sprite `sprite()`} component to fit KAPLAYware.
 *
 * @group Component Types
 */
interface WareSpriteComp extends Omit<SpriteComp, "sprite"> {
	/**
	 * Name of the sprite.
	 */
	sprite: CustomSprite<string>;
}

export type StartCtx = Pick<typeof k, typeof gameAPIs[number]> & {
	/** ### Modified add() for KAPLAYware */
	add<T>(comps?: CompList<T> | GameObj<T>): GameObj<T>;

	/** ### Custom sprite component for KAPLAYware that holds default assets
	 *
	 * Attach and render a sprite to a Game Object.
	 *
	 * @param spr - The sprite to render.
	 * @param opt - Options for the sprite component. See {@link SpriteCompOpt `SpriteCompOpt`}.
	 *
	 * @example
	 * ```js
	 * // minimal setup
	 * add([
	 *     sprite("bean"),
	 * ])
	 *
	 * // with options
	 * const bean = add([
	 *     sprite("bean", {
	 *         // start with animation "idle"
	 *         anim: "idle",
	 *     }),
	 * ])
	 *
	 * // play / stop an anim
	 * bean.play("jump")
	 * bean.stop()
	 *
	 * // manually setting a frame
	 * bean.frame = 3
	 * ```
	 *
	 * @returns The sprite comp.
	 * @since v2000.0
	 * @group Components
	 */
	sprite(spr: CustomSprite<string> | SpriteData | Asset<SpriteData>, opt?: SpriteCompOpt): WareSpriteComp;
};

/** The context for the allowed functions in a minigame */
export type MinigameCtx = StartCtx & MinigameAPI;

/** Creates the context minigames use to add objects and buncha other stuff */
export function createGameCtx(wareApp: WareApp, game: Minigame) {
	function dirToKeys(button: InputButton): Key[] {
		if (button == "left") return ["left", "a"];
		else if (button == "down") return ["down", "s"];
		else if (button == "up") return ["up", "w"];
		else if (button == "right") return ["right", "d"];
		else if (button == "action") return ["space"];
	}

	const pickedCtx = pickKeysInObj(k, [...gameAPIs]);

	const gameCtx: MinigameCtx = {
		...pickedCtx,
		// MinigameCtx
		add: (...args) => wareApp.sceneObj.add(...args),
		onUpdate: (...args: any) => wareApp.addGeneralEvent(k.onUpdate(...args as unknown as [any])),
		onDraw: (...args: any) => wareApp.addDrawEvent(k.onDraw(...args as unknown as [any])),
		get: (...args: any) => wareApp.sceneObj.get(...args as unknown as [any]),
		onClick: (...args: any) => wareApp.addInput(k.onClick(...args as unknown as [any])),
		area(opt) {
			return {
				...k.area(opt),
				onClick(f, btn) {
					return wareApp.addInput(k.onMousePress("left", () => {
						if (this.isHovering()) f();
					}));
				},
				// onClick: (action: () => void) => wareApp.addInput(k.onMousePress("left", () => this.isHovering() ? action() : false)),
			};
		},
		addLevel(map, opt) {
			const level = k.addLevel(map, opt);
			level.parent = wareApp.sceneObj;
			return level;
		},
		play(src, options) {
			// if sound name is string, check for @, else just send it
			const sound = k.play(typeof src == "string" ? (src.startsWith("@") ? src : `${getGameID(game)}-${src}`) : src, options);

			const newSound = {
				...sound,
				set paused(param: boolean) {
					if (wareApp.canPlaySounds) {
						sound.paused = param;
						return;
					}

					// ALL OF THIS HAPPENS IF YOU CAN'T PLAY SOUNDS (queue stuff)
					sound.paused = true;

					// this means that it was queued to play but the user paused it
					if (wareApp.queuedSounds.includes(sound) && param == true) {
						wareApp.queuedSounds.splice(wareApp.queuedSounds.indexOf(sound), 1);
					}

					// this means the user removed it from queue but wants to add it again probably
					if (!wareApp.queuedSounds.includes(sound) && param == false) {
						wareApp.queuedSounds.push(sound);
					}
				},
				get paused() {
					return sound.paused;
				},
			};

			// if can't play sounds and the user intended to play it at start, pause it
			if (!wareApp.canPlaySounds) {
				if (!sound.paused) {
					wareApp.queuedSounds.push(sound);
					sound.paused = true;
				}
			}

			wareApp.addSound(newSound);
			return newSound;
		},
		burp(options) {
			return gameCtx["play"](k._k.audio.burpSnd, options);
		},
		drawSprite: (opt) => {
			if (!isDefaultAsset(opt.sprite)) opt.sprite = `${getGameID(game)}-${opt.sprite}`;
			return k.drawSprite(opt);
		},
		getSprite(name) {
			return k.getSprite(`${getGameID(game)}-${name}`);
		},
		getSound(name) {
			return k.getSound(`${getGameID(game)}-${name}`);
		},
		shader(id, uniform) {
			return k.shader(`${getGameID(game)}-${id}`, uniform);
		},
		fixed() {
			let fixed = true;

			return {
				id: "fixed",
				add() {
					this.parent = wareApp.rootObj;
				},
				set fixed(val: boolean) {
					fixed = val;
					if (fixed == true) this.parent = wareApp.rootObj;
					else this.parent = wareApp.sceneObj;
				},
				get fixed() {
					return fixed;
				},
			};
		},
		opacity(o) {
			const comp = k.opacity(o);
			return {
				...comp,
				fadeOut(time: number, easeFunc: EaseFunc = k.easings.linear) {
					return wareApp.pausableCtx.tween(
						this.opacity,
						0,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
				fadeIn(time: number, easeFunc: EaseFunc = k.easings.linear) {
					return wareApp.pausableCtx.tween(
						this.opacity,
						0,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
			};
		},

		// MinigameAPI
		getCamAngle: () => wareApp.cameraObj.angle,
		setCamAngle: (val: number) => wareApp.cameraObj.angle = val,
		getCamPos: () => wareApp.cameraObj.pos,
		setCamPos: (val: Vec2) => wareApp.cameraObj.pos = val,
		getCamScale: () => wareApp.cameraObj.scale,
		setCamScale: (val: Vec2) => wareApp.cameraObj.scale = val,
		shakeCam: (val: number = 12) => wareApp.cameraObj.shake += val,
		flashCam: (flashColor: Color = k.WHITE, timeOut: number = 1, opacity: number) => {
			const r = wareApp.cameraObj.add([
				k.pos(k.center()),
				k.rect(k.width() * 2, k.height() * 2),
				k.color(flashColor),
				k.anchor("center"),
				k.opacity(opacity),
				k.fixed(),
				k.z(999), // HACK: make sure is at front of everyone :skull: //
				"flash",
			]);
			const f = r.fadeOut(timeOut);
			f.onEnd(() => k.destroy(r));
			return f;
		},
		getRGB: () => wareApp.currentColor,
		setRGB: (val) => wareApp.currentColor = val,

		onInputButtonPress: (btn, action) => {
			let ev: KEventController = null;
			if (btn == "click") ev = k.onMousePress("left", action);
			else ev = k.onKeyPress(dirToKeys(btn), action);
			wareApp.addInput(ev);
			return ev;
		},
		onInputButtonDown: (btn, action) => {
			let ev: KEventController = null;
			if (btn == "click") ev = k.onMouseDown("left", action);
			else ev = k.onKeyDown(dirToKeys(btn), action);
			wareApp.addInput(ev);
			return ev;
		},
		onInputButtonRelease: (btn, action) => {
			let ev: KEventController = null;
			if (btn == "click") ev = k.onMouseRelease("left", action);
			else ev = k.onKeyRelease(dirToKeys(btn), action);
			wareApp.addInput(ev);
			return ev;
		},
		isInputButtonPressed: (btn) => {
			if (btn == "click") return k.isMousePressed("left");
			else return k.isKeyPressed(dirToKeys(btn));
		},
		isInputButtonDown: (btn) => {
			if (btn == "click") return k.isMouseDown("left");
			else return k.isKeyDown(dirToKeys(btn));
		},
		isInputButtonReleased: (btn) => {
			if (btn == "click") return k.isMouseReleased("left");
			else return k.isKeyDown(dirToKeys(btn));
		},
		onMouseMove(action) {
			const ev = k.onMouseMove(action);
			wareApp.inputEvents.push(ev);
			return ev;
		},
		onMouseRelease(action) {
			const ev = k.onMouseRelease(action);
			wareApp.inputEvents.push(ev);
			return ev;
		},
		onTimeout: (action) => wareApp.onTimeOutEvents.add(action),
		win() {
			wareApp.wareCtx.score++;
			wareApp.timeRunning = false;
			wareApp.winState = true;
			wareApp.currentBomb?.turnOff();
		},
		lose() {
			wareApp.wareCtx.lives--;
			wareApp.timeRunning = false;
			wareApp.winState = false;
		},
		finish() {
			if (wareApp.winState == undefined) {
				throw new Error("Finished minigame without setting the win condition!! Please call ctx.win() or ctx.lose() before calling ctx.finish()");
			}
			wareApp.clearSounds();
			wareApp.clearTimers();
			wareApp.clearInput();
			wareApp.clearGeneralEvents();
			wareApp.onTimeOutEvents.clear();
			wareApp.gameRunning = false;
			wareApp.canPlaySounds = false;
			wareApp.currentBomb?.destroy();
			wareApp.sceneObj.clearEvents(); // this clears the time running update, not the onUpdate events of the minigame
			// removes the scene
			k.wait(0.2 / wareApp.wareCtx.speed, () => {
				wareApp.clearDrawEvents(); // clears them after you can't see them anymore
				wareApp.sceneObj.removeAll();
				// removes fixed objects too (they aren't attached to the gamebox)
				wareApp.rootObj.get("fixed").forEach((obj) => obj.destroy());
				// reset camera
				this.setCamPos(k.center());
				this.setCamAngle(0);
				this.setCamScale(k.vec2(1));
				wareApp.cameraObj.get("flash").forEach((f) => f.destroy());
				wareApp.cameraObj.shake = 0;
			});
			wareApp.wareCtx.nextGame();
		},
		sprite: (spr: string | SpriteData | Asset<SpriteData>, opts?: SpriteCompOpt) => {
			const hasAt = (t: any) => typeof t == "string" && t.startsWith("@");
			const getSpriteThing = (t: any) => hasAt(t) ? t : `${getGameID(game)}-${t}`;
			const spriteComp = k.sprite(getSpriteThing(spr), opts);

			return {
				...spriteComp,
				set sprite(val: string) {
					spriteComp.sprite = getSpriteThing(val);
				},

				get sprite() {
					if (spriteComp.sprite.startsWith(getGameID(game))) return spriteComp.sprite.replace(`${getGameID(game)}-`, "");
					else return spriteComp.sprite;
				},
			};
		},
		winState: () => wareApp.winState,
		addConfetti(opts) {
			const confetti = k.addConfetti(opts);
			confetti.parent = wareApp.sceneObj;
			return confetti;
		},
		difficulty: wareApp.wareCtx.difficulty,
		lives: wareApp.wareCtx.lives,
		speed: wareApp.wareCtx.speed,
		timeLeft: wareApp.wareCtx.time,
	};

	generalEventControllers.forEach((api) => {
		// @ts-ignore
		gameCtx[api] = (...args: any[]) => wareApp.addGeneralEvent(k[api](...args));
	});

	timerControllers.forEach((api) => {
		gameCtx[api] = (...args: any[]) => wareApp.addTimer(k[api](...args));
	});

	return gameCtx;
}
