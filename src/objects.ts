import { KAPLAYCtx } from "kaplay";
import { KaplayWareCtx } from "./types";

export function addPrompt(k: KAPLAYCtx, prompt: string) {
	const promptTitle = k.add([
		k.color(k.WHITE),
		k.text(prompt, { align: "center", size: 100 }),
		k.pos(k.center()),
		k.anchor("center"),
		k.scale(),
		k.opacity(),
		k.timer(),
		k.z(101),
	]);

	promptTitle.tween(k.vec2(0), k.vec2(1), 0.25, (p) => promptTitle.scale = p, k.easings.easeOutElastic);
	return promptTitle;
}

export function addHearts(k: KAPLAYCtx, lives: number) {
	const hearts: ReturnType<typeof addHeart>[] = [];

	function addHeart() {
		const heart = k.add([
			k.sprite("@heart"),
			k.pos(),
			k.anchor("center"),
			k.scale(2),
			k.rotate(),
			k.opacity(),
			k.z(100),
		]);

		return heart;
	}

	for (let i = 0; i < lives; i++) {
		const INITIAL_POS = k.vec2(k.center().x - 100, k.center().y + 100);
		const heart = addHeart();
		heart.pos = INITIAL_POS.add(k.vec2((heart.width * i) * 2.5, 0));
		hearts.push(heart);
	}

	return hearts;
}

export function addScoreText(k: KAPLAYCtx, score: number) {
	return k.add([
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
