// import { Color, GameObj, KAPLAYCtx, Vec2 } from "kaplay";
// import k from "../engine";
// import { getGameInput } from "../game/utils";

// function addPrompt(wareApp: WareApp, promptText: string) {
// 	const promptObj = wareApp.rootObj.add([
// 		k.color(k.WHITE),
// 		k.fixed(),
// 		k.text(`[a]${promptText}[/a]`, {
// 			align: "center",
// 			size: 100,
// 			styles: {
// 				"a": {
// 					pos: k.vec2(),
// 				},
// 			},
// 		}),
// 		k.pos(k.center()),
// 		k.anchor("center"),
// 		k.scale(),
// 		k.opacity(),
// 		k.z(101),
// 		{
// 			/** Set this to true if you wish for the object to not use the default animation */
// 			overrideAnimation: false,
// 			end() {
// 			},
// 		},
// 	]);

// 	if (promptObj.overrideAnimation == false) {
// 		// the shaky letters
// 		let magnitude = 0;
// 		let angle = 0;
// 		promptObj.onUpdate(() => {
// 			magnitude = k.lerp(magnitude, k.randi(2, 8), 0.1);
// 			angle = k.lerp(angle, angle + 1, 0.1) % 360;
// 			promptObj.textTransform = (idx, ch) => ({
// 				pos: k.vec2(magnitude * Math.cos(angle * ((idx % 2) + 1) + 1), magnitude * Math.sin(angle * ((idx % 2) + 1) + 1)),
// 			});
// 		});

// 		// the jumpy
// 		wareApp.pausableCtx.tween(0, 1.2, 0.25 / wareApp.wareCtx.speed, (p) => promptObj.scale.x = p, k.easings.easeOutExpo);
// 		wareApp.pausableCtx.tween(0, 0.9, 0.25 / wareApp.wareCtx.speed, (p) => promptObj.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
// 			wareApp.pausableCtx.tween(promptObj.scale, k.vec2(1), 0.25 * 1.1, (p) => promptObj.scale = p, k.easings.easeOutElastic).onEnd(() => {
// 			});
// 		});

// 		promptObj.end = () => {
// 			// can't use fade out because it's not paused lol
// 			wareApp.pausableCtx.tween(promptObj.opacity, 0, 0.25 / wareApp.wareCtx.speed, (p) => promptObj.opacity = p).onEnd(() => promptObj.destroy());
// 		};
// 	}

// 	return promptObj;
// }

// function addInputPrompt(wareApp: WareApp, input: ReturnType<typeof getGameInput>) {
// 	const prompt = wareApp.rootObj.add([{
// 		end() {},
// 	}]);

// 	const inputBg = prompt.add([
// 		k.sprite("input-circle"),
// 		k.scale(),
// 		k.pos(k.center()),
// 		k.rotate(),
// 		k.anchor("center"),
// 	]);

// 	const inputPrompt = prompt.add([
// 		k.sprite("input-" + input),
// 		k.anchor("center"),
// 		k.pos(k.center()),
// 		k.scale(),
// 	]);

// 	prompt.onUpdate(() => {
// 		inputBg.angle += 0.1 * wareApp.wareCtx.speed;
// 	});
// 	wareApp.pausableCtx.tween(k.vec2(0), k.vec2(1), 0.25 / wareApp.wareCtx.speed, (p) => inputBg.scale = p, k.easings.easeOutExpo);
// 	wareApp.pausableCtx.tween(k.vec2(0), k.vec2(1), 0.25 / wareApp.wareCtx.speed, (p) => inputPrompt.scale = p, k.easings.easeOutElastic);

// 	prompt.end = () => {
// 		const tween = wareApp.pausableCtx.tween(k.vec2(1), k.vec2(0), 0.25 / wareApp.wareCtx.speed, (p) => inputBg.scale = p, k.easings.easeOutExpo);
// 		tween.onEnd(() => {
// 			prompt.destroy();
// 		});
// 		return tween;
// 	};
// 	return prompt;
// }

// export type WareBomb = GameObj<{ tick(): void; beatsLeft: number; turnOff(): void; explode(): void; hasExploded: boolean; lit(bpm?: number): void; }>;

// // export function wareObjectsPlugin(k: KAPLAYCtx) {
// // 	return {
// // 		addBomb,
// // 		addPrompt,
// // 		addInputPrompt,
// // 		addConfetti,
// // 	};
// // }

// // export default wareObjectsPlugin;
