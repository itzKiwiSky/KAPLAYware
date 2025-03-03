import { assets } from "@kaplayjs/crew";
import k from "../engine";

type Friend = keyof typeof assets | `${keyof typeof assets}-o`;
type AtFriend = `@${Friend}`;

type CustomSprite<T extends string> = T extends AtFriend ? AtFriend : string;

export function wareSprite(spr: CustomSprite<string>) {
	return k.sprite(spr);
}

export function spriteCompPlugin() {
	return {
		wareSprite,
	};
}
