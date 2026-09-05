import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, ownerAc } from "better-auth/plugins/organization/access";

// The access control statement shared by the server and the browser client.
// Pure, no database, so the auth client can import it without pulling server
// code into the bundle. The plain permission map screens use is in roles.ts.

const statement = {
  ...defaultStatements,
  appointment: ["view", "manage"],
  client: ["view", "edit"],
  visit: ["view", "add"],
  recall: ["view", "send"],
  settings: ["view", "edit"],
  audit: ["view"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
  owner: ac.newRole({
    ...ownerAc.statements,
    appointment: ["view", "manage"],
    client: ["view", "edit"],
    visit: ["view", "add"],
    recall: ["view", "send"],
    settings: ["view", "edit"],
    audit: ["view"],
  }),
  vet: ac.newRole({
    appointment: ["view"],
    client: ["view"],
    visit: ["view", "add"],
  }),
  front_desk: ac.newRole({
    appointment: ["view", "manage"],
    client: ["view", "edit"],
    recall: ["view", "send"],
  }),
};
