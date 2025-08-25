import { GameObj } from "kaplay";
import k from "../../../../engine";
import { Microgame } from "../../../../types/Microgame";
import { getGameID, getGameInput } from "../../../../utils";
import { createView } from "../viewManager";

function addBox(text: string, parent: GameObj) {
	const box = parent.add([
		k.sprite("cartridge_box", { anim: "blur" }),
		k.anchor("center"),
		k.scale(),
		k.pos(k.center()),
		k.opacity(0.5),
		k.rotate(),
		k.z(1),
		"box",
		{
			text: text,
			isOpen: false,
			boxIndex: 0,
			itemIndex: 0,
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
		k.pos(k.center()),
		k.scale(),
		k.opacity(),
		k.rotate(),
		k.area(),
		k.z(0),
		"game",
		{
			game: game,
			boxIndex: 0,
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

export const addFreeplayView = (isFirst: boolean) => {
	const p = createView<CartridgeObject | BoxObject>(FREEPLAY_POS, "freeplay");
	p.selectorPaused = true;
	p.menuBack = "left";
	p.menuNext = "right";
	p.menuSelect = "action";

	const currentGroup: PossibleGroups = "pack";
	const optionsByGroup = getOptionsByGroup(currentGroup);
	const menuContainer = p.add([k.pos()]);

	// ------------------ State ------------------
	let expandedBoxes = new Set([0]);
	let currentBoxIndex = 0;
	let currentGameIndex = null; // null = selecting box itself

	// parent container for smooth scrolling
	let intendedX = 0;

	type BoxEntity = { box: BoxObject; games: CartridgeObject[]; };

	// ------------------ Entities ------------------
	const boxEntities: BoxEntity[] = [];

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

	// ------------------ Position Calculation ------------------
	function calculateLayout() {
		const Xspacing = 306;

		let cursorX = 0;

		Object.keys(optionsByGroup).forEach((boxKey, bi) => {
			const games = optionsByGroup[boxKey];
			const boxEnt = boxEntities[bi];

			// if expanded, lay out games after it
			if (expandedBoxes.has(bi)) {
				let gx = cursorX + Xspacing;
				games.forEach((_, gi: number) => {
					boxEnt.games[gi].targetX = gx;
					gx += Xspacing;
				});
				cursorX = gx;
			}
			else {
				// collapsed → games sit under the box
				games.forEach((_, gi) => {
					boxEnt.games[gi].targetX = cursorX;
				});
				cursorX += Xspacing; // skip only box width
			}
		});
	}

	// ------------------ Navigation ------------------
	function moveRight() {
		const boxKey = Object.keys(optionsByGroup)[currentBoxIndex];
		const games = optionsByGroup[boxKey];
		if (expandedBoxes.has(currentBoxIndex)) {
			if (currentGameIndex === null) {
				currentGameIndex = 0;
			}
			else if (currentGameIndex < games.length - 1) {
				currentGameIndex++;
			}
			else {
				currentGameIndex = null;
				currentBoxIndex = (currentBoxIndex + 1) % Object.keys(optionsByGroup).length;
			}
		}
		else {
			currentBoxIndex = (currentBoxIndex + 1) % Object.keys(optionsByGroup).length;
			currentGameIndex = null;
		}
		intendedX = -getCurrentTargetX() + 200;
	}

	function moveLeft() {
		const boxKey = Object.keys(optionsByGroup)[currentBoxIndex];
		const games = optionsByGroup[boxKey];
		if (expandedBoxes.has(currentBoxIndex)) {
			if (currentGameIndex !== null) {
				if (currentGameIndex > 0) {
					currentGameIndex--;
				}
				else {
					currentGameIndex = null;
				}
			}
			else {
				currentBoxIndex = (currentBoxIndex - 1 + Object.keys(optionsByGroup).length) % Object.keys(optionsByGroup).length;
				currentGameIndex = expandedBoxes.has(currentBoxIndex)
					? games.length - 1
					: null;
			}
		}
		else {
			currentBoxIndex = (currentBoxIndex - 1 + Object.keys(optionsByGroup).length) % Object.keys(optionsByGroup).length;
			currentGameIndex = null;
		}
		intendedX = -getCurrentTargetX() + 200;
	}

	function toggleExpandCollapse() {
		if (expandedBoxes.has(currentBoxIndex)) {
			expandedBoxes.delete(currentBoxIndex);
			currentGameIndex = null;
		}
		else {
			expandedBoxes.add(currentBoxIndex);
		}
		calculateLayout();
		intendedX = -getCurrentTargetX() + 200;
	}

	// find the "focus" X position of current selection
	function getCurrentTargetX() {
		const be = boxEntities[currentBoxIndex];
		if (currentGameIndex === null) {
			return be.box.targetX ?? 0;
		}
		return be.games[currentGameIndex].targetX ?? 0;
	}

	// ------------------ Update ------------------
	k.onUpdate(() => {
		// smooth scroll
		menuContainer.pos.x = k.lerp(menuContainer.pos.x, intendedX, 0.1);

		// lerp each item to target
		Object.keys(optionsByGroup).forEach((box, bi) => {
			const boxEnt = boxEntities[bi];
			boxEnt.box.pos.x = k.lerp(boxEnt.box.pos.x, boxEnt.box.targetX, 0.2);

			boxEnt.games.forEach((g, gi) => {
				g.pos.x = k.lerp(g.pos.x, g.targetX, 0.2);
			});
		});
	});

	// ------------------ Input ------------------
	k.onKeyPress("right", () => moveRight());
	k.onKeyPress("left", () => moveLeft());
	k.onKeyPress("enter", () => toggleExpandCollapse());
	k.onKeyPress("space", () => toggleExpandCollapse());

	// ------------------ Init ------------------
	calculateLayout();
	intendedX = 200;
};
