---
title: Generate a Token Listing with Style Dictionary
description: Style Dictionary does not produce Token Listings yet. This page tracks the status and what an integration needs to do.
---

:::danger[Not supported yet]
There is no Style Dictionary format, transform or plugin that emits a Token Listing at the time of writing. This page is a placeholder so you know where things stand. Use [Terrazzo](/how-to/terrazzo/) if you need a listing today.
:::

## Status

Token Listing was proposed as a joint Terrazzo and Style Dictionary effort in the [Style Dictionary RFC discussion](https://github.com/style-dictionary/style-dictionary/discussions/1479). The Style Dictionary maintainers welcomed the flat-array design and sketched how it could fit the existing pipeline: a dedicated platform whose format walks `dictionary.allTokens` and whose transforms compute per-platform names. That sketch has not been implemented.

Follow the discussion for progress, or open a thread there if you want to contribute an implementation.

## What an integration needs to do

If you are considering writing one, these are the requirements the [specification](/spec/) places on a producer, mapped onto Style Dictionary concepts.

| Listing field | Where Style Dictionary has the information |
| --- | --- |
| `$name`, `$type`, `$description`, `$deprecated` | The DTCG properties on each token in `allTokens`. |
| `$value` | The resolved value after reference resolution. |
| `platforms.<id>.name` | The `name` transform output of each configured platform, so the listing must run after, or read from, the other platforms. |
| `platforms.<id>.value` | Each platform's transformed value. |
| `aliasChain` | The chain of `original.$value` references, walked with `usesReferences` and `getReferences`. |
| `previewValue` | A CSS value; the `css` transform group output is a reasonable default. |
| `mode` and `meta.modes` | Style Dictionary has no native mode concept. A resolver-based build, or one build per theme, would need to be merged. |
| `source.$ref` | `filePath` plus the token's `path` converted to a JSON Pointer. |
| `meta.groups` | Group-level `$description` and `$deprecated`, which Style Dictionary drops when flattening. |

The hardest parts are modes and cross-platform names, because Style Dictionary builds each platform independently. A working design will likely need a custom action or a post-build step that reads the outputs of every platform.

## In the meantime

Teams that run both tools can keep Style Dictionary for their existing outputs and add a Terrazzo build whose only job is the listing. Both tools read the same DTCG source files. See [Generate a Token Listing with Terrazzo](/how-to/terrazzo/).
