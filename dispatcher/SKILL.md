---
name: dispatcher
description: Use when you're the lead agent on a multi-step coding task and are tempted to implement it yourself instead of delegating. Covers splitting work across backend/frontend/test boundaries, deciding whether a subagent's "done" claim is trustworthy, and picking which model tier a spawned agent should run on.
---

# Dispatcher

## Overview

You're the orchestrator: a frontier model directing implementation work done by Sonnet subagents. The split exists to save cost. Frontier reasoning handles understanding and judgment, Sonnet handles writing and editing code. It doesn't make your job smaller. Understand the system, decide the minimal change, write a spec tight enough that Sonnet can't misread it, and verify what comes back yourself.

## Non-negotiable model tiers

- **You:** stay on whatever frontier model the session is already running. A skill can't change your own session's model. If you were invoked on a cheaper one, say so instead of pretending otherwise.
- **Every subagent, including read-only investigation agents:** pass `model: "sonnet"` explicitly on every dispatch. The explicit `model` parameter overrides an agent type's own default. That's the one guarantee this harness actually gives you, so use it every time rather than trusting a type's default.
- **Never Opus, Haiku, or Fable for a subagent**, not even for "just a quick check." A task that seems to need frontier reasoning isn't decomposed enough yet: break it down further, or do that one slice yourself and delegate the rest.
- **If you can't pin a subagent's model**, say that plainly. Maybe no explicit `model` param is available, or agents are spawned some other way than this harness's dispatch tool. Don't claim the split is enforced when it isn't.

## Before delegating, understand it yourself

Don't hand "figure out how this works" to a subagent as step one.

1. Read the relevant code, or dispatch a **read-only** investigation agent (`model: "sonnet"`) to map it back to you.
2. Find the existing mechanism closest to the request. Extending it beats a new abstraction; a new one needs a stated reason, not just convenience.
3. Decide the smallest change that satisfies the request before writing any spec.

## Writing the spec

A vague prompt gets a vague result you'll have to redo. Every dispatch needs five things: **context** (what exists now, which files, how it connects), **goal** (the concrete, checkable outcome), **constraints** (contracts and shapes that must not change), **known edge cases**, and **verification** (the exact command that proves it; say so if none exists, rather than letting the agent invent its own definition of "works"). Close it with a **checklist**, not a vibe, for done.

One agent, one bounded responsibility. Don't split a simple task across three agents to look parallel, and don't hand one agent "build the feature" and hope the scope holds.

Dispatch in parallel only when agents touch disjoint files. If two tasks touch the same area, run them in sequence and hand the second agent the first one's actual diff, not a summary of it.

## "Done" is a claim, not a fact

Read the diff yourself. Check it against the spec, run the verification command, look for scope creep and for a new mechanism sitting next to one that should've been reused instead.

If it needs real correction, don't silently patch it. That erases the record of what the subagent produced and hides a prompting problem you'll repeat. Send it back with what's wrong, or dispatch a narrower fix.

## Independent review before calling it done

For anything past a trivial change, get a pass that isn't the implementer grading its own work. Use this harness's **`code-review`** skill, or **`security-review`** for security-sensitive changes, rather than inventing a parallel review process: they already produce structured, file:line findings. Hand-roll a review subagent only when the change is too narrow or unusual for those to fit.

Verify its findings against the real code before accepting or dismissing them. A reviewer flagging something doesn't make it true; you checking does.

## Rationalizations

| Temptation | Reality |
|---|---|
| "Faster to fix this myself than spec it" | A one-line fix, sure. A feature-sized change you implement yourself stops being orchestration. |
| "It said tests pass, good enough" | You didn't see the command run. Run it, or read its actual output. |
| "This needs Opus, it's complex" | Decompose further, or do the hard slice yourself and delegate the mechanical rest. |
| "Review would just repeat what I checked" | You checked it believing your own spec was right. The second pass checks that belief. |
| "A review agent for this tiny change is overkill" | Sometimes true. Say you're skipping it and why, instead of skipping silently. |

## Red flags

- Editing implementation files yourself on anything past a one-line fix
- Reporting success from an agent's text alone, no diff read, no command run
- Two agents about to touch the same file in parallel
- A dispatch going out without `model: "sonnet"` set explicitly
- Building a new review process instead of using `code-review` / `security-review`
