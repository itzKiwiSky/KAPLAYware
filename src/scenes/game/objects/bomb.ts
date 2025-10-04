import { GameObjRaw, InternalGameObjRaw } from "kaplay";
import k from "../../../engine";
import { Conductor, createConductor } from "../../../plugins/conductor";
import { WareApp } from "../app";

/** Add the bomb for the wareEngine
 * @param wareApp The app
 */
export function addBomb(wareApp: WareApp) {
	const BOMB_POS = k.vec2(40, k.height() - 40);
	let beatsLeft = 3;

	const bomb = wareApp.rootObj.add([{
		tick,
		extinguish,
		lit,
		explode,
		conductor: createConductor(140, true),
		get hasExploded() {
			return hasExploded;
		},
		get beatsLeft() {
			return beatsLeft;
		},
	}]);

	Object.defineProperty(bomb, "paused", {
		get() {
			return (bomb as unknown as InternalGameObjRaw)._paused;
		},
		set(v: boolean) {
			(bomb as unknown as InternalGameObjRaw)._paused = v;
			bomb.conductor.paused = v;
		},
	});

	const bombSpr = bomb.add([
		k.sprite("bomb"),
		k.pos(BOMB_POS),
		k.anchor("center"),
		k.scale(),
		k.color(),
		k.z(1),
	]);

	const cordstart = bomb.add([
		k.sprite("bomb-cord-start"),
		k.pos(29, 528),
	]);

	const cord = bomb.add([
		k.sprite("bomb-cord", { tiled: true, width: k.width() / 2 }),
		k.pos(69, 528),
	]);

	const cordtip = cord.add([
		k.sprite("bomb-cord-tip"),
		k.pos(cord.width, 0),
		k.anchor("center"),
		k.opacity(),
	]);
	cordtip.pos.y += cordtip.height / 2;

	const fuse = cordtip.add([
		k.sprite("bomb-fuse"),
		k.pos(0, 22),
		k.anchor("center"),
		k.scale(),
		k.opacity(),
	]);

	function destroy() {
		bomb.destroy();
		bomb.conductor.destroy();
	}

	let movingFuse = false;
	bomb.onUpdate(() => {
		if (beatsLeft < -1) return;

		const width = k.lerp(cord.width, ((k.width() / 2) / 3) * beatsLeft, 0.75);
		cord.width = width;
		cordtip.pos.x = width;

		if (beatsLeft == 0 && !movingFuse) {
			if (cordstart.exists()) cordstart.destroy();
			cordtip.opacity = 0;
			movingFuse = true;
			wareApp.timers.add(k.tween(fuse.pos.y, fuse.pos.y - 30, bomb.conductor.beatInterval, (p) => fuse.pos.y = p));
		}
	});

	let hasExploded = false;
	function explode() {
		if (hasExploded) return;
		destroy();
		const kaboom = k.addKaboom(bombSpr.pos);
		kaboom.parent = wareApp.rootObj;
		wareApp.sounds.play("explosion");
		hasExploded = true;
	}

	function tick() {
		if (!bombSpr.exists()) return;
		if (beatsLeft > 0) {
			beatsLeft--;
			const tweenMult = 2 - beatsLeft + 1; // goes from 1 to 3;
			wareApp.timers.add(k.tween(k.vec2(1).add(0.33 * tweenMult), k.vec2(1).add((0.33 * tweenMult) / 2), 0.5 / 3, (p) => bombSpr.scale = p, k.easings.easeOutQuint));
			wareApp.sounds.play("tick", { detune: 25 * 2 - beatsLeft });
			if (beatsLeft == 2) bombSpr.color = k.YELLOW;
			else if (beatsLeft == 1) bombSpr.color = k.RED.lerp(k.YELLOW, 0.5);
			else if (beatsLeft == 0) bombSpr.color = k.RED;
		}
		else explode();
	}

	/** Will start a conductor which will explode the bomb in 4 beats (tick, tick, tick, BOOM!) */
	function lit(bpm = 140) {
		bomb.conductor.bpm = bpm;
		bomb.conductor.paused = false;
		bomb.conductor.onBeat((beat, beatTime) => {
			tick();
			if (beat == 4) destroy();
		});
	}

	/** Turns off the bomb */
	function extinguish() {
		// when timeOut and you win, it explodes and since you won it runs extinguish
		// which access fuse, which it shouldn't because when it explodes the parent is destroyed
		if (hasExploded) return;
		bomb.conductor.paused = true;
		fuse.fadeOut(0.5 / 3).onEnd(() => fuse.destroy());
	}

	return bomb;
}

export type WareBomb = ReturnType<typeof addBomb>;
