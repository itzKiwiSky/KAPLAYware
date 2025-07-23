// @ts-nocheck
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { DynamicPublicDirectory } from "vite-multiple-assets";

// TODO: Remove Tauri related stuff.

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
	plugins: [
		viteSingleFile(),
		DynamicPublicDirectory(["assets/**/*", {
			input: "games/**",
			output: "games",
		}], {
			ignore: ["**/*.ts"],
		}) as PluginOption,
		{
			name: "kaplayware-plugin",
			transformIndexHtml: {
				handler() {
					if (mode !== "desktop") return;

					return {
						tags: [
							{
								tag: "script",
								attrs: {
									src: "%PUBLIC_URL%/__neutralino_globals.js",
								},
								injectTo: "head-prepend",
							},
							{
								tag: "script",
								attrs: {
									type: "module",
									src: "./src/desktop.ts",
								},
								injectTo: "body-prepend",
							},
						],
					};
				},
				order: "pre",
			},
		},
	],
	server: {
		allowedHosts: true,
		hmr: {
			overlay: false,
			middlewareMode: false,
		},
		port: 8000,
	},
	publicDir: false,
	assetsInclude: [],
	build: {
		minify: "terser",
		chunkSizeWarningLimit: 10000,
		sourcemap: "hidden", // Makes it so code is obstructed on release,
	},
	define: {
		DEV_MICROGAME: process.env.DEV_MICROGAME,
		DEV_SPEED: process.env.DEV_SPEED,
		DEV_DIFFICULTY: process.env.DEV_DIFFICULTY,
	},
}));
