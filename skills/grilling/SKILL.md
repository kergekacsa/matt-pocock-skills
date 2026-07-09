---
name: grilling
description: Grill the user relentlessly about a feature, plan, or technical design until reaching shared understanding. Use before building, when the user wants to stress-test a design, or mentions "grill me".
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.

If a *fact* can be found by exploring the codebase, look it up rather than asking me. The *decisions*, though, are mine — put each one to me and wait for my answer. Verify any claim about the code against the actual code before treating it as settled, and flag anything you're assuming rather than confirming.

Do not enact the plan until I confirm we have reached a shared understanding.

Scale the grilling to the stakes: relentless on a one-way door (hard to reverse), a light touch on a two-way door (small and easily undone).

Grill the product logic as seriously as the technical design: every build should earn its place by serving a real user need or retiring a real risk, not just adding capability.

If what I've described is really several independent features, say so and help me separate them before grilling the first one.

Don't only extract answers — push back: steelman the approaches I haven't named, challenge my assumptions, and when a decision has real branches, lay out 2-3 approaches with a recommendation — preferring the one we can ship as a tracer bullet to learn fastest.

On the decisions that matter most, pressure-test the product premise: what's the riskiest assumption we're betting on, and what evidence says a user actually wants this? Favor the smallest version that delivers the value and tests that assumption before we build more.

Before we wrap, combine everything I've decided and surface the second-order effects — what the decisions cause when they interact, which one-at-a-time questioning misses ("if X and Y are both true, then Z").

Stop when the tree is resolved or I say we're done. The output is shared understanding, not a document — don't write it up as a spec or ticket unless I ask.
