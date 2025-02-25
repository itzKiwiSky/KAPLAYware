import { GameObj, KAPLAYCtx } from "kaplay";
import { KaplayWareCtx } from "./types";

export function addPrompt(k: KAPLAYCtx, prompt: string) {
	const promptTitle = k.add([
		k.color(k.WHITE),
		k.text(`[a]${prompt}[/a]`, {
			align: "center",
			size: 100,
			styles: {
				"a": {
					pos: k.vec2(),
				},
			},
		}),
		k.pos(k.center()),
		k.anchor("center"),
		k.scale(),
		k.opacity(),
		k.timer(),
		k.z(101),
	]);

	for (let i = 0; i < prompt.length; i++) {
		// @ts-ignore
		// promptTitle.tween(-5, 0, 0.05 * i, (p) => promptTitle.textStyles["a"].pos.y = p, k.easings.easeOutElastic);
	}
	promptTitle.tween(k.vec2(0), k.vec2(1), 0.25, (p) => promptTitle.scale = p, k.easings.easeOutElastic);
	return promptTitle;
}

export function makeHeart(k: KAPLAYCtx) {
	const heart = k.make([
		k.sprite("@heart"),
		k.pos(),
		k.anchor("center"),
		k.scale(1),
		k.rotate(),
		k.opacity(),
		k.z(100),
		"heart",
		{
			kill() {
			},
		},
	]);

	heart.kill = () => {
		heart.fadeOut(0.5).onEnd(() => heart.destroy());
	};

	return heart;
}

export function makeScoreText(k: KAPLAYCtx, score: number) {
	return k.make([
		k.text(`[a]${score.toString()}[/a]`, {
			styles: {
				"a": {
					angle: 0,
				},
			},
		}),
		k.color(k.WHITE),
		k.anchor("topleft"),
		k.scale(4),
		k.pos(k.center().x, k.center().y - 90),
		k.timer(),
	]);
}

export function addBomb(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const timeAtCreate = ware.time;

	const bomb = k.add([
		k.sprite("@bomb"),
		k.pos(k.vec2(40, k.height() - 40)),
		k.anchor("center"),
		k.scale(1.25),
		"bomb",
	]);

	function addFuse() {
		return k.add([
			k.rect(70, k.rand(30, 40), { radius: 4 }),
			k.pos(k.center()),
			k.anchor("center"),
			k.outline(4, k.BLACK),
			k.color(),
		]);
	}

	for (let i = 0; i < 8; i++) {
		const fuse = addFuse();
		fuse.pos = bomb.pos.add((i + 1) * (fuse.width * 1.25), 0);
		fuse.onUpdate(() => {
			if (ware.time <= (timeAtCreate / 8) * (i + 1)) {
				fuse.destroy();
			}

			if (ware.time <= (timeAtCreate / 8) * (i + 2)) {
				if (i == 0) fuse.color = k.RED;
				else if (i == 1) fuse.color = k.RED.lerp(k.YELLOW, 0.5);
				else if (i == 2) fuse.color = k.YELLOW;
			}
		});
	}

	bomb.onUpdate(() => {
		if (ware.time <= 0 && bomb.exists()) {
			bomb.destroy();
			k.addKaboom(bomb.pos);
		}
	});
}
