# docs

## Read in this order

| File | What it answers |
| --- | --- |
| [`product/brief.md`](product/brief.md) | What Kalinga is, who it is for, and what it has to be true about |
| [`product/features.md`](product/features.md) | The eight features of v1, in order, with what done means for each |
| [`product/roles.md`](product/roles.md) | The four roles and what each can do |
| [`product/data-model.md`](product/data-model.md) | Entities, relationships and the tenancy rule |
| [`design/direction.md`](design/direction.md) | How the visual direction was decided, what was tried, and what it cost |
| [`design/pages.md`](design/pages.md) | Every page in v1 by surface, with routes and who can reach it |
| [`design/screens.md`](design/screens.md) | The screens, in the order they get designed, and where each stands |
| [`design/explorations/`](design/explorations/README.md) | Generated boards and vectors with the prompts that produced them |
| `design/screenshots/` | Screenshots of the running prototype, by date and page |
| [`workflow.md`](../docs/workflow.md) | The build loop, and when to escalate review depth |
| [`product/decisions.md`](product/decisions.md) | Every decision made so far, and why |

The two files above this folder matter more than any of them.
[`AGENTS.md`](../AGENTS.md) is the operating manual and
[`DESIGN.md`](../DESIGN.md) is the design system.

## Keeping this honest

`product/decisions.md` is append only. When a decision changes, add a new entry
that supersedes the old one rather than editing history. A decision log that gets
rewritten is a decision log nobody trusts.

Everything else in this folder describes the product as intended. When the build
teaches you something different, change the document. A plan that disagrees with
the code is worse than no plan, because someone will follow it.
