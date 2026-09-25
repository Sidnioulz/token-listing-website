---
title: Why Token Listing exists
description: The gap between authored design tokens and the tools that consume built ones, and how Token Listing fills it.
---

Design tokens have a good authoring story and a poor consumption story. This page explains what that means, why the gap is structural rather than accidental, and what Token Listing does about it.

## Two ends of a pipeline

A design token starts life as a name and a value in a source file. The [Design Tokens Community Group (DTCG)](https://www.designtokens.org/) format standardises that file: tokens live in nested groups, carry a `$type` and a `$value`, can alias each other with `{group.token}` references, and, since the 2025.10 release, can vary by context through a resolver document that layers sets and modifiers. Design tools export it and translation tools such as Terrazzo and Style Dictionary read it.

The other end of the pipeline is a build output: a CSS file with custom properties, a Swift enum, a Tailwind config, a Figma variable collection. Each output has its own names for the same tokens, chosen by whichever transform the team configured. The alias `{color.brand.500}` becomes `var(--color-brand-500)` in one output and `Color.brand500` in another, and only the build knows which.

Everything a team uses tokens for after the build sits at this second end: documentation sites, changelog generators, linters that flag deprecated tokens, code migration scripts, search in an IDE plugin, an MCP server answering "what is the token for card backgrounds?". These tools do not want the authoring format. They want to know, for each token, what it is called on the platform they care about, what it resolves to in each theme, how to draw it, and where to send someone who wants to change it.

## Why the authoring format is not enough

It is tempting to hand consuming tools the DTCG source and let them work it out. In practice each one has to reimplement a large slice of the build:

- **Resolution.** Values are structured objects, aliases chain across files, groups pass their `$type` down, and a resolver decides which files apply in which theme. Reading a resolved value means running the resolver algorithm.
- **Naming.** Platform names are not in the source at all. They come from the build's configuration: prefixes, case conventions, custom transform functions. A tool cannot reproduce them without the build config, and with it the tool becomes coupled to a specific build system.
- **Previews.** A DTCG color is a color space and an array of components. A dimension is a value and a unit. To draw a swatch you need a CSS expression, which is a conversion the build already performs.
- **Provenance.** Once tokens are resolved and flattened, the group structure, the group descriptions and the file each token came from are gone unless something records them.

The result is a small parser and resolver inside every consuming tool, each with its own configuration API for the parts that cannot be inferred. Teams then maintain per-tool adapters, and switching build systems means rewriting them.

## What Token Listing does instead

Token Listing moves that work to the one place that already has the answers: the build. A compatible translator emits, alongside its normal outputs, one JSON file that lists every built token with everything a consuming tool would otherwise have to compute:

- the DTCG fields as authored (`$name`, `$type`, `$description`, `$value`, `$deprecated`), with the value resolved;
- the token's name, and optionally its built value, on every platform the build covers;
- which mode the entry belongs to, with the catalogue of modes in `meta`;
- a CSS `previewValue` for rendering;
- the alias chain the value came through;
- a pointer back to the source file and the resolver entry that introduced the token;
- group-level descriptions and deprecations that flattening would lose.

A consuming tool then does three things: check the version, read `meta`, iterate `data`. It needs no parser for the authoring format and no knowledge of the build configuration. The [reading tutorial](/tutorials/read-a-listing/) shows this in about forty lines.

## Who benefits

**Tool authors** get one input format instead of one per build system, and a much smaller surface to support. A documentation block that renders a token from a Token Listing works for any team whose build emits one, regardless of naming conventions or theming strategy.

**Design system teams** get to switch or upgrade build tools without touching the tools downstream, and to add a new downstream tool without writing an adapter. They also get an artefact that can be diffed between releases, indexed for search, or handed to an AI agent as a complete description of the system.

## What it is not

Token Listing is not a replacement for the DTCG format. Sources stay in DTCG; the listing is derived from them on every build and never edited by hand. It is not a runtime format either: it describes what a build produced, not how an application should load tokens. And it is not a rendering specification: fields such as `subtype` and `previewValue` are hints that tools may use, not instructions they must follow.

For how the listing reuses DTCG concepts rather than reinventing them, see [Token Listing and DTCG](/explanation/token-listing-and-dtcg/).
