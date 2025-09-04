import { GameObj } from "kaplay";
import k from "../../../../engine";
import { Microgame } from "../../../../types/Microgame";
import { getGameColor, getGameID, getGameInput } from "../../../../utils";
import { createView, goView } from "../viewManager";
import { createWareApp } from "../../../game/app";
import { createWareEngine } from "../../../game/ware";
import { createPreviewGameCtx } from "./previewContext";
import { createGameCtx } from "../../../game/context/gameContext";
import goGame from "../../../game/GameScene";

function addBox(text: string, parent: GameObj) {
	const box = parent.add([
		k.sprite("cartridge_box", { anim: "blur" }),
		k.anchor("center"),
		k.scale(),
		k.pos(k.center().x, 150),
		k.opacity(1),
		k.rotate(),
		k.area(),
		k.z(1),
		"box",
		{
			text: text,
			isOpen: false,
			boxIndex: 0,
			itemIndex: 0,
			targetX: 0,
		},
	]);

	box.onDraw(() => {
		k.drawText({
			text: box.text,
			color: k.mulfok.VOID_VIOLET,
			pos: k.vec2(0, 5),
			angle: 5,
			anchor: "center",
			align: "center",
			scale: k.vec2(0.65),
			font: "happy",
			opacity: 0.5,
		});
	});
	return box;
}

type BoxObject = ReturnType<typeof addBox>;

function addCartridge(game: Microgame, parent: GameObj) {
	const obj = parent.add([
		k.sprite("cartridge", { anim: "blur" }),
		k.anchor("center"),
		k.pos(k.center().x, 150),
		k.scale(),
		k.opacity(),
		k.rotate(),
		k.area(),
		k.z(0),
		"game",
		{
			game: game,
			boxIndex: 0,
			targetX: 0,
		},
	]);

	obj.onDraw(() => {
		k.drawText({
			text: game.name,
			anchor: "center",
			size: 20,
			pos: k.vec2(0, 20),
		});
	});

	return obj;
}

type CartridgeObject = ReturnType<typeof addCartridge>;

const FREEPLAY_POS = k.vec2(-900, 0);

// dani esto no se va a quedar aqui luego miramos donde lo guardamos nomas lo pongo aqui por ahora
// con esto me referia a lo de options by group pero capaz si se queda aqui no esta mal
type PossibleGroups = "input" | "pack" | "isboss" | "author";

export function getOptionsByGroup(group: PossibleGroups) {
	if (group == "input") {
		return {
			"Mouse": window.microgames.filter((g) => getGameInput(g) == "mouse"),
			"Keys": window.microgames.filter((g) => getGameInput(g) == "keys"),
			"Both": window.microgames.filter((g) => getGameInput(g) == "both"),
		};
	}
	else if (group == "pack") {
		return {
			"Chill": window.microgames.filter((g) => g.pack == "chill"),
			"Community": window.microgames.filter((g) => g.pack == "community"),
		};
	}
	else if (group == "isboss") {
		return {
			"Boss": window.microgames.filter((g) => g.isBoss),
			"Regular": window.microgames.filter((g) => !g.isBoss),
		};
	}
	else if (group == "author") {
		const data: Record<string, Microgame[]> = {};
		window.microgames.forEach((game) => data[game.author] = window.microgames.filter((g) => g.author == game.author));
	}
}

// Store them outside so they don't get lost when the scene is reloaded
let currentBoxIndex = 0;
let currentGameIndex = null; // null = selecting box itself

