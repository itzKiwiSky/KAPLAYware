import k from "../engine";
import { kaplayware, KAPLAYwareOpts } from "../game/kaplayware";

k.scene("game", (kaplaywareOpt: KAPLAYwareOpts) => {
	const wareEngine = kaplayware(kaplaywareOpt);
	wareEngine.nextGame();

	// TODO: find a way to get paused and set paused from wareEngine
	// TODO: also somthing like wareEngine.onGameOver() so i can do that screen here instead of there

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
