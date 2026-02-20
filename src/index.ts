import type { Plugin } from "vite";

export interface ReloadOnRebuildOptions {
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

function reloadOnRebuild({
  enabled = true,
  mode = "watch",
  fileName = "reload-on-rebuild.js",
  interval = 3000,
  headers = ["etag", "last-modified"],
}: ReloadOnRebuildOptions = {}): Plugin {
  let isWatchMode = false;
  let basePath: string;

  return {
    name: "vite-plugin-reload-on-rebuild",

    configResolved(config) {
      isWatchMode = !!config.build.watch;
      basePath = config.base;
    },

    async generateBundle() {
      if (!enabled) return;
      if (mode === "watch" && !isWatchMode) return;

      this.emitFile({
        type: "asset",
        fileName,
        source: `(function() {
  const headers = ${JSON.stringify(headers.map((h) => h.toLocaleLowerCase().trim()))}
  const savedValues = {}
  async function check() {
    try {
      const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-cache' });

      for (const header of headers) {
        const value = res.headers.get(header)
        if (header in savedValues && savedValues[header] !== value) {
          console.log('[vite-plugin-reload-on-rebuild]', 'Build changed. Reloading...');
          location.reload();
        }
        savedValues[header] = value
      }
    } catch (e) {}
    setTimeout(check, ${interval});
  }
  if (headers.length > 0) check()
})();
`.trim(),
      });
    },

    transformIndexHtml(html) {
      if (!enabled) return;
      if (mode === "watch" && !isWatchMode) return;

      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: `${basePath}${fileName}`,
              id: "vite-plugin-reload-on-rebuild",
              type: "module",
            },
            injectTo: "head",
          },
        ],
      };
    },
  };
}

export { reloadOnRebuild };
