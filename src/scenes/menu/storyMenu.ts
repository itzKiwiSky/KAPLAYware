import { GameObj } from "kaplay";
import k from "../../engine";
import { linearSelectorObj } from "./linearSelector";
import goGame from "../game/GameScene";
import { MenuDefinition, moveToMenu } from "./MenuScene";

function addPack(pack: string, parent: GameObj) {
	const obj = parent.add([
		k.sprite("cartridge_pack", { anim: "blur" }),
		k.anchor("center"),
		k.pos(k.center().x, 150),
		k.scale(),
		k.opacity(),
		k.rotate(),
		k.area(),
		"pack",
		{
			pack: pack,
			intendedX: k.center().x,
		},
	]);

	obj.onDraw(() => {
		k.drawText({
			text: pack,
			anchor: "center",
			size: 20,
		});
	});

	return obj;
}

type PackObject = ReturnType<typeof addPack>;

export const storyMenu: MenuDefinition = (scene, tween) => {
	let selected = false;

	const kaboy = scene.add([
		k.sprite("kaboy"),
		k.pos(k.center().x, 900),
		k.anchor("center"),
		k.z(1),
	]);

	// side buttons
	const leftBtn = scene.add([
		k.sprite("btn_arrow", { flipX: true }),
		k.anchor("center"),
		k.area(),
		k.scale(),
		k.pos(54, 196),
		"button",
		{
			press: () => {},
			action: () => k.pressButton("left"),
		},
	]);

	const rightBtn = scene.add([
		k.sprite("btn_arrow"),
		k.anchor("center"),
		k.pos(746, 196),
		k.scale(),
		k.area(),
		"button",
		{
			press: () => {},
			action: () => k.pressButton("right"),
		},
	]);

	const backButton = scene.add([
		k.sprite("btn_back"),
		k.anchor("center"),
		k.pos(leftBtn.pos.x, 540),
		k.area(),
		k.scale(),
		"button",
		{
			press: () => {},
			action: () => k.pressButton("return"),
		},
	]);

	scene.get("button").forEach((button: typeof backButton) => {
		button.onHover(() => button.play("focus"));
		button.onHoverEnd(() => button.play("blur"));
		button.press = () => {
			const randVec = k.vec2(k.rand(0.95, 1.215), k.rand(0.95, 1.215));
			scene.tween(randVec, k.vec2(1), 0.35, (p) => button.scale = p, k.easings.easeOutQuint);
		};

		button.onClick(() => {
			button.action();
			button.press();
		});
	});

	const packs = ["chill", "community"];
	packs.forEach((pack) => {
		addPack(pack, scene);
	});

	const manager = linearSelectorObj<PackObject>(scene);
	manager.paused = true;
	manager.menuItems = scene.get("pack");
	manager.menuBack = "left";
	manager.menuNext = "right";
	manager.menuSelect = "action";
	tween.onEnd(() => manager.paused = false);

	scene.onUpdate(() => {
		if (k.isButtonPressed("left")) leftBtn.press();
		else if (k.isButtonPressed("right")) rightBtn.press();

		const packs = scene.get("pack") as PackObject[];
		packs.forEach((packObj, index) => {
			if (index == manager.index) {
				packObj.intendedX = k.center().x;

				if (selected) {
					// packObj.angle = k.lerp()
					return;
				}

				packObj.scale = k.lerp(packObj.scale, k.vec2(1), 0.5);
				packObj.opacity = k.lerp(packObj.opacity, 1, 0.5);
				const wavingY = k.wave(150, 155, k.time());
				const wavingAngle = k.wave(-2.5, 2.5, k.time());
				packObj.pos.y = k.lerp(packObj.pos.y, wavingY, 0.5);
				packObj.angle = k.lerp(packObj.angle, wavingAngle, 0.5);

				if (packObj.isClicked()) k.pressButton("action");
			}
			else {
				packObj.intendedX = k.center().x + packObj.width * 1.5 * (index - manager.index);
				packObj.scale = k.lerp(packObj.scale, k.vec2(0.85), 0.5);
				packObj.opacity = k.lerp(packObj.opacity, 0.85, 0.5);
				const wavingY = k.wave(150, 155, k.time() / 2);
				packObj.pos.y = k.lerp(packObj.pos.y, wavingY, 0.5);
				packObj.angle = k.lerp(packObj.angle, 0, 0.5);
			}

			packObj.pos.x = k.lerp(packObj.pos.x, packObj.intendedX, 0.5);
		});
	});

	manager.onChange((newSelect, oldSelect) => {
		newSelect.untag("ignorepoint");
		newSelect.play("focus");
		oldSelect?.tag("ignorepoint");
		oldSelect?.play("blur");
	});

	manager.trigger("change", manager.getSelected());

	manager.onSelect(() => {
		if (selected) return;
		selected = true;
		manager.paused = true;

		const selectPack = manager.getSelected();
		scene.tween(k.vec2(1.25), k.vec2(1), 0.25, (p) => selectPack.scale = p, k.easings.easeOutQuint);
		scene.wait(0.25, () => {
			scene.tween(selectPack.pos.y, 380, 0.5, (p) => selectPack.pos.y = p, k.easings.easeOutQuint);
			scene.wait(0.5, () => {
				const theGames = window.microgames.filter((game) => game.pack == selectPack.pack);
				goGame({ availableGames: theGames });
			});
		});
	});

	scene.onButtonPress("return", () => {
		if (selected) return;
		backButton.press();
		moveToMenu("main");
		scene.tween(kaboy.pos.y, 600, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
	});

	scene.wait(0.5, () => {
		scene.tween(kaboy.pos.y, 600, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
	});

	return scene;
};
