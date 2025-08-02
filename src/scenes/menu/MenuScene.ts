import { GameObj, PosComp, TimerComp, TimerController, Vec2 } from "kaplay";
import k from "../../engine";
import { mainMenu } from "./mainMenu";
import { storyMenu } from "./storyMenu";

// TODO: this is already looking kinda big and there's LOOOOTS of stuff that will happen here
// figure out a way to separate it in different files and such, yeah

export type MenuDefinition = (scene: GameObj<PosComp | TimerComp>, tween: TimerController) => void;

const menus = {
	"main": { pos: k.vec2(), sceneContent: mainMenu },
	"story": { pos: k.vec2(800, -600), sceneContent: storyMenu },
} as const satisfies Record<string, { pos: Vec2; sceneContent: MenuDefinition; }>;

// make it so moveToMenu creates an object in the correctp osition and its passed to the function

export function moveToMenu(menuKey: keyof typeof menus) {
	const oldScene = k.get("menu_scene")[0];
	const newScene = k.add([k.pos(menus[menuKey].pos), k.timer(), "menu_scene", menuKey]);
	const tween = k.tween(k.getCamPos(), newScene.pos.add(k.center()), 0.5, (p) => k.setCamPos(p), k.easings.easeOutQuint);
	menus[menuKey].sceneContent(newScene, tween);
	tween.onEnd(() => oldScene?.destroy());

	return tween;
}

k.scene("menu", () => {
	k.setBackground(k.BLACK);
	k.add([k.rect(k.width(), k.height()), k.fixed(), k.color(k.mulfok.DARK_VIOLET)]);

	moveToMenu("main");
	k.setCamScale(0.5);
});
