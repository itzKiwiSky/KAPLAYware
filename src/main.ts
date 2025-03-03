import k from "./engine";
import "./loader";
import "./plugins/cursor";

import connectGame from "../games/amyspark-ng/connect";
import dodgeGame from "../games/amyspark-ng/dodge";
import getGame from "../games/amyspark-ng/get";
import knockGame from "../games/amyspark-ng/knock";
import sortGame from "../games/amyspark-ng/sort";
import spamGame from "../games/amyspark-ng/spam";
import chaseGame from "../games/nanopoison/chase";
import kaplayware from "./kaplayware";

const games = [
	getGame,
	spamGame,
	knockGame,
	connectGame,
	chaseGame,
	dodgeGame,
	sortGame,
];

k.setCursor("none");

k.scene("focus", () => {
	k.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLACK),
	]);

	k.add([
		k.text("CLICK TO FOCUS"),
		k.pos(k.center()),
		k.anchor("center"),
	]);

	k.onClick(() => k.go("game"));
});

k.scene("game", () => {
	const ware = kaplayware(games, { onlyMouse: true });
	ware.nextGame();
});

k.scene("gameover", () => {
	k.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLACK),
	]);

	k.add([
		k.text("you lost :("),
		k.pos(k.center()),
		k.anchor("center"),
	]);

	k.onClick(() => k.go("game"));
	k.onKeyPress("space", () => k.go("game"));
});

k.onLoad(() => {
	if (k.isFocused()) k.go("game");
	else k.go("focus");
});
