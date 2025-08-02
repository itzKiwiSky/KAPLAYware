import { ButtonBindingDevice, GameObj } from "kaplay";
import { k } from "../../engine";
import cursor from "../../plugins/cursor";

type TButton = "up" | "down" | "left" | "right" | "action" | "click";

export function linearSelectorObj<T extends any>(parent?: GameObj) {
	const linearSelector = (parent ?? k.getTreeRoot()).add([
		{
			index: 0,
			menuItems: [] as T[],
			menuNext: null as TButton,
			menuBack: null as TButton,
			menuSelect: null as TButton,
			lastInput: undefined as ButtonBindingDevice,
			triggerSelect() {
				selectOption();
			},

			setSelected(newSelected: T) {
				const lastSelection = linearSelector.getSelected();
				linearSelector.index = linearSelector.menuItems.indexOf(newSelected);
				linearSelector.trigger("change", linearSelector.getSelected(), lastSelection);
			},
			getSelected(): T {
				return linearSelector.menuItems[linearSelector.index];
			},
			onChange: (action: (newSelect: T, beforeSelect: T) => void) => {
				linearSelector.on("change", (newSelect, beforeSelect) => action(newSelect, beforeSelect));
			},
			onSelect: (action: () => void) => linearSelector.on("select", () => action()),
		},
	]);

	function moveNext() {
		const lastSelection = linearSelector.getSelected();
		linearSelector.index = (linearSelector.index + 1)
			% linearSelector.menuItems.length;
		linearSelector.trigger(
			"change",
			linearSelector.getSelected(),
			lastSelection,
		);
	}

	function moveBack() {
		const lastSelection = linearSelector.getSelected();
		linearSelector.index = (linearSelector.index - 1
			+ linearSelector.menuItems.length)
			% linearSelector.menuItems.length;

		linearSelector.trigger("change", linearSelector.getSelected(), lastSelection);
	}

	function selectOption() {
		linearSelector.trigger(
			"select",
			linearSelector.menuItems[linearSelector.index],
		);
	}

	linearSelector.onMouseMove(() => {
		linearSelector.lastInput = "mouse";
	});

	linearSelector.onKeyPress(() => {
		linearSelector.lastInput = "keyboard";
	});

	linearSelector.onUpdate(() => {
		if (linearSelector.lastInput == "mouse") cursor.opacity = k.lerp(cursor.opacity, 1, 0.25);
		else cursor.opacity = k.lerp(cursor.opacity, 0, 0.25);

		if (k.isButtonPressed(linearSelector.menuBack)) moveBack();
		else if (k.isButtonPressed(linearSelector.menuNext)) moveNext();
		else if (k.isButtonPressed(linearSelector.menuSelect)) selectOption();
	});

	return linearSelector;
}
