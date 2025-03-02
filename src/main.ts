import getGame from "../games/amyspark-ng/get";
import knockGame from "../games/amyspark-ng/knock";
import spamGame from "../games/amyspark-ng/spam";
import chaseGame from "../games/nanopoison/chase";
import kaplayware from "./kaplayware";

const games = [
	getGame,
	// spamGame,
	knockGame,
	chaseGame,
];

const ware = kaplayware(games);
const k = ware.kCtx;

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
	ware.reset();
	ware.nextGame();
});

k.scene("gameover", () => {
	k.add([
		k.text("you lost :("),
		k.pos(k.center()),
		k.anchor("center"),
	]);

	k.onClick(() => k.go("game"));
});

k.onLoad(() => {
	if (k.isFocused()) k.go("game");
	else k.go("game");
});
