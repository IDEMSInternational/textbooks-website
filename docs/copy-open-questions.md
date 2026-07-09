# Open copy/design questions

Parked decisions from the "Site edits" doc (2026-07-08) that we chose not to
implement yet, kept here so others can weigh in before we commit to one
direction. Not part of the rendered site.

## Innovation page — Section 2 headline wording

We went with **"Three Technology Layers, One Unified Architecture"**.

The source doc also floated **"One Global Operating Environment"** as an
alternative for the second line, with the author's own caveat: "is it too
wonky to say this instead?" Leaving both here in case someone prefers it:

- Three Technology Layers, One Unified Architecture *(current)*
- Three Technology Layers, One Global Operating Environment *(alternative)*

## Innovation page — Section 3 diagram

The doc includes a draft flow diagram for the middleware deep-dive section
(Resources Library → IDEMS Middleware [IDEMS IP → Textbooks Brain → Agentic
AI Hands] → Publishing Hub → Local Variants, with every arrow running both
ways). The doc itself marks parts of it as unfinished ("[BRIEF DESCRIPTION
TBD]", "[draft — expand with full description]") and asks "Thoughts on this
diagram and copy?" — so we're treating it as a later task once the content
settles, rather than building it now.

**Flag for whoever picks this up:** the diagram's "Agentic AI Hands... trained
on the Textbooks Brain's high-quality data" framing needs careful wording
before it ships. "Trained on [community] data" reads, to a lot of people, like
the extractive-AI pattern (scraping people's work to profit from it without
consent or attribution) that OER/open-education communities are specifically
wary of. Our actual model is different — the community's contributions stay
attributed, the Brain's "training" is closer to an expert-curated,
deterministic core than a black-box model trained on scraped text — but the
diagram as drafted doesn't make that distinction clear. Worth a deliberate
pass on this language (with input from someone close to the open-textbooks
community) before the diagram or its copy goes live.

## Homepage — accordion step-sequence visualization

The doc notes the Educators/Educator-Authors/Authors accordion's four
"Step 1/2/3/4" items don't read as an obvious sequence, and asks if there's a
better way to show progression. We're planning to try something for this
(e.g. numbered markers/a light connector between steps) as a genuinely
optional, easily-reverted experiment — see the commit that introduces it for
a one-line rollback if it doesn't earn its keep over the plain "Step N"
rename.
