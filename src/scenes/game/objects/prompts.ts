import k from "../../../engine";
import { WareApp } from "../app";
import { TransCtx } from "../transitions/transContext";
import { MicrogameInput } from "../context/types";

// TODO: not a big fan of passing transCtx here
export function addTextPrompt(wareApp: WareApp, promptText: string, speed = 1, transCtx: TransCtx) {
	const promptObj = wareApp.rootObj.add([
		k.color(k.WHITE),
		k.fixed(),
		k.text(`[a]${promptText}[/a]`, {
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
		k.z(1),
		{
			/** Set this to true if you wish for the object to not use the default animation */
			overrideAnimation: false,
		},
	]);

	if (promptObj.overrideAnimation == false) {
		// the shaky letters
		let magnitude = 0;
		let angle = 0;
		promptObj.onUpdate(() => {
			magnitude = k.lerp(magnitude, k.randi(2, 8), 0.1);
			angle = k.lerp(angle, angle + 1, 0.1) % 360;
			promptObj.textTransform = (idx, ch) => ({
				pos: k.vec2(magnitude * Math.cos(angle * ((idx % 2) + 1) + 1), magnitude * Math.sin(angle * ((idx % 2) + 1) + 1)),
			});
		});

		// the jumpy
		transCtx.tween(0, 1.2, 0.25 / speed, (p) => promptObj.scale.x = p, k.easings.easeOutExpo);
		transCtx.tween(0, 0.9, 0.25 / speed, (p) => promptObj.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
			transCtx.tween(promptObj.scale, k.vec2(1), 0.25 / speed, (p) => promptObj.scale = p, k.easings.easeOutElastic).onEnd(() => {
				transCtx.tween(1, 0, 0.25 / speed, (p) => {
					promptObj.opacity = p;
				}).onEnd(() => promptObj.destroy());
			});
		});
	}

	return promptObj;
}

export function addInputPrompt(wareApp: WareApp, input: MicrogameInput, speed = 1, transCtx: TransCtx) {
	const prompt = wareApp.rootObj.add([k.z(2)]);

	const inputBg = prompt.add([
		k.sprite("input-circle"),
		k.scale(),
		k.pos(k.center()),
		k.rotate(),
		k.anchor("center"),
	]);

	const inputPrompt = prompt.add([
		k.sprite("input-" + input),
		k.anchor("center"),
		k.pos(k.center()),
		k.scale(),
	]);

	prompt.onUpdate(() => {
		inputBg.angle += 0.1 * speed;
	});
	transCtx.tween(k.vec2(0), k.vec2(1), 0.25 / speed, (p) => inputBg.scale = p, k.easings.easeOutExpo);
	transCtx.tween(k.vec2(0), k.vec2(1), 0.25 / speed, (p) => inputPrompt.scale = p, k.easings.easeOutElastic);

	transCtx.wait(0.5 / speed, () => {
		transCtx.tween(k.vec2(1), k.vec2(0), 0.25 / speed, (p) => inputBg.scale = p, k.easings.easeOutExpo).onEnd(() => {
			prompt.destroy();
		});
	});

	return prompt;
}
