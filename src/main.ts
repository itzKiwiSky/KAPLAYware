import k from "./engine";
import "./loading/loader";
import "./plugins/cursor";

import "./scenes/FocusScene";
import "./scenes/TitleScene";
import "./scenes/menu/MenuScene";
import "../src/scenes/game/GameScene";

import goGame from "../src/scenes/game/GameScene";
import goMenu from "./scenes/menu/MenuScene";

/** The available buttons in the kaplay button definition */
export type TButton = "up" | "down" | "left" | "right" | "action";

k.setVolume(0.5);
k.setCursor("none");
k.loadRoot("./");
window.freeplayPreviewData = {};

const INITIAL_SCENE = () => {
	if (window.DEV_MICROGAME) goGame();
	else goMenu("main");
};

k.onLoad(() => {
	if (k.isFocused()) INITIAL_SCENE();
	else k.go("focus", INITIAL_SCENE);
});
