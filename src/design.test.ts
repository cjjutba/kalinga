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

// A button says what it does in a word or two. The screen around it carries
// the detail, so a label never repeats the date, the pet or the clinic that
// are already on the page beside it. Labels built from an expression are left
// alone: this catches the ones written as plain text, which is where the
// sentences creep in.
const LABEL = /(?:<Pill\b[^>]*>|<button\b[^>]*>)\s*\n?\s*([A-Za-z][^<>{}\n]{24,})\n?\s*(?:<\/Pill>|<\/button>)/g;

describe("a button label is a word or two", () => {
  it("has no button carrying a sentence", () => {
    const offenders = walk("src")
      .filter((path) => path.endsWith(".tsx"))
      .flatMap((path) => {
        const source = readFileSync(path, "utf8");
        return [...source.matchAll(LABEL)].map((m) => `${relative(process.cwd(), path)} "${m[1].trim()}"`);
      });

    expect(offenders, "put the detail on the screen, not in the button").toEqual([]);
  });
});

// Every field says what belongs in it, and says it the same way everywhere.
// The hint itself comes from src/content/placeholders.ts, so two screens
// asking for a mobile number cannot drift apart, and no invented person or
// clinic ends up in a form. Date and time inputs are exempt: the browser draws
// its own format and ignores a placeholder.
const FIELD = /<(?:InputField|TextareaField)\b/g;

function props(source: string, from: number): string {
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    const c = source[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (depth === 0 && source.startsWith("/>", i)) return source.slice(from, i);
  }
  return source.slice(from);
}

describe("every field says what belongs in it", () => {
  const fields = walk("src")
    .filter((path) => path.endsWith(".tsx"))
    .flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return [...source.matchAll(FIELD)].map((m) => ({
        where: `${relative(process.cwd(), path)}:${source.slice(0, m.index).split("\n").length}`,
        chunk: props(source, m.index ?? 0),
      }));
    });

  it("has a placeholder on every input a person types into", () => {
    const bare = fields.filter((f) => !/type="(date|time)"/.test(f.chunk) && !f.chunk.includes("placeholder"));
    expect(bare.map((f) => f.where), "give it a hint from src/content/placeholders.ts").toEqual([]);
  });

  it("takes every placeholder from the shared list", () => {
    const inline = fields.filter((f) => /placeholder="/.test(f.chunk));
    expect(inline.map((f) => f.where), "use placeholder.something so the same field reads the same everywhere").toEqual([]);
  });
});

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
