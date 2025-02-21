import kaplay, { GameObj, KAPLAYCtx } from "kaplay";

export function addHeart() {
}

export function winTransition(transition: GameObj<any>, hearts: GameObj<any>[]) {
}

export function changeTransition(k: KAPLAYCtx, transition: GameObj<any>, transitionFunc: (transition: GameObj<any>, hearts: GameObj<any>[]) => void) {
	transition.removeAll();
}
