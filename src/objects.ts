import { Color, GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { KaplayWareCtx } from "./types";

export function addPrompt(k: KAPLAYCtx, prompt: string) {
	const promptTitle = k.add([
		k.color(k.WHITE),
		k.fixed(),
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

export function makeFriend(k: KAPLAYCtx, name: string) {
	return k.make([
		k.sprite("@" + name),
		k.scale(2),
		k.pos(),
		k.anchor("bot"),
		k.rotate(0),
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

export type Sampler<T> = T | (() => T);

export type ConfettiOpt = {
	gravity?: number;
	airDrag?: number;
	spread?: number;
	fade?: number;
	count?: number;
	heading?: Sampler<number>;
	color?: Sampler<Color>;
	pos?: Sampler<Vec2>;
	velocity?: Sampler<number>;
	angularVelocity?: Sampler<number>;
	obj?: () => { draw: () => void; };
};

export function makeConfetti(k: KAPLAYCtx) {
	const DEF_COUNT = 80;
	const DEF_GRAVITY = 800;
	const DEF_AIR_DRAG = 0.9;
	const DEF_VELOCITY = [1000, 4000];
	const DEF_ANGULAR_VELOCITY = [-200, 200];
	const DEF_FADE = 0.3;
	const DEF_SPREAD = 60;
	const DEF_SPIN = [2, 8];
	const DEF_SATURATION = 0.7;
	const DEF_LIGHTNESS = 0.6;

	const opt: ConfettiOpt = {};

	const confetti = k.make();
	// @ts-ignore
	const sample = <T>(s: Sampler<T>): T => typeof s === "function" ? s() : s;
	for (let i = 0; i < (opt.count ?? DEF_COUNT); i++) {
		const p = confetti.add([
			k.pos(sample(opt.pos ?? k.vec2(0, 0))),
			opt.obj ? opt.obj() : k.choose([
				k.rect(k.rand(4, 20), k.rand(4, 20)),
				k.circle(k.rand(3, 10)),
			]),
			k.color(sample(opt.color ?? k.hsl2rgb(k.rand(0, 1), DEF_SATURATION, DEF_LIGHTNESS))),
			k.opacity(1),
			k.lifespan(4),
			k.scale(1),
			k.anchor("center"),
			k.rotate(k.rand(0, 360)),
		]);
		const spin = k.rand(DEF_SPIN[0], DEF_SPIN[1]);
		const gravity = opt.gravity ?? DEF_GRAVITY;
		const airDrag = opt.airDrag ?? DEF_AIR_DRAG;
		const heading = sample(opt.heading ?? 0) - 90;
		const spread = opt.spread ?? DEF_SPREAD;
		const head = heading + k.rand(-spread / 2, spread / 2);
		const fade = opt.fade ?? DEF_FADE;
		const vel = sample(opt.velocity ?? k.rand(DEF_VELOCITY[0], DEF_VELOCITY[1]));
		let velX = Math.cos(k.deg2rad(head)) * vel;
		let velY = Math.sin(k.deg2rad(head)) * vel;
		const velA = sample(opt.angularVelocity ?? k.rand(DEF_ANGULAR_VELOCITY[0], DEF_ANGULAR_VELOCITY[1]));
		p.onUpdate(() => {
			const dt = k.dt();
			velY += gravity * dt;
			p.pos.x += velX * dt;
			p.pos.y += velY * dt;
			p.angle += velA * dt;
			p.opacity -= fade * dt;
			velX *= airDrag;
			velY *= airDrag;
			p.scale.x = k.wave(-1, 1, k.time() * spin);
		});
	}
	return confetti;
}
