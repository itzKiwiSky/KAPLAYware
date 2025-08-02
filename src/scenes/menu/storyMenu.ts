import { GameObj } from "kaplay";
import k from "../../engine";
import { linearSelectorObj } from "./linearSelector";
import goGame from "../game/GameScene";
import { MenuDefinition, moveToMenu } from "./MenuScene";

function addPack(pack: string, parent: GameObj) {
	const obj = parent.add([
		k.sprite("cartridge_pack"),
		k.anchor("center"),
		k.pos(k.center().x, 150),
		k.scale(),
		k.opacity(),
		k.rotate(),
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
			k.tween(randVec, k.vec2(1), 0.35, (p) => button.scale = p, k.easings.easeOutQuint);
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

	const manager = linearSelectorObj<PackObject>();
	manager.menuItems = scene.get("pack");
	manager.menuBack = "left";
	manager.menuNext = "right";
	manager.menuSelect = "action";

	scene.onUpdate(() => {
		if (k.isButtonPressed("left")) leftBtn.press();
		else if (k.isButtonPressed("right")) rightBtn.press();
		else if (k.isButtonPressed("return")) backButton.press();

		const packs = scene.get("pack") as PackObject[];
		packs.forEach((packObj, index) => {
			if (index == manager.index) {
				packObj.intendedX = k.center().x;
				if (selected) return;
				packObj.scale = k.lerp(packObj.scale, k.vec2(1), 0.5);
				packObj.opacity = k.lerp(packObj.opacity, 1, 0.5);
				const wavingY = k.wave(150, 155, k.time());
				const wavingAngle = k.wave(-2.5, 2.5, k.time());
				packObj.pos.y = k.lerp(packObj.pos.y, wavingY, 0.5);
				packObj.angle = k.lerp(packObj.angle, wavingAngle, 0.5);
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

	manager.onSelect(() => {
		if (selected) return;
		selected = true;

		const selectPack = manager.getSelected();
		k.tween(k.vec2(1.25), k.vec2(1), 0.25, (p) => selectPack.scale = p, k.easings.easeOutQuint);
		k.wait(0.25, () => {
			k.tween(selectPack.pos.y, 380, 0.5, (p) => selectPack.pos.y = p, k.easings.easeOutQuint);
			k.wait(0.5, () => {
				const theGames = window.microgames.filter((game) => game.pack == selectPack.pack);
				goGame({ availableGames: theGames });
			});
		});
	});

	scene.onButtonPress("return", () => {
		moveToMenu("main");
		k.tween(kaboy.pos.y, 600, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
	});

	k.wait(0.5, () => {
		k.tween(kaboy.pos.y, 600, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
	});

	return scene;
};
