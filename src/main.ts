import k from "./engine";
import "./loader";
import "./plugins/cursor";

import "./scenes/FocusScene";
import "./scenes/TitleScene";
import "./scenes/menu/MenuScene";
import "../src/scenes/game/GameScene";

import goGame from "../src/scenes/game/GameScene";

k.setVolume(0.1);
k.setCursor("none");
k.loadRoot("./");

const INITIAL_SCENE = () => {
	// goGame()
	k.go("title");
};

k.onLoad(() => {
	if (k.isFocused()) INITIAL_SCENE();
	else k.go("focus", INITIAL_SCENE);
});
