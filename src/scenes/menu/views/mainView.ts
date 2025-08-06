import { GameObj } from "kaplay";
import k from "../../../engine";
import { createView, goView } from "../MenuScene";

export function addButton(parent: GameObj, text: string, action?: () => void) {
	const l = () => {};
	action = action ?? l;

	const button = parent.add([
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

const MAIN_MENU_POS = k.vec2(0, 0);

export const addMainView = () => {
	const p = createView<CoolButton>(MAIN_MENU_POS, "main");

	const kaboy = p.add([
		k.sprite("kaboy"),
		k.pos(-96, 12),
		{
			leave: () => k.tween(kaboy.pos.y, 600, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint),
			screen: null as typeof boyScreen,
		},
	]);

	const boyScreen = kaboy.add([
		k.sprite("kaboy_art_storymode", { anim: "idle" }),
		k.pos(144, 97),
		k.scale(4),
		k.opacity(),
	]);

	const uiArrow = p.add([
		k.sprite("ui_arrow"),
		k.pos(),
		k.anchor("center"),
		k.opacity(),
		k.scale(),
	]);

	const INITIAL_X = 627;
	const INITIAL_Y = 190;

	// story
	const storyButton = addButton(p, "Story");
	storyButton.pos = k.vec2(INITIAL_X, INITIAL_Y);
	storyButton.action = () => {
		kaboy.leave();
		goView("story");
	};

	// freeplay
	const freeplayButton = addButton(p, "Freeplay");
	freeplayButton.pos = storyButton.pos.add(0, 100);
	freeplayButton.action = () => {
		kaboy.leave();
		goView("freeplay");
	};

	// extras
	const extrasButton = addButton(p, "Extras");
	extrasButton.pos = freeplayButton.pos.add(0, 100);
	extrasButton.action = () => {
		// k.debug.log("go extras????");
	};

	// config
	const configButton = addButton(p, "Config");
	configButton.pos = extrasButton.pos.add(0, 100);
	configButton.action = () => {
		// k.debug.log("go config
	};

	uiArrow.onUpdate(() => {
		const selectedLeft = p.getSelected().pos.x - p.getSelected().width / 2;
		const x = k.wave(selectedLeft - 65, selectedLeft - 50, k.time());
		const y = p.getSelected().pos.y;
		uiArrow.pos = k.lerp(uiArrow.pos, k.vec2(x, y), 0.5);
	});

	p.menuBack = "up";
	p.menuNext = "down";
	p.menuSelect = "action";
	p.menuItems = [storyButton, freeplayButton, extrasButton, configButton];

	p.onUpdate(() => {
		if (k.isButtonPressed("return") && !p.selectorPaused) {
			k.go("title");
		}
	});

	p.onUpdate(() => {
		p.get("button").forEach((button: CoolButton, idx) => {
			const isSelected = button == p.getSelected();

			if (button.isHovering() && !p.selectorPaused) {
				if (!isSelected) p.setSelected(button);
				if (k.isButtonPressed("action")) p.triggerSelect();
			}

			if (isSelected) {
				button.pos.x = k.lerp(button.pos.x, INITIAL_X + 15, 0.5);
			}
			else {
				button.pos.x = k.lerp(button.pos.x, INITIAL_X, 0.5);
			}
		});
	});

	p.onChange((newSelect, oldSelect) => {
		oldSelect?.play("blur");
		newSelect.play("focus");

		if (newSelect == storyButton) {
			boyScreen.sprite = "kaboy_art_storymode";
		}
		else if (newSelect == freeplayButton) {
			boyScreen.sprite = "kaboy_art_freeplay";
		}
		else if (newSelect == configButton) {
			boyScreen.sprite = "kaboy_art_config";
		}
		else if (newSelect == extrasButton) {
			boyScreen.sprite = "kaboy_art_extras";
		}
	});

	p.onSelect(() => {
		if (p.selectorPaused) return;
		p.selectorPaused = true;
		boyScreen.play("select");
		const l = k.loop(0.1, () => {
			if (boyScreen.opacity == 0.1) boyScreen.opacity = 1;
			else if (boyScreen.opacity == 1) boyScreen.opacity = 0.1;
		});

		k.wait(0.5, () => {
			l.cancel();
		});

		k.wait(1, () => {
			p.getSelected().action();
		});
	});

	p.setSelected(storyButton);

	p.resetState = () => {
		p.tween(kaboy.pos.y, 12, 0.75, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
		p.wait(0.25, () => p.selectorPaused = false);
	};
};
