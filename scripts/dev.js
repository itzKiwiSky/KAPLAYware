import { spawn } from "child_process";

const args = process.argv.slice(2);

// Default values
let author = null;
let gameId = null;

const color = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	cyan: '\x1b[36m',
	yellow: '\x1b[33m',
	green: '\x1b[32m',
};

// check if the first argument is a game id
let flagsStartIndex = 0;
if (args[0] && !args[0].startsWith('--') && args[0].includes(':')) {
	const [maybeAuthor, maybeGameId] = args[0].split(':');
	if (!maybeAuthor || !maybeGameId) {
		console.error(`${color.red}❌ If you're using author:gameId, both parts must be present (eg: lajbel:work) ${color.reset}`);
		process.exit(1);
	}
	author = maybeAuthor;
	gameId = maybeGameId;
	flagsStartIndex = 1;
}

// parse flags
const flags = {};
args.slice(flagsStartIndex).forEach(arg => {
	if (arg.startsWith('--')) {
		const [key, value = true] = arg.slice(2).split('=');
		flags[key] = value;
	}
});

// make it so we don't get incompatible flags
if (flags.recordInput) {
	if (!author || !gameId) {
		console.error(`${color.red}❌ --recordInput requires a valid author:gameId as the first argument.${color.reset}`);
		process.exit(1);
	}
	if (flags.speed || flags.difficulty) {
		console.error(`${color.red}❌ --recordInput cannot be used with --speed or --difficulty.${color.reset}`);
		process.exit(1);
	}
}

// do speed
if (flags.speed !== undefined) {
	const speedNum = Number(flags.speed);
	if (isNaN(speedNum)) {
		console.error('--speed must be a valid number');
		process.exit(1);
	}
	flags.speed = speedNum;
}

// do difficulty
if (flags.difficulty !== undefined) {
	const difficultyNum = Number(flags.difficulty);
	if (
		isNaN(difficultyNum) ||
		difficultyNum < 1 ||
		difficultyNum > 3 ||
		!Number.isInteger(difficultyNum)
	) {
		console.error(`${color.red}❌ --difficulty must be an integer between 1 and 3${color.reset}`);
		process.exit(1);
	}
	flags.difficulty = difficultyNum;
}

if (author && gameId) {
	if (flags.recordInput) {
		console.log(`${color.green}🎥 Recording inputs for microgame: ${author}:${gameId}${color.reset}`);
	}

	else {
		let extraInfo = '';
		if (flags.speed !== undefined) {
			extraInfo += ` | speed: ${flags.speed}`;
		}
		if (flags.difficulty !== undefined) {
			extraInfo += ` | difficulty: ${flags.difficulty}`;
		}

		console.log(`${color.cyan}🚀 Running microgame: ${author}:${gameId}${extraInfo}${color.reset}`);
	}
}

process.env.DEV_MICROGAME = author && gameId ? `"${author}:${gameId}"` : undefined
process.env.DEV_SPEED = flags.speed ?? undefined
process.env.DEV_DIFFICULTY = flags.difficulty ?? undefined
process.env.DEV_RECORDINPUT = flags.recordInput ?? undefined

spawn(
	"vite",
	[...process.argv.slice(author && gameId ? 5 : 4)],
	{ shell: true, stdio: "inherit" },
);
