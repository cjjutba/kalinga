import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { Permission } from "./roles";

// Reads every page under the staff and portal segments and fails the build if
// one of them does not start with a server side check. This is what makes
// "a front desk account cannot reach owner only data by guessing a URL" a
// property of the code rather than a hope. A new page must be added to the
// map below, which is the point: nobody adds a route without saying who may
// open it.

const root = join(__dirname, "..", "..");
const app = join(root, "src", "app");

function pages(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) pages(full, out);
    else if (entry === "page.tsx") out.push(full);
  }
  return out;
}

const staffRoutes: Record<string, Permission> = {
  "app/[org]": "day_view",
  "app/[org]/clients": "view_clients",
  "app/[org]/clients/[id]": "view_clients",
  "app/[org]/clients/new": "edit_clients",
  "app/[org]/clients/[id]/edit": "edit_clients",
  "app/[org]/pets": "view_clients",
  "app/[org]/pets/[id]": "view_clients",
  "app/[org]/pets/new": "edit_clients",
  "app/[org]/pets/[id]/edit": "edit_clients",
  "app/[org]/pets/[id]/visit": "add_visit",
  "app/[org]/pets/[id]/visits/[visitId]": "view_visit_notes",
  "app/[org]/recall": "view_recall",
  "app/[org]/recall/log": "view_recall",
  "app/[org]/settings": "view_settings",
  "app/[org]/settings/services": "view_settings",
  "app/[org]/settings/staff": "view_settings",
  "app/[org]/settings/hours": "view_settings",
  "app/[org]/settings/closures": "view_settings",
  "app/[org]/settings/recall": "view_settings",
  "app/[org]/audit": "view_audit",
  "app/[org]/audit/[id]": "view_audit",
};

const routeOf = (file: string) => relative(app, file).replace(/\/page\.tsx$/, "");

describe("every staff page refuses on the server", () => {
  const staffPages = pages(join(app, "app", "[org]"));

  it("lists every staff page in the route map, and nothing else", () => {
    expect(new Set(staffPages.map(routeOf))).toEqual(new Set(Object.keys(staffRoutes)));
  });

  for (const file of staffPages) {
    const route = routeOf(file);
    it(`${route} requires ${staffRoutes[route] ?? "a permission"}`, () => {
      const source = readFileSync(file, "utf8");
      const match = source.match(/await requirePagePermission\(org, "([a-z_]+)"\)/);
      expect(match, `${route} has no requirePagePermission call`).not.toBeNull();
      expect(match?.[1]).toBe(staffRoutes[route]);
      // The guard must run before anything renders.
      expect(source.indexOf("requirePagePermission(org"), `${route} guards after its return`).toBeLessThan(source.indexOf("return ("));
    });
  }

  it("the staff layout confirms membership before loading anything", () => {
    const source = readFileSync(join(app, "app", "[org]", "layout.tsx"), "utf8");
    expect(source).toMatch(/await requireMember\(org\)/);
    expect(source).toMatch(/loadOrgSnapshot\(actor\.org, actor\.role\)/);
  });

  it("the segment renders a forbidden page for the 403", () => {
    expect(statSync(join(app, "app", "[org]", "forbidden.tsx")).isFile()).toBe(true);
  });
});

describe("every portal page starts from the session", () => {
  const portalPages = pages(join(app, "me")).filter((f) => routeOf(f) !== "me");

  it("finds the four portal pages", () => {
    expect(portalPages.map(routeOf).sort()).toEqual(["me/appointments", "me/appointments/[id]", "me/pets", "me/pets/[id]"]);
  });

  for (const file of portalPages) {
    it(`${routeOf(file)} reads only the signed in person's rows`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toMatch(/await requireSession\(\)/);
      expect(source).toMatch(/getPortalData\(session\.user\.email\)/);
    });
  }
});
