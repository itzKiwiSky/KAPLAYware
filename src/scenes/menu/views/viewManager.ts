import { Comp, GameObj, KEventController, PosComp, TimerComp, Vec2 } from "kaplay";
import { linearSelector, LinearSelectorComp } from "../linearSelector";
import k from "../../../engine";

interface ViewComp extends Comp {
	isActive: boolean;
	viewName: string;
	/** Runs when the view is "reset" or after you enter it */
	onEnter(action: () => void): KEventController;
	/** Runs when the view is exited */
	onExit(action: () => void): KEventController;
}

export type ViewObj<T extends any> = GameObj<PosComp | ViewComp | TimerComp | LinearSelectorComp<T>>;

export const views: ViewObj<unknown>[] = [];
let curCamPos = k.center();
let curView = 0;

export function createView<T extends any>(pos: Vec2, name: string): ViewObj<T> {
	function view(name: string): ViewComp {
		return {
			id: "view",
			isActive: false,
			viewName: name,
			add() {
				views.push(this);
			},
			onEnter(action) {
				return this.on("viewEnter", action);
			},
			onExit(action) {
				return this.on("viewExit", action);
			},
		};
	}

	const parent = k.add([
		view(name),
		linearSelector<T>(),
		k.pos(pos),
		k.timer(),
	]);

	parent.trigger("viewCreate");

	return parent;
}

export function goView(viewName: string) {
	if (!views.some((v) => v.viewName == viewName)) k.throwError("MenuScene, you're trying to enter a view that doesn't exist! You tried: " + viewName);
	views[curView].isActive = false;
	curView = views.indexOf(views.find((view) => view.viewName == viewName));
	views[curView].isActive = true;
	views[curView].trigger("viewEnter");
	curCamPos = views.map((view) => view.pos)[curView].clone();
}

export function setupViews(initialView: string) {
	curView = views.indexOf(views.find((v) => v.viewName == initialView));
	curCamPos = views[curView].pos;
	k.setCamPos(k.center().add(curCamPos));

	k.onUpdate(() => {
		k.setCamPos(k.lerp(k.getCamPos(), k.center().add(curCamPos), 0.5));
	});
}
