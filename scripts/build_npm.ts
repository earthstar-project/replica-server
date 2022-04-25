import { build, emptyDir } from "https://deno.land/x/dnt@0.22.0/mod.ts";

await emptyDir("npm");

await build({
  entryPoints: ["./mod.node.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
    weakRef: true,
    timers: true,
    custom: [
      {
        package: {
          name: "node-fetch",
          version: "2.6.6",
        },
        typesPackage: {
          name: "@types/node-fetch",
          version: "2.5.12",
        },
        globalNames: [
          { name: "Headers", exportName: "Headers" },
          {
            name: "fetch",
            exportName: "default",
          },
          { name: "Request", exportName: "Request" },
          { name: "Response", exportName: "Response" },
        ],
      },
      {
        package: {
          name: "@sgwilym/urlpattern-polyfill",
          version: "1.0.0-rc8",
        },
        globalNames: [{
          name: "URLPattern",
          exportName: "URLPattern",
        }],
      },
      {
        package: {
          name: "node-abort-controller",
          version: "3.0.1",
        },
        globalNames: [{
          name: "AbortController",
          exportName: "AbortController",
        }],
      },
    ],
  },
  mappings: {
    "https://deno.land/std@0.135.0/node/http.ts": "http",
    "https://deno.land/std@0.135.0/node/buffer.ts": "buffer",
    "https://deno.land/x/earthstar_streaming_rpc@v5.0.1/mod.ts": {
      name: "earthstar-streaming-rpc",
      version: "5.0.1",
    },
    "https://deno.land/x/earthstar@v9.3.2/mod.ts": {
      name: "earthstar",
      version: "9.3.2",
    },
    "https://deno.land/x/earthstar@v9.3.2/src/replica/replica-driver-sqlite.deno.ts":
      {
        name: "earthstar",
        subPath: "node",
        version: "9.3.2",
      },
    "https://esm.sh/micromark@3.0.10": {
      name: "micromark",
      version: "3.0.10",
    },
  },
  compilerOptions: {
    // ES2020 for Node v14 support
    target: "ES2020",
  },
  package: {
    // package.json properties
    name: "@earthstar-project/replica-server",
    version: Deno.args[0],
    description: "Create replica servers to sync your Earthstar shares.",
    license: "LGPL-3.0-only",
    repository: {
      type: "git",
      url: "git+https://github.com/earthstar-project/replica-server.git",
    },
    bugs: {
      url: "https://github.com/earthstar-project/replica-server/issues",
    },
    devDependencies: {
      "@types/node-fetch": "2.5.12",
      "@types/better-sqlite3": "7.4.2",
    },
  },
});

// post build steps
Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
