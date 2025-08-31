import { GameObj } from "kaplay";
import k from "../../../engine";
import goGame from "../../game/GameScene";
import { createView, goView } from "./viewManager";

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

const STORY_POS = k.vec2(800, 0);

export function addStoryView(isFirst: boolean) {
	const p = createView<PackObject>(STORY_POS, "story");
	p.selectorPaused = true;

	const kaboy = p.add([
		k.sprite("kaboy"),
		k.pos(k.center().x, 900),
		k.anchor("center"),
		k.z(1),
	]);

	// side buttons
	const leftBtn = p.add([
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

	const rightBtn = p.add([
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

	const backButton = p.add([
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

	p.get("button").forEach((button: typeof backButton) => {
		button.onHover(() => button.play("focus"));
		button.onHoverEnd(() => button.play("blur"));
		button.press = () => {
			const randVec = k.vec2(k.rand(0.95, 1.215), k.rand(0.95, 1.215));
			p.tween(randVec, k.vec2(1), 0.35, (p) => button.scale = p, k.easings.easeOutQuint);
		};

		button.onClick(() => {
			button.action();
			button.press();
		});
	});

	const packs = ["chill", "community"];
	packs.forEach((pack) => {
		const packObj = addPack(pack, p);
		packObj.onClick(() => p.getSelected() == packObj ? k.pressButton("action") : false);
	});

	p.menuItems = p.get("pack");
	p.menuBack = "left";
	p.menuNext = "right";
	p.menuSelect = "action";

	p.onUpdate(() => {
		if (k.isButtonPressed("left")) leftBtn.press();
		else if (k.isButtonPressed("right")) rightBtn.press();

		const packs = p.get("pack") as PackObject[];
		packs.forEach((packObj, index) => {
			if (index == p.index) {
				packObj.intendedX = k.center().x;
				if (packObj.area.cursor == "none") packObj.area.cursor = null;

				if (p.selectorPaused) {
					packObj.angle = k.lerp(packObj.angle, 0, 0.5);
					return;
				}

				packObj.scale = k.lerp(packObj.scale, k.vec2(1), 0.5);
				packObj.opacity = k.lerp(packObj.opacity, 1, 0.5);
				const wavingY = k.wave(150, 155, k.time());
				const wavingAngle = k.wave(-2.5, 2.5, k.time());
				packObj.pos.y = k.lerp(packObj.pos.y, wavingY, 0.5);
				packObj.angle = k.lerp(packObj.angle, wavingAngle, 0.5);
			}
			else {
				if (!packObj.tags.includes("ignorepoint")) packObj.tag("ignorepoint");
				packObj.intendedX = k.center().x + packObj.width * 1.5 * (index - p.index);
				packObj.scale = k.lerp(packObj.scale, k.vec2(0.85), 0.5);
				packObj.opacity = k.lerp(packObj.opacity, 0.85, 0.5);
				const wavingY = k.wave(150, 155, k.time() / 2);
				packObj.pos.y = k.lerp(packObj.pos.y, wavingY, 0.5);
				packObj.angle = k.lerp(packObj.angle, 0, 0.5);
			}

			packObj.pos.x = k.lerp(packObj.pos.x, packObj.intendedX, 0.5);
		});
	});

	p.onChange((newSelect, oldSelect) => {
		oldSelect?.play("blur");
		newSelect.play("focus");
	});

	p.onSelect(() => {
		if (p.selectorPaused) return;
		p.selectorPaused = true;
		const selectPack = p.getSelected();
		p.tween(k.vec2(1.25), k.vec2(1), 0.25, (p) => selectPack.scale = p, k.easings.easeOutQuint);
		p.wait(0.25, () => {
			p.tween(selectPack.pos.y, 380, 0.5, (p) => selectPack.pos.y = p, k.easings.easeOutQuint);
			p.wait(0.5, () => {
				const theGames = window.microgames.filter((game) => game.pack == selectPack.pack);
				goGame(theGames, {}, "story");
			});
		});
	});

	p.onButtonPress("return", () => {
		p.selectorPaused = true;
		backButton.press();
		goView("main");
		k.tween(kaboy.pos.y, 900, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
	});

	p.setSelected(p.menuItems[0]);
	p.onEnter(() => {
		p.selectorPaused = true;

		p.wait(0.25, () => {
			p.selectorPaused = false;
			k.tween(kaboy.pos.y, 600, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
		});
	});
}
