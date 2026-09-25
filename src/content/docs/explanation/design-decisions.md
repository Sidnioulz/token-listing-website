---
title: Design decisions
description: The reasoning behind the shape of the Token Listing format, its versioning policy, and its non-goals.
---

The Token Listing format made a number of choices that could reasonably have gone another way. This page records why each one went the way it did, so that producers and consumers can work with the grain of the format, and so that future changes can be judged against the original intent.

## A flat array, not a tree

DTCG sources are trees of groups. The listing is a flat array of entries keyed by dotted path.

Consuming tools rarely want the tree. They filter (all colors, all deprecated tokens, everything in `space.*`), they index (by name, by CSS variable), they diff (this entry changed), and they iterate. Each of those is a one-liner over an array and a recursive walk over a tree. The dotted path preserves the hierarchy for tools that want to display it, and DTCG's own naming rules guarantee the path is unambiguous. Group-level metadata that a flat shape would lose is kept in `meta.groups`.

## One entry per token per mode

The alternative was one entry per token with a map of values by mode. The listing chose repetition instead.

Repetition keeps entries uniform: every entry has one `$value`, one alias chain, one set of platform values. Consumers do not need a second code path for "this token has modes". It also makes the default-mode case trivial: a token with no variation is just an entry with no `mode` field. The cost is file size, which is acceptable because listings are build artefacts rather than payloads a browser loads. See [Modes, platforms and provenance](/explanation/modes-platforms-and-provenance/) for what the single `mode` string does and does not model.

## Built output, not an authored document

A listing is regenerated on every build and never edited by hand. That decision drives several others: the format is complete rather than terse, it includes derived data such as preview values that would be tedious to author, and its schema can be strict because no human has to remember it. Anything a human should be able to change belongs in the DTCG sources or in the producer's configuration.

## Platform presence means existence

A `platforms.<id>` entry on a token means the token exists on that platform; its absence means it does not. This makes the map double as an inclusion list, which is the question tools most often need answered, and it avoids a separate boolean that could disagree with the map. The trade-off is that a producer must be configured with its platforms to say anything at all; the specification allows an empty map for producers that are not.

## Preview values are CSS

Documentation tools need something they can render, and DTCG values are structured objects that need conversion first. The listing carries a `previewValue` that is a valid CSS expression. CSS was chosen because it is the rendering language of documentation sites, Storybook, IDE webviews and most design-tool plugins. Consumers on platforms with no CSS engine ignore the field; the structured `$value` is still there for them. Preview values are hints for machines rather than values for humans, which is why the specification lets producers omit them when nothing useful can be computed and asks them never to emit empty strings.

## Subtypes are a closed list

`subtype` refines `$type` with hints such as `bgColor` or `borderRadius`. It is a closed enumeration in v1, fixed by an audit of what leading design system documentation sites distinguish, and adding a value requires a format version bump.

An open string would let producers invent subtypes, but consumers could not rely on any of them, which defeats the purpose of the field. A closed list means a documentation block can special-case `fgColor` knowing every producer means the same thing. Subtypes remain hints: the specification says consumers decide how to render, and an unknown subtype falls back to `$type`.

## Pointers reuse DTCG syntax

Source references use RFC 6901 JSON Pointers in the form the resolver specification uses for its reference objects, and resolver entries are named with the same `#/sets/…` and `#/modifiers/…` pointers the resolver document uses internally. Inventing a second addressing scheme would have forced every tool that already speaks the resolver format to learn another, and would have drifted from DTCG as that specification evolves.

## Forward compatibility and versioning

The format is versioned by an integer in `meta.version`. The number changes only for breaking changes: removing or renaming a normative field, changing a field's type or whether it is required, or changing what an existing field means. Adding an optional field, adding a well-known value to an open string, or clarifying documentation does not bump the version. Breaking changes are expected on a scale of years, not months, because the point of the format is to be a stable target for tools.

Two rules make that policy workable. Consumers must check the version and refuse ones they do not know, so that a future breaking change fails loudly rather than silently misreading data. And consumers should ignore fields they do not recognise, so that non-breaking additions and vendor extensions never break them. Vendors that add data inside the listing extension should namespace their keys, for example `x-mycompany-foo`, to stay clear of future normative names.

A [JSON Schema](/schema.json) is published for each version. It is a validation aid: the [specification](/spec/) remains the normative text.

## Non-goals

Some things were considered and left out on purpose.

- **Replacing DTCG.** Sources stay in DTCG. The listing is downstream of them.
- **Being a runtime format.** The listing describes a build; it is not the file an application loads to theme itself. Applications load the built CSS, Swift or JavaScript.
- **Prescribing rendering.** `subtype` and `previewValue` inform tools; they do not instruct them.
- **Sub-property alias fidelity.** Alias chains cover whole-token aliases. Tools that need to know that a typography token's `fontFamily` came from `{font.serif}` re-read the source via `source.$ref`.
- **Multi-axis mode tuples.** v1 tags an entry with one mode value and relies on orthogonal modifiers, as the resolver specification recommends.
