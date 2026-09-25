---
title: Token Listing and DTCG
description: How the Token Listing format builds on the DTCG format, color module and resolver specification rather than replacing them.
---

Token Listing is designed to feel familiar to anyone who knows the [DTCG 2025.10 specifications](https://www.designtokens.org/tr/2025.10/format/). This page walks through what it keeps unchanged, what it resolves away, and what it adds, so you can predict the shape of a listing from the shape of your sources.

## What is kept verbatim

Each listing entry starts with the same `$`-prefixed properties DTCG defines on a token:

- `$type` uses DTCG's type names: `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`, and the composite types `strokeStyle`, `border`, `transition`, `shadow`, `gradient` and `typography`.
- `$value` uses DTCG's value shapes for each type. A color is an object with `colorSpace`, `components` and optional `alpha` and `hex`, as the [color module](https://www.designtokens.org/tr/2025.10/color/) defines it. A dimension is `{ value, unit }`. A shadow is an object or array of objects with `color`, `offsetX`, `offsetY`, `blur`, `spread` and optional `inset`.
- `$description` and `$deprecated` keep their DTCG meaning, including the three states of `$deprecated`: `true`, a string reason, or `false`.
- `$extensions` is DTCG's extension mechanism. Token Listing puts its own data under one key in it and leaves room for others.

The consequence is that a tool which already understands DTCG values, for example a color library that reads the color object, works unchanged on listing entries. Token Listing does not define a second way to say "this is a color".

## What is resolved away

DTCG source files are optimised for authoring. Several of their features are conveniences that a build resolves, and the listing reports the result rather than the source construct.

**Groups become paths.** DTCG nests tokens in groups and forbids `.`, `{` and `}` in names precisely so that a dotted path is unambiguous. The listing uses that path as `$name` and flattens `data` into an array. The `$root` token name is kept in the path, as DTCG specifies, so `color.accent.$root` is the root token of the `color.accent` group.

**Type inheritance is applied.** In a source file a token may omit `$type` and inherit it from a parent group or from the token it aliases. Every listing entry carries an explicit `$type`.

**Aliases are resolved.** A source value of `"{color.brand.500}"` becomes the target's value, and the path the resolution followed is recorded in `aliasChain`, ordered from the immediate target to the leaf. Group extension with `$extends` is likewise applied before listing.

**References inside composite values are resolved too**, but the listing only records the chain for whole-token aliases. A typography token whose `fontFamily` sub-property is a reference has that sub-property resolved in `$value` and no `aliasChain`. Tools that need sub-property provenance re-read the source through `source.$ref`.

**Resolver layering is applied.** The [resolver specification](https://www.designtokens.org/tr/2025.10/resolver/) describes sets that always apply and modifiers whose contexts apply conditionally, merged in `resolutionOrder`. The listing contains the merged result for each context, not the layers.

Group-level metadata that would be lost by flattening is preserved separately in `meta.groups`: a map from group path to its `$description` and `$deprecated`, emitted only for groups that carry either.

## What is added

Everything Token Listing adds lives under `$extensions.listing` on each entry, or in the top-level `meta` object. The additions are exactly the things a build knows and a source file cannot express:

| Addition | Where | What it carries |
| --- | --- | --- |
| Platform names and values | `listing.platforms` | The token's identifier, and optionally its built value and deprecation, on each platform. |
| Mode | `listing.mode`, `meta.modes` | Which resolver context an entry belongs to, and the catalogue of modes. |
| Preview | `listing.previewValue` | A CSS expression to render the token with. |
| Subtype | `listing.subtype` | A finer-grained hint than `$type`, from a closed list. |
| Provenance | `listing.source` | Where the token was authored, and which resolver entry brought it in. |
| Source of truth | `listing.sourceOfTruth`, `meta.sourceOfTruth` | Which platform is the canonical place to edit a token. |

Where the listing points back to sources it borrows DTCG's own syntax. `source.$ref` is an RFC 6901 JSON Pointer in the form the resolver specification uses for reference objects: a file path, `#`, and a pointer into the document. `source.via` is a same-document pointer into the resolver such as `#/sets/color` or `#/modifiers/theme/contexts/dark`, which is how the resolver spec itself names sets and modifier contexts. Modes are the resolver's modifiers by another name: a mode's `name` is the modifier's key, its `values` are the context keys and its `default` is the modifier's default.

## Why the extension key is `listing`

DTCG recommends reverse domain notation for extension keys so that vendors do not collide, and the resolver spec gives `figma.com` as an example. Token Listing deliberately uses the bare key `listing` instead. The format is not a vendor's private data; it is a shared interchange layer that several producers emit and many consumers read, and its field names are the ones any tool needs to know. A vendor-specific key would suggest that the data belongs to one tool. Vendor-specific additions inside the listing extension are still expected to use namespaced keys, for example `$extensions.listing.x-mycompany-foo`, so that the two levels stay distinct.

## What DTCG leaves open and Token Listing pins down

A few areas are underspecified in DTCG for a build output, and the listing takes a position:

- **One entry per token per mode.** DTCG has no notion of a token's value "in a mode"; the resolver produces a whole token set per input. The listing enumerates that set per context and tags each entry, so consumers never run the resolver.
- **Existence on a platform is explicit.** DTCG cannot say which tokens a given output includes. In the listing, the presence of a `platforms` entry means the token exists there; absence means it does not.
- **Previews are CSS.** DTCG values are platform-neutral by design. The listing chooses CSS as the preview language because it is the most widely available rendering engine for documentation, and because a consumer that has no CSS engine can ignore the field.

For the reasoning behind these and other choices, see [Design decisions](/explanation/design-decisions/).
