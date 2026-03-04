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
  /**
   * Processes css file only if it's path matches provided filter
   * @example (path) => Boolean(path.match(/src[\\/]index\.html/))
   * @default () => true
   */
  filter?: (path: string) => boolean;
}

function reloadOnRebuild({
  enabled = true,
  mode = "watch",
  fileName = "reload-on-rebuild.js",
  interval = 3000,
  headers = ["etag", "last-modified"],
  filter = () => true,
}: ReloadOnRebuildOptions = {}): Plugin {
  let isWatchMode = false;
  let basePath: string;

  return {
    name: "vite-plugin-reload-on-rebuild",

    apply: "build",

    configResolved(config) {
      isWatchMode = !!config.build.watch;
      basePath = config.base;
    },

    async generateBundle(ctx) {
      if (!enabled) return;
      if (mode === "watch" && !isWatchMode) return;

      this.emitFile({
        type: "asset",
        fileName,
        source: `(function() {
  const headers = ${JSON.stringify(headers.map((h) => h.toLocaleLowerCase().trim()))}
  const savedValues = {}
  let savedContent = undefined
  async function check() {
    try {
      const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-cache' });

      if (res.status >= 500) return;

      for (const header of headers) {
        const value = res.headers.get(header)
        if (header in savedValues && savedValues[header] !== value) {
          console.log('[vite-plugin-reload-on-rebuild]', 'Header changed:', header, '(' + value + ').', 'Reloading...');
          location.reload();
        }
        savedValues[header] = value
      }
      // All provided headers are empty, try to check body next time
      if (Object.values(savedValues).filter(x => x != null && x != '').length === 0) {
        const contentRes = await fetch(window.location.href, { method: 'GET', cache: 'no-cache' });
        if (contentRes.status >= 500) return;
        const content = await contentRes.text();
        if (savedContent && content !== savedContent) {
          console.log('[vite-plugin-reload-on-rebuild]', 'Text content changed.', 'Reloading...');
          location.reload();
        }
        savedContent = content
      }
    } catch (e) {}
    setTimeout(check, ${interval});
  }
  if (headers.length > 0) check()
})();
`.trim(),
      });
    },

    transformIndexHtml(html, ctx) {
      if (!enabled) return;
      if (mode === "watch" && !isWatchMode) return;
      if (!filter(ctx.path)) return;

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
