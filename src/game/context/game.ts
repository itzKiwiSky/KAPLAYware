import { Color, KEventController, Key } from "kaplay";
import k from "../../engine";
import { gameAPIs, generalEventControllers, timerControllers } from "../api";
import { Minigame } from "../types";
import { getGameID, isDefaultAsset, pickKeysInObj } from "../utils";
import { WareApp } from "../app";
import { Kaplayware } from "../kaplayware";
import { InputButton, MinigameAPI, MinigameCtx, StartCtx } from "./types";
import { addConfetti } from "../objects/confetti";

export function createStartCtx(game: Minigame, wareApp: WareApp): StartCtx {
	const pickedCtx = pickKeysInObj(k, [...gameAPIs]);

	const startCtx: StartCtx = {
		...pickedCtx,
		add: (comps) => wareApp.sceneObj.add(comps),
		sprite(spr, opt) {
			const hasAt = (t: any) => typeof t == "string" && t.startsWith("@");
			const getSpriteThing = (t: any) => hasAt(t) ? t : `${getGameID(game)}-${t}`;
			const spriteComp = k.sprite(getSpriteThing(spr), opt);

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
		play(src, options) {
			// if sound name is string, check for @, else just send it
			const sound = k.play(typeof src == "string" ? (src.startsWith("@") ? src : `${getGameID(game)}-${src}`) : src, options);

			const newSound = {
				...sound,
				set paused(param: boolean) {
					if (wareApp.soundsEnabled) {
						sound.paused = param;
						return;
					}

					// ALL OF THIS HAPPENS IF YOU CAN'T PLAY SOUNDS (queue stuff)
					sound.paused = true;

					// TODO: Figure out this
					// // this means that it was queued to play but the user paused it
					// if (wareApp.queuedSounds.includes(sound) && param == true) {
					// 	wareApp.queuedSounds.splice(wareApp.queuedSounds.indexOf(sound), 1);
					// }

					// // this means the user removed it from queue but wants to add it again probably
					// if (!wareApp.queuedSounds.includes(sound) && param == false) {
					// 	wareApp.queuedSounds.push(sound);
					// }
				},
				get paused() {
					return sound.paused;
				},
			};

			// if can't play sounds and the user intended to play it at start, pause it
			if (!wareApp.soundsEnabled) {
				if (!sound.paused) {
					// wareApp.queuedSounds.push(sound);
					sound.paused = true;
				}
			}

			wareApp.sounds.push(newSound);
			return newSound;
		},
		area(opt) {
			return {
				...k.area(opt),
				onClick(f, btn) {
					const ev = k.onMousePress("left", () => {
						if (this.isHovering()) f();
					});
					wareApp.inputEvents.push(ev);
					return ev;
				},
			};
		},
		addLevel(map, opt) {
			const level = k.addLevel(map, opt);
			level.parent = wareApp.sceneObj;
			return level;
		},
		burp(options) {
			return startCtx["play"](k._k.audio.burpSnd, options);
		},
		drawSprite(opt) {
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
				fadeOut(time: number, easeFunc = k.easings.linear) {
					return wareApp.pauseCtx.tween(
						this.opacity,
						0,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
				fadeIn(time: number, easeFunc = k.easings.linear) {
					return wareApp.pauseCtx.tween(
						this.opacity,
						0,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
			};
		},
		onMouseMove(action) {
			const ev = k.onMouseMove(action);
			wareApp.inputEvents.push(ev);
			return ev;
		},
	};

	// TODO: figure out the overload issue
	startCtx["onDraw"] = (...args: any[]) => {
		const ev = wareApp.sceneObj.on("draw", ...args as [any]);
		wareApp.drawEvents.push(ev);
		return ev;
	};

	generalEventControllers.forEach((api) => {
		startCtx[api] = (...args: any[]) => {
			// @ts-ignore
			const ev = wareApp.sceneObj[api](...args);
			wareApp.updateEvents.push(ev);
			return ev;
		};
	});

	timerControllers.forEach((api) => {
		startCtx[api] = (...args: any[]) => {
			// @ts-ignore
			const ev = k[api](...args);
			wareApp.timerEvents.push(ev);
			return ev;
		};
	});

	return startCtx;
}

export function createMinigameAPI(wareApp: WareApp, wareEngine?: Kaplayware): MinigameAPI {
	function dirToKeys(button: InputButton): Key[] {
		if (button == "left") return ["left", "a"];
		else if (button == "down") return ["down", "s"];
		else if (button == "up") return ["up", "w"];
		else if (button == "right") return ["right", "d"];
		else if (button == "action") return ["space"];
	}

	return {
		getCamAngle: () => wareApp.cameraObj.angle,
		setCamAngle: (val: number) => wareApp.cameraObj.angle = val,
		getCamPos: () => wareApp.cameraObj.pos,
		setCamPos: (val) => wareApp.cameraObj.pos = val,
		getCamScale: () => wareApp.cameraObj.scale,
		setCamScale: (val) => wareApp.cameraObj.scale = val,
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
		getRGB: () => wareApp.backgroundColor,
		setRGB: (val) => wareApp.backgroundColor = val,

		onInputButtonPress: (btn, action) => {
			let ev: KEventController = null;
			if (btn == "click") ev = k.onMousePress("left", action);
			else ev = k.onKeyPress(dirToKeys(btn), action);
			wareApp.inputEvents.push(ev);
			return ev;
		},
		onInputButtonDown: (btn, action) => {
			let ev: KEventController = null;
			if (btn == "click") ev = k.onMouseDown("left", action);
			else ev = k.onKeyDown(dirToKeys(btn), action);
			wareApp.inputEvents.push(ev);
			return ev;
		},
		onInputButtonRelease: (btn, action) => {
			let ev: KEventController = null;
			if (btn == "click") ev = k.onMouseRelease("left", action);
			else ev = k.onKeyRelease(dirToKeys(btn), action);
			wareApp.inputEvents.push(ev);
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
		// TODO: Make this in a way that nothing happens if runs on wareEngine
		onTimeout: (action) => wareEngine.onTimeOutEvents.add(action),
		win() {
			if (!wareEngine) return;
			wareEngine.winGame();
		},
		lose() {
			if (!wareEngine) return;
			wareEngine.loseGame();
		},
		finish() {
			if (!wareEngine) return;
			wareEngine.finishGame();
		},
		winState: () => {
			if (!wareEngine) return;
			return wareEngine.winState;
		},
		addConfetti(opts) {
			const confetti = addConfetti(opts);
			confetti.parent = wareApp.sceneObj;
			return confetti;
		},
		get difficulty() {
			return wareEngine.difficulty ?? 1;
		},
		get lives() {
			return wareEngine.lives ?? 3;
		},
		get speed() {
			return wareEngine.lives ?? 1;
		},
		get timeLeft() {
			return wareEngine.timeLeft ?? 10;
		},
	};
}

export function createGameCtx(game: Minigame, wareApp: WareApp, wareEngine?: Kaplayware): MinigameCtx {
	return { ...createStartCtx(game, wareApp), ...createMinigameAPI(wareApp, wareEngine) };
}
