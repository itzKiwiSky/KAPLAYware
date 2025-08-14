import k from "../../engine";
import { addMainView } from "./views/mainView";
import { addStoryView } from "./views/storyView";
import { goView, setupView, ViewObj, views } from "./views/viewManager";

k.scene("menu", (initialView = "story") => {
	k.setBackground(k.BLACK);
	k.add([k.rect(k.width(), k.height()), k.fixed(), k.color(k.mulfok.DARK_VIOLET)]);
	while (views.length) views.pop();

	addMainView(initialView == "main");
	addStoryView(initialView == "story");
	goView(initialView);

	setupView(initialView);
});
