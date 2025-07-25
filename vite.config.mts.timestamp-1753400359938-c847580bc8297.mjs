// vite.config.mts
import { defineConfig } from "file:///C:/Users/User/Desktop/KAPLAYware/node_modules/.pnpm/vite@5.4.19_terser@5.43.1/node_modules/vite/dist/node/index.js";
import { viteSingleFile } from "file:///C:/Users/User/Desktop/KAPLAYware/node_modules/.pnpm/vite-plugin-singlefile@2.3._44dc711513fc88384cb489b097a9ae18/node_modules/vite-plugin-singlefile/dist/esm/index.js";
import { DynamicPublicDirectory } from "file:///C:/Users/User/Desktop/KAPLAYware/node_modules/.pnpm/vite-multiple-assets@2.2.5__e14b00e354038439ab191c8a2f9aff30/node_modules/vite-multiple-assets/dist/index.mjs";
var vite_config_default = defineConfig(async ({ mode }) => ({
  plugins: [
    viteSingleFile(),
    DynamicPublicDirectory(["assets/**/*", {
      input: "games/**",
      output: "games"
    }], {
      ignore: ["**/*.ts"]
    }),
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
                  src: "%PUBLIC_URL%/__neutralino_globals.js"
                },
                injectTo: "head-prepend"
              },
              {
                tag: "script",
                attrs: {
                  type: "module",
                  src: "./src/desktop.ts"
                },
                injectTo: "body-prepend"
              }
            ]
          };
        },
        order: "pre"
      }
    }
  ],
  server: {
    allowedHosts: true,
    hmr: {
      overlay: false,
      middlewareMode: false
    },
    port: 8e3
  },
  publicDir: false,
  assetsInclude: [],
  build: {
    minify: "terser",
    chunkSizeWarningLimit: 1e4,
    sourcemap: "hidden"
    // Makes it so code is obstructed on release,
  },
  define: {
    DEV_MICROGAME: process.env.DEV_MICROGAME,
    DEV_SPEED: process.env.DEV_SPEED,
    DEV_DIFFICULTY: process.env.DEV_DIFFICULTY
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVXNlclxcXFxEZXNrdG9wXFxcXEtBUExBWXdhcmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFVzZXJcXFxcRGVza3RvcFxcXFxLQVBMQVl3YXJlXFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvVXNlci9EZXNrdG9wL0tBUExBWXdhcmUvdml0ZS5jb25maWcubXRzXCI7Ly8gQHRzLW5vY2hlY2tcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHsgdml0ZVNpbmdsZUZpbGUgfSBmcm9tIFwidml0ZS1wbHVnaW4tc2luZ2xlZmlsZVwiO1xyXG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1zdGF0aWMtY29weVwiO1xyXG5pbXBvcnQgeyBEeW5hbWljUHVibGljRGlyZWN0b3J5IH0gZnJvbSBcInZpdGUtbXVsdGlwbGUtYXNzZXRzXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoYXN5bmMgKHsgbW9kZSB9KSA9PiAoe1xyXG5cdHBsdWdpbnM6IFtcclxuXHRcdHZpdGVTaW5nbGVGaWxlKCksXHJcblx0XHREeW5hbWljUHVibGljRGlyZWN0b3J5KFtcImFzc2V0cy8qKi8qXCIsIHtcclxuXHRcdFx0aW5wdXQ6IFwiZ2FtZXMvKipcIixcclxuXHRcdFx0b3V0cHV0OiBcImdhbWVzXCIsXHJcblx0XHR9XSwge1xyXG5cdFx0XHRpZ25vcmU6IFtcIioqLyoudHNcIl0sXHJcblx0XHR9KSBhcyBQbHVnaW5PcHRpb24sXHJcblx0XHR7XHJcblx0XHRcdG5hbWU6IFwia2FwbGF5d2FyZS1wbHVnaW5cIixcclxuXHRcdFx0dHJhbnNmb3JtSW5kZXhIdG1sOiB7XHJcblx0XHRcdFx0aGFuZGxlcigpIHtcclxuXHRcdFx0XHRcdGlmIChtb2RlICE9PSBcImRlc2t0b3BcIikgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdHRhZ3M6IFtcclxuXHRcdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0XHR0YWc6IFwic2NyaXB0XCIsXHJcblx0XHRcdFx0XHRcdFx0XHRhdHRyczoge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRzcmM6IFwiJVBVQkxJQ19VUkwlL19fbmV1dHJhbGlub19nbG9iYWxzLmpzXCIsXHJcblx0XHRcdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHRcdFx0aW5qZWN0VG86IFwiaGVhZC1wcmVwZW5kXCIsXHJcblx0XHRcdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0XHR0YWc6IFwic2NyaXB0XCIsXHJcblx0XHRcdFx0XHRcdFx0XHRhdHRyczoge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR0eXBlOiBcIm1vZHVsZVwiLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRzcmM6IFwiLi9zcmMvZGVza3RvcC50c1wiLFxyXG5cdFx0XHRcdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdFx0XHRcdGluamVjdFRvOiBcImJvZHktcHJlcGVuZFwiLFxyXG5cdFx0XHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRcdF0sXHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b3JkZXI6IFwicHJlXCIsXHJcblx0XHRcdH0sXHJcblx0XHR9LFxyXG5cdF0sXHJcblx0c2VydmVyOiB7XHJcblx0XHRhbGxvd2VkSG9zdHM6IHRydWUsXHJcblx0XHRobXI6IHtcclxuXHRcdFx0b3ZlcmxheTogZmFsc2UsXHJcblx0XHRcdG1pZGRsZXdhcmVNb2RlOiBmYWxzZSxcclxuXHRcdH0sXHJcblx0XHRwb3J0OiA4MDAwLFxyXG5cdH0sXHJcblx0cHVibGljRGlyOiBmYWxzZSxcclxuXHRhc3NldHNJbmNsdWRlOiBbXSxcclxuXHRidWlsZDoge1xyXG5cdFx0bWluaWZ5OiBcInRlcnNlclwiLFxyXG5cdFx0Y2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwMCxcclxuXHRcdHNvdXJjZW1hcDogXCJoaWRkZW5cIiwgLy8gTWFrZXMgaXQgc28gY29kZSBpcyBvYnN0cnVjdGVkIG9uIHJlbGVhc2UsXHJcblx0fSxcclxuXHRkZWZpbmU6IHtcclxuXHRcdERFVl9NSUNST0dBTUU6IHByb2Nlc3MuZW52LkRFVl9NSUNST0dBTUUsXHJcblx0XHRERVZfU1BFRUQ6IHByb2Nlc3MuZW52LkRFVl9TUEVFRCxcclxuXHRcdERFVl9ESUZGSUNVTFRZOiBwcm9jZXNzLmVudi5ERVZfRElGRklDVUxUWSxcclxuXHR9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLHNCQUFzQjtBQUUvQixTQUFTLDhCQUE4QjtBQUd2QyxJQUFPLHNCQUFRLGFBQWEsT0FBTyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ2hELFNBQVM7QUFBQSxJQUNSLGVBQWU7QUFBQSxJQUNmLHVCQUF1QixDQUFDLGVBQWU7QUFBQSxNQUN0QyxPQUFPO0FBQUEsTUFDUCxRQUFRO0FBQUEsSUFDVCxDQUFDLEdBQUc7QUFBQSxNQUNILFFBQVEsQ0FBQyxTQUFTO0FBQUEsSUFDbkIsQ0FBQztBQUFBLElBQ0Q7QUFBQSxNQUNDLE1BQU07QUFBQSxNQUNOLG9CQUFvQjtBQUFBLFFBQ25CLFVBQVU7QUFDVCxjQUFJLFNBQVMsVUFBVztBQUV4QixpQkFBTztBQUFBLFlBQ04sTUFBTTtBQUFBLGNBQ0w7QUFBQSxnQkFDQyxLQUFLO0FBQUEsZ0JBQ0wsT0FBTztBQUFBLGtCQUNOLEtBQUs7QUFBQSxnQkFDTjtBQUFBLGdCQUNBLFVBQVU7QUFBQSxjQUNYO0FBQUEsY0FDQTtBQUFBLGdCQUNDLEtBQUs7QUFBQSxnQkFDTCxPQUFPO0FBQUEsa0JBQ04sTUFBTTtBQUFBLGtCQUNOLEtBQUs7QUFBQSxnQkFDTjtBQUFBLGdCQUNBLFVBQVU7QUFBQSxjQUNYO0FBQUEsWUFDRDtBQUFBLFVBQ0Q7QUFBQSxRQUNEO0FBQUEsUUFDQSxPQUFPO0FBQUEsTUFDUjtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDUCxjQUFjO0FBQUEsSUFDZCxLQUFLO0FBQUEsTUFDSixTQUFTO0FBQUEsTUFDVCxnQkFBZ0I7QUFBQSxJQUNqQjtBQUFBLElBQ0EsTUFBTTtBQUFBLEVBQ1A7QUFBQSxFQUNBLFdBQVc7QUFBQSxFQUNYLGVBQWUsQ0FBQztBQUFBLEVBQ2hCLE9BQU87QUFBQSxJQUNOLFFBQVE7QUFBQSxJQUNSLHVCQUF1QjtBQUFBLElBQ3ZCLFdBQVc7QUFBQTtBQUFBLEVBQ1o7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNQLGVBQWUsUUFBUSxJQUFJO0FBQUEsSUFDM0IsV0FBVyxRQUFRLElBQUk7QUFBQSxJQUN2QixnQkFBZ0IsUUFBUSxJQUFJO0FBQUEsRUFDN0I7QUFDRCxFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
