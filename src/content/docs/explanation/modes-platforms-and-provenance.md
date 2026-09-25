---
title: Modes, platforms and provenance
description: The three ideas that make a Token Listing more than a flat dump of tokens, and how to think about each.
---

Most of the fields in `$extensions.listing` serve one of three purposes: saying which variant of a token an entry describes, saying where the token exists, or saying where it came from. This page explains each idea, the situations it is meant to handle, and the edges where the model is deliberately simple.

## Modes: one entry per variant

A token system that supports light and dark themes, or mobile and desktop sizes, has tokens whose values depend on context. In DTCG this is expressed with a resolver: a modifier such as `theme` has contexts such as `light` and `dark`, and each context layers extra token files onto the base sets. The listing calls the modifier a **mode** and the contexts its **values**.

The listing does not nest the variants inside a token. It emits one entry per token per mode value, each a complete token with its own `$value`, its own platform values and its own alias chain, tagged with `mode`. A token that does not vary appears once with no `mode` field.

This shape was chosen because it keeps every entry self-contained. A consumer that filters `data` by `mode === "dark"` gets a complete dark token set. A consumer that groups by `$name` gets every token with all its variants. A diff tool that compares two listings line by line sees a mode change as a change to one entry. None of these needs to know how the build layered its files.

The catalogue in `meta.modes` is what lets a tool build a switcher without scanning `data`. Each mode has a `name`, its possible `values`, an optional `description` and an optional `default`. When a listing is built from a resolver these correspond one to one with modifiers; without a resolver, the producer declares them from its own configuration.

### The edges of the model

The resolver specification recommends **orthogonal** modifiers: no two modifiers should provide values for the same token, because otherwise `resolutionOrder` silently decides which wins. Token Listing's single `mode` string per entry assumes the same discipline. A token that varies along `theme` produces `light` and `dark` entries; a token that varies along `device` produces `mobile` and `desktop` entries; a token that varied along both at once would need the cartesian product, which v1 does not model. In practice orthogonal systems avoid this, and it is one of the reasons the resolver spec asks for orthogonality.

Modes are also flat: there is no hierarchy of modes, and no way to say that one mode only applies within another. Producers that need more structure can describe it in a namespaced extension field.

## Platforms: where a token exists

A **platform** is anywhere the tokens are materialised: a CSS bundle, a Sass module, a JavaScript export, a Tailwind theme, a Figma variable collection, an Android resource file. The listing catalogues them in `meta.platforms`, each with an optional description, and records on each token entry a `platforms` map with one entry per platform the token exists on.

The two halves matter for different reasons. The catalogue tells a tool what columns to offer, and its descriptions give humans and AI agents context about who consumes each output. The per-token map answers the question consuming tools ask most: **what is this token called here?** Its `name` is the exact identifier in that output, produced by the same transform that produced the output, so a documentation site can print it and a migration script can search for it without reproducing naming rules.

Presence carries meaning. If a token has no `css` entry, it was not built for CSS, whether because the plugin skipped it (a composite value with no CSS shorthand, for instance) or because the team filtered it out. Tools should treat that as information rather than as missing data. An empty `platforms` object, which the specification allows, means the producer was not configured with any platforms at all.

Two optional fields refine the picture. `value` is the built value on that platform, useful when a tool wants to show `rgb(36% 25% 81%)` next to the CSS name rather than a converted preview. `deprecated` lets a platform deprecate a token independently of the source, which happens when a name is being migrated on one output only.

### Source of truth

Platforms also carry the answer to "where do I go to change this?". A design system usually has one authoring location, often a design tool, and the listing names it in `meta.sourceOfTruth`. Systems in transition, or systems where developers own some tokens and designers others, can override it per entry with `listing.sourceOfTruth`. Tools use this to link a token to the right editor, and to warn when someone tries to edit a token in the wrong place.

## Provenance: where a token came from

The third idea is tracing an entry back to its origin. The listing records this in three fields.

`aliasChain` records the path a value took through references. For a token authored as `{semantic.brand}` where `semantic.brand` is itself `{base.primary}`, the chain is `["semantic.brand", "base.primary"]`, from the immediate target to the leaf whose value is the resolved one. Tools use it to draw dependency graphs, to explain where a value comes from, and to work out what changes when a base token changes. The chain is per entry, so the light and dark variants of a token can alias different things.

`source.$ref` is a pointer to the token's location in a source file, in the same syntax the resolver specification uses: a relative file path, then `#` and a JSON Pointer into it. `source.loc` optionally adds a line and column range. Together they let a documentation site link a token to its definition and let an editor integration jump to it.

`source.via` says which resolver entry introduced the token, again as a JSON Pointer into the resolver document: `#/sets/color` for an unconditional set, `#/modifiers/theme/contexts/dark` for a modifier context. It is present only when a resolver was used. A consumer can tell a themed token from a base one by looking for `/modifiers/` in the pointer.

### Why not just point at the source and stop

Provenance could have been left to consumers: give them `source.$ref` and let them re-read the file. The listing records alias chains and resolver entries as well because those are the facts a build has for free and a consumer would have to run the resolver to recover. The one place where the listing does send consumers back to the source is sub-property aliases inside composite values, which the chain does not cover. That is a deliberate trade: full fidelity for every reference would make every entry much larger for a case most tools never need.

## Putting the three together

A single entry in a listing might say: this is `color.semantic.fg`, in `dark` mode, called `--color-semantic-fg` in CSS with value `#ffffff`, aliasing `color.white`, authored in Figma except that this dark variant is curated in CSS, and defined at line 8 of `theme/dark.json`, which the resolver's dark context pulled in. Every clause of that sentence is a field, and every field is something the build knew and the tool would otherwise have had to work out.
