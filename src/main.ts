import getGame from "../games/amyspark-ng/get/game";
import spamGame from "../games/amyspark-ng/spam/game";
import kaplayware from "./kaplayware";

const games = [
	getGame,
	spamGame,
];

const ware = kaplayware(games);
const k = ware.kCtx;
ware.runGame(games[0]).start();

// TODO: Move all to a scene so i can make a game over scene
// k.scene("game", () => {
// 	ware.runGame(games[0]);
// });

// k.go("game");
