// Baut src/main.js mit einer angepassten Excalidraw-Version nach assets/.
// Anpassung: Link-Symbole an Elementen werden nicht gezeichnet.
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pkg = path.join(import.meta.dirname, "node_modules/@excalidraw/excalidraw");
const out = path.join(root, "assets");

// In renderLinkIcon die Bedingung `element.link && …` durch `false && …` ersetzen
const LINK_ICON = /(elementLink:null\},\w+=\(\w+,\w+,\w+,\w+\)=>\{if\()(\w+\.link&&)/;

const hideLinkIcons = {
  name: "hide-link-icons",
  setup(build) {
    let patched = 0;
    build.onLoad({ filter: /@excalidraw[\\/]excalidraw[\\/]dist[\\/]prod[\\/].*\.js$/ }, (args) => {
      const code = fs.readFileSync(args.path, "utf8");
      if (!LINK_ICON.test(code)) return null;
      patched++;
      return { contents: code.replace(LINK_ICON, "$1false&&$2"), loader: "js" };
    });
    build.onEnd(() => {
      if (patched !== 1) throw new Error(`Link-Symbol-Patch ${patched}x angewendet statt 1x – Excalidraw-Version prüfen`);
    });
  },
};

fs.rmSync(out, { recursive: true, force: true });

await esbuild.build({
  entryPoints: { app: path.join(root, "src/main.js") },
  bundle: true,
  minify: true,
  format: "esm",
  splitting: true,
  target: "es2022",
  external: ["*.woff2"],
  outdir: out,
  nodePaths: [path.join(import.meta.dirname, "node_modules")],
  conditions: ["production"],
  define: { "process.env.NODE_ENV": '"production"', "import.meta.env": "{}" },
  plugins: [hideLinkIcons],
  logLevel: "warning",
});

// Schriften selbst hosten (ohne die große chinesische Ersatzschrift Xiaolai)
fs.cpSync(path.join(pkg, "dist/prod/fonts"), path.join(out, "fonts"), {
  recursive: true,
  filter: (src) => !src.includes("Xiaolai"),
});
fs.writeFileSync(path.join(out, "EXCALIDRAW-LICENSE.txt"), `Enthält eine angepasste Version von Excalidraw (https://github.com/excalidraw/excalidraw).
Änderung: Link-Symbole an Elementen werden nicht gezeichnet.

MIT License

Copyright (c) 2020 Excalidraw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`);
console.log("fertig:", fs.readdirSync(out).join(", "));