export const addFreeplayView = (isFirst: boolean) => {
	const p = createView<CartridgeObject | BoxObject>(FREEPLAY_POS, "freeplay");
	p.selectorPaused = true;
	p.menuBack = "left";
	p.menuNext = "right";
	p.menuSelect = "action";

	// console stuff
	const kaboy = p.add([
		k.sprite("kaboy"),
		k.pos(k.center().x, 900),
		k.anchor("center"),
	]);

	// add small engine
	const app = createWareApp(kaboy);
	app.boxObj.pos = k.vec2(0, -116);
	app.boxObj.scaleToSize(k.vec2(246, 148));
	const ware = createWareEngine(app, { games: window.microgames });
	const ctx = createPreviewGameCtx(createGameCtx(ware, app));

	// State, all of this is for grouping and later for sorting
	const currentGroup: PossibleGroups = "pack";
	const optionsByGroup = getOptionsByGroup(currentGroup);
	const menuContainer = p.add([k.pos()]);
	const SPACING = 250;

	type BoxEntity = { box: BoxObject; games: CartridgeObject[]; };
	const boxEntities: BoxEntity[] = [];
	let expandedBoxes = new Set([0]);

	// keep track of previous hovered indexes
	let prevBoxIndex = currentBoxIndex;
	let prevGameIndex = currentGameIndex;

	// parent container for smooth scrolling
	let intendedX = 0;

	// goes through all the options and adds them
	Object.keys(optionsByGroup).forEach((boxKey, bi) => {
		const games = optionsByGroup[boxKey];

		const boxObj = addBox(boxKey, menuContainer);

		const cartObjs = games.map((game: Microgame) => {
			const cartObj = addCartridge(game, menuContainer);
			cartObj.boxIndex = bi;
			return cartObj;
		});

		boxEntities.push({ box: boxObj, games: cartObjs });
	});

	// calculates the position of each object
	function calculateLayout() {
		let cursorX = 0;

		Object.keys(optionsByGroup).forEach((boxKey, bi) => {
			const games = optionsByGroup[boxKey];
			const boxEnt = boxEntities[bi];

			// position box first
			boxEnt.box.targetX = cursorX;

			if (expandedBoxes.has(bi)) {
				let gx = cursorX + SPACING;
				games.forEach((_, gi: number) => {
					boxEnt.games[gi].targetX = gx;
					gx += SPACING;
				});
				cursorX = gx;
			}
			else {
				// collapsed → games sit under the box
				games.forEach((_, gi) => {
					boxEnt.games[gi].targetX = cursorX;
				});
				cursorX += SPACING; // skip only box width
			}
		});
	}

	// toggle expand stuff (should only work on boxes)
	function toggleExpandCollapse() {
		if (expandedBoxes.has(currentBoxIndex)) {
			expandedBoxes.delete(currentBoxIndex);
			currentGameIndex = null;
		}
		else {
			expandedBoxes.add(currentBoxIndex);
		}
		calculateLayout();
		intendedX = k.width() / 2 - getCurrentTargetX();
	}

	// find the "focus" X position of current selection
	function getCurrentTargetX() {
		const be = boxEntities[currentBoxIndex];
		if (currentGameIndex === null) {
			return be.box.targetX ?? 0;
		}
		return be.games[currentGameIndex].targetX ?? 0;
	}

	// reloads the game when you scroll
	function reloadHoverCheck() {
		// clear previous
		app.clearAll();
		app.resetCamera();
		app.time = 0;
		app.sounds.paused = true;
		app.sceneObj.removeAll();
		ware.onTimeOutEvents.clear();
		k.setGravity(0);
		ctx.clearInputHandlers();

		// if currently hovering a game and not a box
		if (currentGameIndex != null) {
			ware.microgame = boxEntities[currentBoxIndex].games[currentGameIndex].game;
			ctx.setRGB(getGameColor(ware.microgame, ctx));
			ware.microgame.start(ctx);

			const previewData = window.freeplayPreviewData[getGameID(ware.microgame)];
			if (!previewData) {
				app.paused = true;
				return;
			}

			// all of this only happens if there's previewData
			app.paused = false;
			ctx.randSeed(previewData.seed);
			let frame = 0;
			ctx.onUpdate(() => {
				frame++;
				previewData.inputs.forEach((input, index, arr) => {
					if (index == arr.length) k.debug.log("last input");
					if (input.frame != frame) return;

					if (input.type == "mouseMove") {
						ctx.triggerButton("moveMouse", k.Vec2.deserialize(input.position), k.Vec2.deserialize(input.delta));
						ctx.mousePos = () => k.Vec2.deserialize(input.position);
						ctx.mouseDeltaPos = () => k.Vec2.deserialize(input.delta);
					}
					else {
						ctx.triggerButton(input.button, input.type);
					}
				});
			});
		}
	}

	p.onUpdate(() => {
		// smooth scroll
		menuContainer.pos.x = k.lerp(menuContainer.pos.x, intendedX, 0.25);

		// lerp each item to target when folding
		Object.keys(optionsByGroup).forEach((box, bi) => {
			const boxEnt = boxEntities[bi];
			boxEnt.box.pos.x = k.lerp(boxEnt.box.pos.x, boxEnt.box.targetX, 0.2);

			boxEnt.games.forEach((g, gi) => {
				g.pos.x = k.lerp(g.pos.x, g.targetX, 0.2);
			});
		});

		const hoveredBox = boxEntities[currentBoxIndex].box;
		boxEntities.map((ent) => ent.box).forEach((box) => {
			if (box == hoveredBox) {
				if (box.getCurAnim().name != "focus") box.play("focus");
				const wavingY = k.wave(150, 155, k.time());
				const wavingAngle = k.wave(-2.5, 2.5, k.time() / 2);
				box.pos.y = k.lerp(box.pos.y, wavingY, 0.5);
				box.angle = k.lerp(box.angle, wavingAngle, 0.5);
			}
			else {
				if (box.getCurAnim().name == "focus") box.play("blur");
				const wavingY = k.wave(150, 155, k.time() / 2);
				box.pos.y = k.lerp(box.pos.y, wavingY, 0.5);
				box.angle = k.lerp(box.angle, 0, 0.5);
			}
		});

		const hoveredCart = boxEntities[currentBoxIndex].games[currentGameIndex];
		boxEntities[currentBoxIndex].games.forEach((cart, index) => {
			if (cart == hoveredCart) {
				if (cart.getCurAnim().name != "focus") cart.play("focus");
				const wavingY = k.wave(135, 165, k.time() + index * 0.95);
				const wavingAngle = k.wave(-2.5, 2.5, k.time());
				cart.pos.y = k.lerp(cart.pos.y, wavingY, 0.5);
				cart.angle = k.lerp(cart.angle, wavingAngle, 0.5);
			}
			else {
				if (cart.getCurAnim().name == "focus") cart.play("blur");
				const wavingY = k.wave(135, 165, k.time() + index * 0.75);
				cart.pos.y = k.lerp(cart.pos.y, wavingY, 0.5);
				cart.angle = k.lerp(cart.angle, 0, 0.5);
			}
		});

		// this only runs when the object was changed
		if (currentBoxIndex !== prevBoxIndex || currentGameIndex !== prevGameIndex) {
			// update previous trackers
			prevBoxIndex = currentBoxIndex;
			prevGameIndex = currentGameIndex;
			reloadHoverCheck();
		}
	});

	p.onButtonPress("left", () => {
		if (p.selectorPaused) return;
		const boxKeys = Object.keys(optionsByGroup);

		if (expandedBoxes.has(currentBoxIndex)) {
			if (currentGameIndex !== null) {
				if (currentGameIndex > 0) {
					currentGameIndex--;
				}
				else {
					// wrap around to last game of previous box
					currentGameIndex = null;
				}
			}
			else {
				currentBoxIndex = (currentBoxIndex - 1 + boxKeys.length) % boxKeys.length;
				const prevGames = optionsByGroup[boxKeys[currentBoxIndex]];
				currentGameIndex = expandedBoxes.has(currentBoxIndex)
					? prevGames.length - 1
					: null;
			}
		}
		else {
			currentBoxIndex = (currentBoxIndex - 1 + boxKeys.length) % boxKeys.length;
			currentGameIndex = null;
		}
		intendedX = k.width() / 2 - getCurrentTargetX();
	});

	p.onButtonPress("right", () => {
		if (p.selectorPaused) return;
		const boxKeys = Object.keys(optionsByGroup);
		const games = optionsByGroup[boxKeys[currentBoxIndex]];

		if (expandedBoxes.has(currentBoxIndex)) {
			if (currentGameIndex === null) {
				currentGameIndex = 0;
			}
			else if (currentGameIndex < games.length - 1) {
				currentGameIndex++;
			}
			else {
				// wrap around to first game/box
				currentGameIndex = null;
				currentBoxIndex = (currentBoxIndex + 1) % boxKeys.length;
			}
		}
		else {
			currentBoxIndex = (currentBoxIndex + 1) % boxKeys.length;
			currentGameIndex = null;
		}
		intendedX = k.width() / 2 - getCurrentTargetX();
	});

	p.onButtonPress("action", () => {
		if (p.selectorPaused) return;
		if (currentGameIndex != null) {
			const hoveredCart = boxEntities[currentBoxIndex].games[currentGameIndex];
			if (k.getLastInputDeviceType() == "mouse" && !hoveredCart.isHovering()) return;

			p.selectorPaused = true;
			p.tween(k.vec2(1.25), k.vec2(1), 0.25, (p) => hoveredCart.scale = p, k.easings.easeOutQuint);
			p.wait(0.25, () => {
				p.tween(hoveredCart.pos.y, 380, 0.5, (p) => hoveredCart.pos.y = p, k.easings.easeOutQuint);
				p.wait(0.5, () => {
					const theGames = window.microgames.filter((game) => game == hoveredCart.game);
					goGame(theGames, {}, "freeplay");
				});
			});
		}
		else {
			const hoveredBox = boxEntities[currentBoxIndex].box;
			if (k.getLastInputDeviceType() == "mouse" && !hoveredBox.isHovering()) return;
			toggleExpandCollapse();
		}
	});

	p.onButtonPress("return", () => {
		if (p.selectorPaused) return;
		p.selectorPaused = true;
		backButton.press();
		goView("main");
		k.tween(kaboy.pos.y, 900, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
	});

	// side buttons
	const leftBtn = p.add([
		k.sprite("btn_arrow", { flipX: true }),
		k.anchor("center"),
		k.area(),
		k.scale(),
		k.z(1),
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
		k.z(1),
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

	// init part of the view
	calculateLayout();
	intendedX = k.width() / 2 - getCurrentTargetX();

	if (!isFirst) {
		menuContainer.get("game").forEach((g) => g.hidden = true);
	}

	p.onEnter(() => {
		menuContainer.get("game").forEach((g) => g.hidden = false);
		p.selectorPaused = true;
		reloadHoverCheck();
		p.wait(0.25, () => {
			p.selectorPaused = false;
			k.tween(kaboy.pos.y, 600, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
		});
	});

	p.onExit(() => {
		p.selectorPaused = true;
		menuContainer.get("game").forEach((g) => g.hidden = true);
	});
};
