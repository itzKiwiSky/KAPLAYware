import getGame from "../games/amyspark-ng/get/game";
import spamGame from "../games/amyspark-ng/spam/game";
import kaplayware from "./kaplayware";
import { prepTransition } from "./transitions";

const games = [
	getGame,
	spamGame,
];

const ware = kaplayware(games);
const k = ware.kCtx;

k.scene("focus", () => {
	k.setBackground(k.BLACK);

	k.add([
		k.text("CLICK TO FOCUS"),
		k.pos(k.center()),
		k.anchor("center"),
	]);
});

k.scene("game", () => {
	ware.nextGame();
});

k.scene("gameover", () => {
	k.debug.log(":(");

	k.add([
		k.text("you lost :("),
		k.pos(k.center()),
		k.anchor("center"),
	]);
});

k.onLoad(() => {
	if (k.isFocused()) k.go("game");
	else k.go("focus");
});
