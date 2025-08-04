import k from "../../engine";
import { Comp, GameObj, PosComp, TimerComp, Vec2 } from "kaplay";
import { linearSelector, LinearSelectorComp } from "./linearSelector";
import { addMainView } from "./views/mainView";
import { addStoryView } from "./views/storyView";
import { addFreeplayView } from "./views/freeplayView";

interface ViewComp extends Comp {
	viewName: string;
	resetState(): void;
}

type ViewObj<T extends any> = GameObj<PosComp | ViewComp | TimerComp | LinearSelectorComp<T>>;

const views: ViewObj<unknown>[] = [];
const viewPositions: Vec2[] = [];

export function createView<T extends any>(pos: Vec2, name: string): ViewObj<T> {
	function view(pos: Vec2, name: string): ViewComp {
		return {
			resetState: null,
			viewName: name,
			add() {
				viewPositions.push(pos);
				views.push(this);
			},
		};
	}

	const parent = k.add([
		view(pos, name),
		linearSelector<T>(),
		k.pos(pos),
		k.timer(),
	]);

	parent.paused = true;

	return parent;
}

let curCamPos = k.vec2(0);
let curView = 0;

export function goView(viewName: string) {
	views[curView].paused = true;
	curView = views.indexOf(views.find((view) => view.viewName == viewName));
	views[curView].paused = false;
	if (views[curView].resetState) views[curView].resetState();
	curCamPos = viewPositions[curView].clone();
}

k.scene("menu", () => {
	k.setBackground(k.BLACK);
	k.add([k.rect(k.width(), k.height()), k.fixed(), k.color(k.mulfok.DARK_VIOLET)]);

	while (views.length) views.pop();
	while (viewPositions.length) viewPositions.pop();
	curCamPos = k.vec2(0);
	curView = 0;

	k.onUpdate(() => {
		k.setCamPos(k.lerp(k.getCamPos(), k.center().add(curCamPos), 0.5));
	});

	addMainView();
	addStoryView();
	addFreeplayView();
	goView("main");
});
