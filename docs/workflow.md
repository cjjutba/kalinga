# Workflow

Plan first. Build small. Review with AI. Fix. Repeat.

```
Plan and describe  ->  Design the screen  ->  Break into features
                                                      |
                                                      v
        +---------------------------->  Build one feature
        |                                             |
        |                                             v
        |                                        Self check
        |                                             |
        |                                             v
        |                                      AI code review
        |                                             |
        |                                             v
   more features                                  Fix issues
        ^                                             |
        |                                             v
        |                                    Feature complete?  --no-->  back to build
        |                                             |
        |                                            yes
        |                                             v
        +---------------------  Deploy, then save progress
                                                      |
                                                     no
                                                      v
                                              Project complete
```

## The three additions to that loop

The diagram above is the loop the author drew, with three changes that came out
of planning.

**Deploy is part of saving progress.** Not a step at the end. A feature is not
complete until it is live on a real URL and green. The whole reason this project
exists is that a portfolio piece has to be clickable, and a deploy left until the
end is a deploy that surprises you.

**There is a checkpoint after feature four.** The loop as drawn never asks whether
the next feature is worth building. After F4 the product is demonstrable, so it
goes in front of a real clinic before anything else is built. Everything after
that is informed rather than assumed.

**Review depth scales with risk.** A uniform adversarial pass on every feature
becomes noise you learn to skim, which is worse than not reviewing. See below.

## Review depth

**Deep** on F1, F2a, F2b, F4 and F6. Tenancy, the scheduling engine, an
unauthenticated public write path, demo isolation, and permissions. Everything
where a bug leaks one clinic's data into another's view or double books a real
customer.

A deep pass looks for tenancy leaks, permission holes reachable by guessing a
URL, abuse paths on public endpoints, and the edge cases the tests did not think
of.

**Normal** on F3, F5, F7 and F8. Ordinary work over an already-secured boundary.

## Self check, before any review

Run it. Click the thing you just built. Then check the states that generated
mockups never show, which are empty, loading, error, full, and overflowing with
sixteen appointments and names that wrap.

A verification skill gets written after F1, once there is real code to drive. It
books an appointment against the running application and confirms it lands in the
day view. That turns self check from a step you skip into one you run.

## Saving progress

A feature is saved when it is committed, deployed, and green.

Commit messages follow the writing rules in `../AGENTS.md`. No dashes as
punctuation, no semicolons, and enough detail that the reasoning survives.

Add to `product/decisions.md` when something is decided. Take a screenshot when a
feature is done. Both are much easier on the day than reconstructed in a month.

Design boards go in `design/explorations/` beside the prompt, model and price
that produced them. Read the price from the fal pricing tool before every run,
because fal changes prices without notice. A board without its prompt cannot be
reproduced.

## Skills worth building, and when

**After F1, a verification skill.** Drives the running application the way a user
does. Shaped by real code rather than guesses, which is why it waits.

**After F2b, a feature-loop skill.** Encodes this document including the deploy
gate, so the loop does not quietly degrade into "just build the next thing" by
week three.

Nothing else. Code review already exists as a command, and an adversarial pass
already exists for the deep features. Building custom versions of tools that
already work is how a side project turns into tooling instead of a product.
