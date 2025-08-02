import k from "../../engine";
import goGame from "../game/GameScene";
import { linearSelectorObj } from "./linearSelector";
import { MenuDefinition, moveToMenu } from "./MenuScene";

export function addButton(text: string, action?: () => void) {
	const l = () => {};
	action = action ?? l;

	const button = k.add([
		k.sprite("ui_button"),
		k.opacity(1),
		k.pos(),
		k.anchor("center"),
		k.area(),
		"button",
		{
			action: action,
			set text(param: string) {
				text = param;
			},

			get text() {
				return text;
			},
		},
	]);

	button.onDraw(() => {
		k.drawText({
			text: text,
			align: "center",
			anchor: "center",
			font: "happy",
			color: k.mulfok.VOID_VIOLET,
		});
	});

	return button;
}

type CoolButton = ReturnType<typeof addButton>;

export const mainMenu: MenuDefinition = (scene, tween) => {
	let selected = false;

	const kaboy = scene.add([
		k.sprite("kaboy"),
		k.pos(-96, 12),
		{
			screen: null as typeof boyScreen,
		},
	]);

	const boyScreen = kaboy.add([
		k.sprite("kaboy_art_storymode", { anim: "idle" }),
		k.pos(144, 97),
		k.scale(4),
		k.opacity(),
	]);

	function consoleLeave() {
		k.tween(kaboy.pos.y, 600, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
	}

	const uiArrow = scene.add([
		k.sprite("ui_arrow"),
		k.pos(),
		k.anchor("center"),
		k.opacity(),
		k.scale(),
	]);

	const INITIAL_X = 627;
	const INITIAL_Y = 220;

	// story
	const storyButton = addButton("Story");
	storyButton.pos = k.vec2(INITIAL_X, INITIAL_Y);
	storyButton.action = () => {
		moveToMenu("story");
		consoleLeave();
	};

	// freeplay
	const freeplayButton = addButton("Freeplay");
	freeplayButton.pos = storyButton.pos.add(0, 100);
	freeplayButton.action = () => {
		// k.debug.log("go freeplay");
	};

	// Extras
	const extrasButton = addButton("Extras");
	extrasButton.pos = freeplayButton.pos.add(0, 100);
	extrasButton.action = () => {
		// k.debug.log("go extras????");
	};

	uiArrow.onUpdate(() => {
		const selectedLeft = manager.getSelected().pos.x - manager.getSelected().width / 2;
		const x = k.wave(selectedLeft - 85, selectedLeft - 50, k.time());
		const y = manager.getSelected().pos.y;
		uiArrow.pos = k.lerp(uiArrow.pos, k.vec2(x, y), 0.5);
	});

	const manager = linearSelectorObj<CoolButton>();
	manager.menuBack = "up";
	manager.menuNext = "down";
	manager.menuSelect = "action";
	manager.menuItems = [storyButton, freeplayButton, extrasButton];

	manager.onUpdate(() => {
		k.get("button").forEach((button: CoolButton, idx) => {
			const isSelected = button == manager.getSelected();

			if (manager.lastInput == "mouse" && button.isHovering()) {
				if (!isSelected) manager.setSelected(button);
				if (k.isButtonPressed("click")) manager.triggerSelect();
			}

			if (isSelected) button.pos.x = k.lerp(button.pos.x, INITIAL_X + 15, 0.5);
			else {
				button.pos.x = k.lerp(button.pos.x, INITIAL_X, 0.5);
			}
		});
	});

	manager.onChange((newSelect, oldSelect) => {
		// TODO: when the game starts newSelect IS storyButton, but for some reason it doesn't highlight, idk why
		newSelect.play("focus");
		oldSelect?.play("blur");

		if (newSelect == storyButton) {
			boyScreen.sprite = "kaboy_art_storymode";
		}
		else if (newSelect == freeplayButton) {}
		else if (newSelect == extrasButton) {}
	});

	manager.onSelect(() => {
		if (selected) return;
		selected = true;
		boyScreen.play("select");
		const l = k.loop(0.1, () => {
			if (boyScreen.opacity == 0.1) boyScreen.opacity = 1;
			else if (boyScreen.opacity == 1) boyScreen.opacity = 0.1;
		});

		k.wait(0.5, () => {
			l.cancel();
		});

		k.wait(1, () => {
			manager.getSelected().action();
		});
	});

	manager.setSelected(storyButton);
};
