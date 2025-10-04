import { filesystem, init } from "@neutralinojs/lib";

init();

const loadMods = async () => {
	try {
		let entries = await filesystem.readDirectory(window.NL_PATH + "/mods/microgames/");

		for (const entry of entries) {
			if (entry.type != "DIRECTORY") return;

			const customMicrogamesDirs = await filesystem.readDirectory(entry.path);

			for (const microgameFolder of customMicrogamesDirs) {
				const microgameMain = await filesystem.readFile(microgameFolder.path + "/main.js");
				const microgameData = await import(
					/* @vite-ignore */
					`data:text/javascript, ${microgameMain}`
				);
				window.microgames.push(microgameData.default);
			}
		}
	}
	catch (e) {
		console.error("Error loading mods", e);
	}
};

if (window.NL_OS) {
	loadMods();
}
