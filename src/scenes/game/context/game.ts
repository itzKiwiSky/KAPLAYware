import { Color, GameObj, KEventController, Key, Tag } from "kaplay";
import { gameAPIs } from "../api";
import { forAllCurrentAndFuture, getGameID, isDefaultAsset, mergeWithRef, overload2, pickKeysInObj } from "../utils";
import { WareApp } from "../app";
import { Kaplayware } from "../kaplayware";
import { InputButton, MinigameAPI, MinigameCtx, StartCtx } from "./types";
import { addConfetti } from "../objects/confetti";
import k from "../../../engine";
import Minigame from "../minigameType";

/** Create the basic context, is a modified kaplay context
 * @param game Needs game for things like sprite() and play()
 * @param wareApp Needs wareApp to access hierarchy and props
 */
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
			src = typeof src == "string" ? (src.startsWith("@") ? src : `${getGameID(game)}-${src}`) : src;
			const sound = wareApp.play(src, options);
			return sound;
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
		get(tag, opts) {
			return wareApp.sceneObj.get(tag, opts);
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
		// timer controllers
		tween(from, to, duration, setValue, easeFunc) {
			const ev = wareApp.sceneObj.tween(from, to, duration, setValue, easeFunc);
			wareApp.timerEvents.push(ev);
			return ev;
		},
		wait(n, action) {
			const ev = wareApp.sceneObj.wait(n, action);
			wareApp.timerEvents.push(ev);
			return ev;
		},
		loop(t, action, maxLoops, waitFirst) {
			const ev = wareApp.sceneObj.loop(t, action, maxLoops, waitFirst);
			wareApp.timerEvents.push(ev);
			return ev;
		},
		// general event controllers
		onCollide(t1, t2, action) {
			const ev = k.onCollide(t1, t2, action);
			wareApp.updateEvents.push(ev);
			return ev;
		},
		onCollideUpdate(t1, t2, action) {
			const ev = k.onCollideUpdate(t1, t2, action);
			wareApp.updateEvents.push(ev);
			return ev;
		},
		onCollideEnd(t1, t2, action) {
			const ev = k.onCollideEnd(t1, t2, action);
			wareApp.updateEvents.push(ev);
			return ev;
		},
	};

	startCtx["onUpdate"] = overload2((action: () => void): KEventController => {
		const obj = wareApp.sceneObj.add([{ update: action }]);
		const ev: KEventController = {
			get paused() {
				return obj.paused;
			},
			set paused(p) {
				obj.paused = p;
			},
			cancel: () => obj.destroy(),
		};
		wareApp.updateEvents.push(ev);
		return ev;
	}, (tag: Tag, action: (obj: GameObj) => void) => {
		const ev = k.on("update", tag, action);
		wareApp.updateEvents.push(ev);
		return ev;
	});

	startCtx["onDraw"] = overload2((action: () => void): KEventController => {
		const obj = wareApp.sceneObj.add([{ draw: action }]);
		const ev: KEventController = {
			get paused() {
				return obj.hidden;
			},
			set paused(p) {
				obj.hidden = p;
			},
			cancel: () => obj.destroy(),
		};
		wareApp.drawEvents.push(ev);
		return ev;
	}, (tag: Tag, action: (obj: GameObj) => void) => {
		const ev = k.on("draw", tag, action);
		wareApp.drawEvents.push(ev);
		return ev;
	});

	// another overload
	startCtx["onClick"] = overload2((action: () => void) => {
		const ev = wareApp.sceneObj.onMousePress(action);
		wareApp.inputEvents.push(ev);
		return ev;
	}, (tag: Tag, action: (obj: GameObj) => void) => {
		const events: KEventController[] = [];
		let paused: boolean = false;

		forAllCurrentAndFuture(tag, (obj) => {
			if (!obj.area) {
				throw new Error(
					"onClick() requires the object to have area() component",
				);
			}
			events.push(obj.onClick(() => action(obj)));
		});
		const ev: KEventController = {
			get paused() {
				return paused;
			},
			set paused(val: boolean) {
				paused = val;
			},
			cancel() {
				events.forEach((ev) => ev.cancel());
			},
		};
		return ev;
	});

	return startCtx;
}

/** Create the minigame API, minigame exclusive functions
 * @param wareApp Needs wareApp to access the object hierarchy
 * @param wareEngine Is optional for "preview" mode, if not wareEngine will skip win() lose() and finish() calls
 */
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
			const r = wareApp.boxObj.add([
				k.pos(k.center()),
				k.rect(k.width() * 2, k.height() * 2),
				k.color(flashColor),
				k.anchor("center"),
				k.opacity(opacity),
				k.fixed(),
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
			if (wareApp.inputPaused) return false;
			if (btn == "click") return k.isMousePressed("left");
			else return k.isKeyPressed(dirToKeys(btn));
		},
		isInputButtonDown: (btn) => {
			if (wareApp.inputPaused) return false;
			if (btn == "click") return k.isMouseDown("left");
			else return k.isKeyDown(dirToKeys(btn));
		},
		isInputButtonReleased: (btn) => {
			if (wareApp.inputPaused) return false;
			if (btn == "click") return k.isMouseReleased("left");
			else return k.isKeyDown(dirToKeys(btn));
		},
		// TODO: Make this in a way that nothing happens if runs on wareEngine
		onTimeout: (action) => {
			return wareEngine.onTimeOutEvents.add(action);
		},
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
		addConfetti(opts) {
			const confetti = addConfetti(opts);
			confetti.parent = wareApp.sceneObj;
			return confetti;
		},
		get winState() {
			return wareEngine.winState ?? undefined;
		},
		get difficulty() {
			return wareEngine.difficulty ?? 1;
		},
		get lives() {
			return wareEngine.lives ?? 3;
		},
		get speed() {
			return wareEngine.speed ?? 1;
		},
		get timeLeft() {
			return wareEngine.timeLeft ?? 20;
		},
		// TODO: figure out these, probably do wareEngine.curDuration and curPrompt (shitty)
		// might just remove idk not really necessary
		get duration() {
			return 1;
		},
		get prompt() {
			return "";
		},
	};
}

/** Creates the final, merged and usable context for a minigame
 * @param game The minigame to create the context for
 * @param wareApp The ware-app
 * @param wareEngine The ware engine, is optional for "preview" mode
 */
export function createGameCtx(game: Minigame, wareApp: WareApp, wareEngine?: Kaplayware): MinigameCtx {
	const startCtx = createStartCtx(game, wareApp);
	const api = createMinigameAPI(wareApp, wareEngine);
	return mergeWithRef(startCtx, api);
}
