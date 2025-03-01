import { Color, GameObj, KAPLAYCtx, Mat4, Vec2 } from "kaplay";
import { KaplayWareCtx } from "./types";

export function addPrompt(k: KAPLAYCtx, prompt: string, time: number = 0.25, wobbleLetters: boolean = true) {
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

	promptTitle.tween(0, 1.2, time, (p) => promptTitle.scale.x = p, k.easings.easeOutExpo);
	promptTitle.tween(0, 0.9, time, (p) => promptTitle.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
		promptTitle.tween(promptTitle.scale, k.vec2(1), time * 1.1, (p) => promptTitle.scale = p, k.easings.easeOutElastic).onEnd(() => {
			// now do the shaky letters
			if (wobbleLetters == false) return;

			let magnitude = 0;
			let angle = 0;
			promptTitle.onUpdate(() => {
				magnitude = k.lerp(magnitude, k.randi(2, 8), 0.1);
				angle = k.lerp(angle, angle + 1, 0.1) % 360;
				promptTitle.textTransform = (idx, ch) => ({
					pos: k.vec2(magnitude * Math.cos(angle * idx + 1), magnitude * Math.sin(angle * idx + 1)),
				});
			});
		});
	});
	return promptTitle;
}

export function makeHearts(k: KAPLAYCtx, parent: GameObj | KAPLAYCtx, amount: number) {
	const hearts: ReturnType<typeof makeHeart>[] = [];
	for (let i = 0; i < amount; i++) {
		const heart = parent.add(makeHeart(k));
		heart.scale = k.vec2(2);
		const HEART_WIDTH = heart.width * heart.scale.x * 1.1;
		const INITIAL_POS = k.vec2(k.center().x - HEART_WIDTH * 1.5, 0);
		heart.pos = INITIAL_POS.add(k.vec2(HEART_WIDTH * i, heart.height * 2));
		hearts.push(heart);
	}

	return hearts;
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
		k.text(`${score.toString()}`, { align: "left" }),
		k.color(k.WHITE),
		k.anchor("center"),
		k.scale(4),
		k.rotate(0),
		k.pos(k.center().x, k.center().y - 150),
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

	const fuse = k.add([
		k.sprite("@bomb_wire", { tiled: true }),
		k.pos(k.vec2()),
		k.anchor("left"),
	]);

	const bomb = k.add([
		k.sprite("@bomb"),
		k.pos(k.vec2(40, k.height() - 40)),
		k.anchor("center"),
		k.scale(1.25),
		k.color(),
	]);

	const flame = k.add([
		k.sprite("@bomb_flame"),
		k.pos(),
		k.anchor("center"),
		k.scale(),
		k.opacity(),
	]);

	const ogFuseWidth = fuse.width;
	const totalBeats = 6;
	let beatsLeft = totalBeats;
	let fuseWidth = ogFuseWidth;
	let flamePos = fuse.pos.add(k.vec2(fuse.width, flame.height / 2));

	function destroy() {
		bomb.destroy();
		fuse.destroy();
		flame.destroy();
	}

	bomb.onUpdate(() => {
		if (beatsLeft < -1) return;

		if (ware.time <= (timeAtCreate / totalBeats) * beatsLeft) {
			fuseWidth -= ogFuseWidth / totalBeats;
			beatsLeft--;

			if (beatsLeft == 0 || beatsLeft == 1 || beatsLeft == 2) {
				k.tween(k.vec2(1.5), k.vec2(1.25), timeAtCreate / totalBeats, (p) => bomb.scale = p, k.easings.easeOutQuint);
				k.play("@tick", { detune: 25 * 2 - beatsLeft });
			}

			if (beatsLeft == 2) {
				bomb.color = k.YELLOW;
			}
			else if (beatsLeft == 1) {
				bomb.color = k.RED.lerp(k.YELLOW, 0.5);
			}
			else if (beatsLeft == 0) {
				bomb.color = k.RED;
			}

			if (beatsLeft == -1) {
				destroy();
				k.addKaboom(bomb.pos);
				k.play("@explosion");
			}
		}

		if (beatsLeft != 0) flamePos = fuse.pos.add(fuse.width, flame.height / 2);
		else flamePos = bomb.pos.sub(0, bomb.height * 0.75);

		fuse.pos = bomb.pos.sub(0, bomb.height);
		fuse.width = k.lerp(fuse.width, fuseWidth, 0.75);
		flame.pos = k.lerp(flame.pos, flamePos, 0.75);
	});

	return {
		destroy,
		turnOff: () => {
			flame.fadeOut(timeAtCreate / totalBeats).onEnd(() => flame.destroy());
		},
	};
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
