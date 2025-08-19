import k from "../../engine";
import { addFreeplayView } from "./views/freeplay/freeplayView";
import { addMainView } from "./views/mainView";
import { addStoryView } from "./views/storyView";
import { goView, setupViews, views } from "./views/viewManager";

k.scene("menu", (initialView = "freeplay") => {
	k.setBackground(k.BLACK);
	k.add([k.rect(k.width(), k.height()), k.fixed(), k.color(k.mulfok.DARK_VIOLET)]);
	while (views.length) views.pop();

	addMainView(initialView == "main");
	addStoryView(initialView == "story");
	addFreeplayView(initialView == "freeplay");
	goView(initialView);

	setupViews(initialView);
});

const goMenu = (initialView: string) => k.go("menu", initialView);
export default goMenu;
