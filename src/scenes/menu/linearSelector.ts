import { ButtonBindingDevice, Comp, GameObj, KEventController } from "kaplay";
import { k } from "../../engine";
import { TButton } from "../../main";

export interface LinearSelectorComp<T extends any> extends Comp {
	selectorPaused: boolean;
	index: number;
	menuItems: T[];
	menuNext: TButton;
	menuBack: TButton;
	menuSelect: TButton;
	triggerSelect(): void;
	setSelected(newSelect: T): void;
	getSelected(): T;
	onChange(action: (newSelect: T, oldSelect: T) => void): KEventController;
	onSelect(action: () => void): KEventController;
}

export function linearSelector<T extends any>(): LinearSelectorComp<T> {
	let obj = null;

	let lastSelection: T = null;

	function moveNext() {
		lastSelection = obj.getSelected();
		obj.index = (obj.index + 1)
			% obj.menuItems.length;
		obj.trigger(
			"change",
			obj.getSelected(),
			lastSelection,
		);
	}

	function moveBack() {
		lastSelection = obj.getSelected();
		obj.index = (obj.index - 1
			+ obj.menuItems.length)
			% obj.menuItems.length;

		obj.trigger("change", obj.getSelected(), lastSelection);
	}

	function selectOption() {
		obj.trigger(
			"select",
			obj.menuItems[obj.index],
		);
	}

	return {
		selectorPaused: false,
		index: 0,
		menuItems: [],
		menuNext: undefined,
		menuBack: undefined,
		menuSelect: undefined,
		add() {
			obj = this;
		},

		triggerSelect() {
			selectOption();
		},

		setSelected(newSelect) {
			lastSelection = this.getSelected();
			this.index = this.menuItems.indexOf(newSelect);

			this.trigger("change", this.getSelected(), lastSelection);
		},

		getSelected() {
			return this.menuItems[this.index];
		},

		onChange(action) {
			return this.on("change", action);
		},

		onSelect(action) {
			return this.on("select", action);
		},

		update() {
			if (this.selectorPaused) return;
			if (k.isButtonPressed(this.menuBack)) moveBack();
			else if (k.isButtonPressed(this.menuNext)) moveNext();
			else if (k.isButtonPressed(this.menuSelect)) selectOption();
		},
	};
}
