import { Color, GameObj, KEventController, Tag } from "kaplay";
import { gameAPIs } from "../api";
import { forAllCurrentAndFuture, getGameID, isDefaultAsset, mergeWithRef, overload2, pickKeysInObj } from "../utils";
import { WareApp } from "../app";
import { MicrogameAPI, MicrogameCtx, StartCtx } from "./types";
import { addConfetti } from "../objects/confetti";
import k from "../../../engine";
import { WareEngine } from "../ware";

// TODO: This context folder is pissing me off... I am the original       amyspark-ng

/** Create the basic context, is a modified kaplay context
 * @param ware Needs ware to acess current game to get assets and such
 * @param app Needs wareApp to access hierarchy and props
 */
export function createGameCtx(ware: WareEngine, wareApp: WareApp): MicrogameCtx {
	const pickedCtx = pickKeysInObj(k, [...gameAPIs]);

	const startCtx: StartCtx = {
		...pickedCtx,
		add: (comps) => wareApp.sceneObj.add(comps),
		sprite(spr, opt) {
			const hasAt = (t: any) => typeof t == "string" && t.startsWith("@");
			const getSpriteName = (t: any) => hasAt(t) ? t : `${getGameID(ware.microgame)}-${t}`;
			const spriteComp = k.sprite(getSpriteName(spr), opt);

			return mergeWithRef(spriteComp, {
				set sprite(val: string) {
					spriteComp.sprite = getSpriteName(val);
				},

				get sprite() {
					if (spriteComp.sprite.startsWith(getGameID(ware.microgame))) return spriteComp.sprite.replace(`${getGameID(ware.microgame)}-`, "");
					else return spriteComp.sprite;
				},
			});
		},
		play(src, options) {
			// if sound name is string, check for @, else just send it
			src = typeof src == "string" ? (src.startsWith("@") ? src : `${getGameID(ware.microgame)}-${src}`) : src;
			return wareApp.sounds.play(src, options);
		},
		area(opt) {
			return {
				...k.area(opt),
				onClick(f, btn) {
					return wareApp.inputs.obj.onMousePress("left", () => {
						if (this.isHovering()) f();
					});
				},
			};
		},
		addLevel(map, opt) {
			const level = k.addLevel(map, opt);
			level.parent = wareApp.sceneObj;
			return level;
		},
		burp(options) {
			return startCtx["play"](k._k.game.defaultAssets.burp, options);
		},
		drawSprite(opt) {
			if (!isDefaultAsset(opt.sprite)) opt.sprite = `${getGameID(ware.microgame)}-${opt.sprite}`;
			return k.drawSprite(opt);
		},
		getSprite(name) {
			return k.getSprite(`${getGameID(ware.microgame)}-${name}`);
		},
		getSound(name) {
			return k.getSound(`${getGameID(ware.microgame)}-${name}`);
		},
		shader(id, uniform) {
			return k.shader(`${getGameID(ware.microgame)}-${id}`, uniform);
		},
		get(tag, opts) {
			return wareApp.sceneObj.get(tag, opts);
		},
		query(opt) {
			return wareApp.sceneObj.query(opt);
		},
		fixed() {
			let fixed = true;

			return {
				id: "fixed",
				add() {
					this.parent = wareApp.maskObj;
				},
				serialize() {
					return { fixed: fixed };
				},
				set fixed(val: boolean) {
					fixed = val;
					if (fixed == true) this.parent = wareApp.maskObj;
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
					return wareApp.timers.add(k.tween(
						this.opacity,
						0,
						time,
						(a) => this.opacity = a,
						easeFunc,
					));
				},
				fadeIn(time: number, easeFunc = k.easings.linear) {
					return wareApp.timers.add(k.tween(
						0,
						this.opacity,
						time,
						(a) => this.opacity = a,
						easeFunc,
					));
				},
			};
		},
		onMouseMove(action) {
			// TODO: figure out important stuff like
			// should ctx.width() return width of gamebox?
			// what about mousepos?
			// stuff like that
			return wareApp.inputs.obj.onMouseMove(action);
		},
		onButtonPress(btn, action) {
			return wareApp.inputs.obj.onButtonPress(btn, action);
		},
		// timer controllers
		tween(from, to, duration, setValue, easeFunc) {
			return wareApp.timers.add(k.tween(from, to, duration, setValue, easeFunc));
		},
		wait(n, action) {
			return wareApp.timers.add(k.wait(n, action));
		},
		loop(t, action, maxLoops, waitFirst) {
			return wareApp.timers.add(k.loop(t, action, maxLoops, waitFirst));
		},
		// general event controllers
		onCollide(t1, t2, action) {
			return wareApp.events.add(k.onCollide(t1, t2, action));
		},
		onCollideUpdate(t1, t2, action) {
			return wareApp.events.add(k.onCollideUpdate(t1, t2, action));
		},
		onCollideEnd(t1, t2, action) {
			return wareApp.events.add(k.onCollideEnd(t1, t2, action));
		},
		trigger(event, tag, ...args) {
			wareApp.sceneObj.get(tag).forEach((child) => {
				if (child.is(tag)) child.trigger(event, ...args);
			});
		},
		on(event, tag, action) {
			let paused = false;
			const events: KEventController[] = [];
			wareApp.sceneObj.get(tag).forEach((children) => {
				const ev = children.on(event, action);
				events.push(ev);
			});
			return {
				get paused() {
					return paused;
				},
				set paused(val: boolean) {
					paused = val;
					events.forEach((ev) => ev.paused = val);
				},
				cancel() {
					events.forEach((ev) => ev.cancel());
				},
			};
		},
		addKaboom(pos, opt) {
			const ka = k.addKaboom(pos, opt);
			ka.parent = wareApp.sceneObj;
			return ka;
		},
		time() {
			return wareApp.time;
		},
		timer(maxLoopsPerFrame) {
			const fakeTimer = wareApp.sceneObj.add([k.timer(maxLoopsPerFrame), "fakeTimer"]);

			return {
				loop: fakeTimer.loop,
				tween: fakeTimer.tween,
				wait: fakeTimer.wait,
				get maxLoopsPerFrame() {
					return fakeTimer.maxLoopsPerFrame;
				},
				set maxLoopsPerFrame(val) {
					fakeTimer.maxLoopsPerFrame = val;
				},
			};
		},

		mousePos() {
			if (k.kaplaywared.ignoreWareInputEvents) return k.center();
			return k.mousePos();
		},

		isButtonPressed(btn) {
			if (wareApp.inputs.paused) return false;
			if (k.kaplaywared.ignoreWareInputEvents) return false;
			else return k.isButtonPressed(btn);
		},

		isButtonDown(btn) {
			if (wareApp.inputs.paused) return false;
			if (k.kaplaywared.ignoreWareInputEvents) return false;
			else return k.isButtonDown(btn);
		},

		isButtonReleased(btn) {
			if (wareApp.inputs.paused) return false;
			if (k.kaplaywared.ignoreWareInputEvents) return false;
			else return k.isButtonReleased(btn);
		},

		getTreeRoot() {
			return wareApp.sceneObj;
		},

		// camera stuff
		getCamRot: () => wareApp.cameraObj.angle,
		setCamRot: (val: number) => wareApp.cameraObj.angle = val,
		getCamPos: () => wareApp.cameraObj.pos,
		setCamPos: (val) => wareApp.cameraObj.pos = val,
		getCamScale: () => wareApp.cameraObj.scale,
		setCamScale: (val) => wareApp.cameraObj.scale = val,
		shake: (val: number = 12) => wareApp.cameraObj.shake += val,

		onButtonDown: overload2((action: (btn: any) => void) => {
			return wareApp.inputs.obj.onButtonDown(action);
		}, (btn: any, action: (btn: any) => void) => {
			return wareApp.inputs.obj.onButtonDown(btn, action);
		}),

		onButtonRelease: overload2((action: (btn: any) => void) => {
			return wareApp.inputs.obj.onButtonRelease(action);
		}, (btn: any, action: (btn: any) => void) => {
			return wareApp.inputs.obj.onButtonRelease(btn, action);
		}),

		onUpdate: overload2((action: () => void): KEventController => {
			const obj = k.add([{ update: action }]);
			const ev: KEventController = {
				get paused() {
					return obj.paused;
				},
				set paused(p) {
					obj.paused = p;
				},
				cancel: () => obj.destroy(),
			};
			wareApp.events.add(ev);
			return ev;
		}, (tag: Tag, action: (obj: GameObj) => void) => {
			return wareApp.events.add(k.on("update", tag, action));
		}),
		onDraw: overload2((action: () => void): KEventController => {
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
			return wareApp.draws.add(ev);
		}, (tag: Tag, action: (obj: GameObj) => void) => {
			let paused = false;
			const evs: KEventController[] = [];
			const listener = forAllCurrentAndFuture(wareApp.sceneObj, tag, (obj) => {
				const drawEv = obj.on("draw", () => action(obj));
				evs.push(drawEv);
			});

			const ev: KEventController = {
				get paused() {
					return paused;
				},
				set paused(val: boolean) {
					paused = val;
					listener.paused = paused;
				},
				cancel() {
					listener.cancel();
					evs.forEach((ev) => ev.cancel());
				},
			};

			return wareApp.draws.add(ev);
		}),
		onClick: overload2((action: () => void) => {
			return wareApp.inputs.obj.onMousePress(action);
		}, (tag: Tag, action: (obj: GameObj) => void) => {
			const events: KEventController[] = [];
			let paused: boolean = false;

			const listener = forAllCurrentAndFuture(wareApp.sceneObj, tag, (obj) => {
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
					listener.paused = paused;
				},
				cancel() {
					events.forEach((ev) => ev.cancel());
					listener.cancel();
				},
			};

			wareApp.inputs.obj._inputEvents.push(ev);
			return ev;
		}),
	};

	const microgameAPI: MicrogameAPI = {
		getRGB: () => wareApp.backgroundColor,
		setRGB: (val) => wareApp.backgroundColor = val,
		onTimeout: (action) => ware.onTimeOutEvents.add(action),
		win: () => wareApp.rootObj.trigger("win"),
		lose: () => wareApp.rootObj.trigger("lose"),
		finish: () => wareApp.rootObj.trigger("finish"),
		addConfetti(opts) {
			const confetti = addConfetti(opts);
			confetti.parent = wareApp.sceneObj;
			return confetti;
		},
		get winState() {
			return ware.winState ?? undefined;
		},
		get difficulty() {
			return ware.difficulty ?? 1;
		},
		get lives() {
			return ware.lives ?? 3;
		},
		get speed() {
			return ware.speed ?? 1;
		},
		get timeLeft() {
			return ware.timeLeft ?? 20;
		},
		get duration() {
			return ware.curDuration ?? 20;
		},
		get prompt() {
			return ware.curPrompt ?? "";
		},
	};

	return mergeWithRef(startCtx, microgameAPI);
}
