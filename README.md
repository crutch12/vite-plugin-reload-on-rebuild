# vite-plugin-reload-on-rebuild

```bash
npm install vite-plugin-reload-on-rebuild --save-dev
```

`vite-plugin-reload-on-rebuild` plugin adds `reload-on-rebuild.js` script on the page which polls `window.location.href` and reloads the page if `etag` or `last-modified` headers are changed.

## Usage

Add `vite-plugin-reload-on-rebuild` plugin to your project:

```bash
npm install vite-plugin-reload-on-rebuild --save-dev
```

Use it as a `vite` plugin:

```js
// vite.config.js
import { defineConfig } from "vite";
import { reloadOnRebuild } from "vite-plugin-reload-on-rebuild";

export default defineConfig({
  plugins: [reloadOnRebuild()],
});
```

Run `vite build` in `watch` mode:

```bash
npx vite build -w
```

Change the source code and see how your page reloads 🚀

## Options

```ts
interface ReloadOnRebuildOptions {
  /**
   * Is plugin enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Should plugin work only in "watch" mode (detect "vite build --watch") or "always"
   * @default "watch"
   */
  mode?: "watch" | "always";
  /**
   * Filename for emitted asset script
   * @default "reload-on-rebuild.js"
   */
  fileName?: string;
  /**
   * Poll interval (ms)
   * @default 3000
   */
  interval?: number;
  /**
   * List of headers that should be checked
   * @default - ["etag", "last-modified"]
   */
  headers?: string[];
}
```
