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
		k.opacity(1),
		k.rotate(),
		k.z(1),
		"box",
		{
			isOpen: false,
			text: text,
			cartridges: [] as CartridgeObject[],
			intendedX: k.center().x,
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
		k.pos(k.center().x, k.center().y),
		k.scale(),
		k.opacity(),
		k.rotate(),
		k.area(),
		k.z(0),
		"game",
		{
			game: game,
			intendedX: k.center().x,
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
	p.selectorPaused = false;
	p.menuBack = "left";
	p.menuNext = "right";
	p.menuSelect = "action";

	let currentGroup: PossibleGroups = "pack";
	function changeGroup(newGroup = currentGroup) {
		const boxes = p.get("box");
		const optionsByGroup = getOptionsByGroup(newGroup);

		if (boxes.length == 0) {
			Object.keys(optionsByGroup).forEach((key, index) => {
				const box = addBox(key, p);
				const games = optionsByGroup[key] as Microgame[];
				games.forEach((g, index) => {
					const cartridge = addCartridge(g, p);
					box.cartridges[index] = cartridge;
				});
			});

			// nice lerp where index is the index in array and p.index is the scrolling index
			// packObj.intendedX = k.center().x + packObj.width * 1.5 * (index - p.index);

			const boxes = p.get("box") as BoxObject[];
			p.menuItems = boxes;
			p.onUpdate(() => {
				boxes.forEach((box, boxIndex) => {
					const boxX = k.center().x + box.width * 1.5 * (boxIndex - p.index);
					box.pos.x = k.lerp(box.pos.x, boxX, 0.5);

					box.cartridges.forEach((cart, cartIndex) => {
						if (!box.isOpen) cart.pos.x = k.lerp(cart.pos.x, box.pos.x, 0.5);
						else {
							// box is open
							const cartX = k.center().x + cart.width * 1.5 * (cartIndex - p.index);
							cart.pos.x = k.lerp(cart.pos.x, cartX, 0.5);
						}
					});

					if (k.isButtonPressed("action")) {
						boxes.forEach((box) => box.isOpen = false);
						box.isOpen = true;
					}
				});
			});

			return;
		}
	}

	// kickstarts the adding of the boxes
	changeGroup();
};
