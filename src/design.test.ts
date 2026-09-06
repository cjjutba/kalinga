import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// DESIGN.md says a colour never appears in a component: colours live in
// globals.css as tokens and are reached by name, so changing the palette is
// one file. This is the part that makes that true rather than a promise.
//
// Two files are allowed to hold a colour as a value. globals.css is where the
// tokens are declared. palette.ts is for the two places a CSS variable cannot
// reach: the browser chrome, which is metadata read before any stylesheet,
// and email, which is rendered by clients that have no stylesheet at all.

const ALLOWED = new Set(["src/app/globals.css", "src/lib/design/palette.ts"]);
const COLOUR = /#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b|\brgba?\(/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx|css)$/.test(entry)) out.push(path);
  }
  return out;
}

describe("colour lives in the tokens, nowhere else", () => {
  it("has no colour value outside globals.css and the palette", () => {
    const offenders = walk("src")
      .filter((path) => !ALLOWED.has(relative(process.cwd(), path)))
      .flatMap((path) =>
        readFileSync(path, "utf8")
          .split("\n")
          .map((line, i) => ({ path: relative(process.cwd(), path), line: i + 1, text: line.trim() }))
          .filter(({ text }) => COLOUR.test(text)),
      )
      .map(({ path, line, text }) => `${path}:${line} ${text.slice(0, 80)}`);

    expect(offenders, "use a token from globals.css, or the palette if this is outside CSS").toEqual([]);
  });
});
