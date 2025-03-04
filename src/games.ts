import connectGame from "../games/amyspark-ng/connect";
import dodgeGame from "../games/amyspark-ng/dodge";
import getGame from "../games/amyspark-ng/get";
import knockGame from "../games/amyspark-ng/knock";
import sortGame from "../games/amyspark-ng/sort";
import spamGame from "../games/amyspark-ng/spam";
import chaseGame from "../games/nanopoison/chase";

const games = [
	getGame,
	spamGame,
	knockGame,
	connectGame,
	chaseGame,
	dodgeGame,
	sortGame,
];

export default games;
