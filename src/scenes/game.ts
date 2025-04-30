import k from "../engine";
import { createGameCtx } from "../game/context";
import games from "../game/games";
import kaplayware, { createWareApp } from "../game/kaplayware";
import { createPreviewWare } from "../game/preview";
import { KAPLAYwareOpts } from "../game/types";

k.scene("game", (kaplaywareOpt: KAPLAYwareOpts) => {
	// const preview = createPreviewWare();
	// preview.runGame(games[0]);

	const ware = kaplayware(kaplaywareOpt);
	ware.nextGame();

	// let transitionOpacity = 0;
	// k.onUpdate(() => {
	// 	if (k.isKeyPressed("escape")) ware.paused = !ware.paused;
	// 	transitionOpacity = k.lerp(transitionOpacity, ware.paused ? 1 : 0, 0.75);
	// });

	// k.onDraw(() => {
	// 	if (ware.paused) {
	// 		k.drawRect({
	// 			width: k.width(),
	// 			height: k.height(),
	// 			fixed: true,
	// 			color: k.BLACK,
	// 			opacity: 0.75 * transitionOpacity,
	// 		});

	// 		k.drawText({
	// 			text: "PAUSED",
	// 			pos: k.center(),
	// 			anchor: "center",
	// 			align: "center",
	// 			opacity: transitionOpacity,
	// 		});
	// 	}
	// });
});

const goGame = (opts?: KAPLAYwareOpts) => k.go("game", opts);
export default goGame;
