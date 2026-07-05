# @token-listing/utils

Tool-agnostic utilities for working with [Token Listing Format v1](https://token-listing.org) documents. No dependencies, no producer lock-in: everything here operates on plain listing JSON.

> Temporarily developed inside the token-listing website repository; will move to its own home before publication.

## `mergeTokenListings(inputs, options?)`

Merges several Token Listing documents into one. The main use case is build systems that produce **one partial listing per mode context** — for example Style Dictionary, where every platform of a config shares a single source token set, so a light/dark design system is typically two builds producing two listings.

Entries are identified by their `$name` and mode. An entry without a mode takes the mode of the input it came from, so partial listings don't need to stamp modes themselves:

```js
import { mergeTokenListings } from '@token-listing/utils';

const merged = mergeTokenListings(
  [
    { listing: lightListing, mode: 'light' },
    { listing: darkListing, mode: 'dark' },
  ],
  { modes: [{ name: 'theme', values: ['light', 'dark'], default: 'light' }] },
);
```

Merge behaviour:

- `meta.version` must be `1` on every input; the output is version `1`.
- `meta.authoringTool` must agree across inputs, or be overridden with `options.authoringTool`.
- `meta.modes` catalogs merge by mode name (values unioned, first description kept, defaults must agree), unless `options.modes` provides the catalog. Every entry mode must belong to the merged catalog when one exists.
- `meta.platforms` and `meta.groups` merge by key; same-key entries must be identical.
- `meta.sourceOfTruth` must agree across the inputs that declare it, or be overridden with `options.sourceOfTruth`.
- Identical duplicate entries are deduplicated. Conflicting duplicates (same `$name` and mode, different content) throw by default; pass `options.onConflict: 'first' | 'last'` to pick a resolution strategy.

Inputs are never mutated.

> **Multi-axis note.** A listing entry carries a single `mode` string (a context value such as `dark`), matching v1 of the format. Design systems whose values vary along several axes at once (e.g. theme × device) cannot express a *combination* per entry; label entries along the primary axis and keep secondary axes as separate listings or token paths.

## `modesFromResolver(resolver)`

Derives a Token Listing mode catalog from the `modifiers` of a [DTCG Resolver document](https://www.designtokens.org/tr/drafts/resolver/): one mode per modifier, with the modifier's context names as values.

When a resolver drives your builds (one build per context), this keeps `meta.modes` in sync with it instead of hand-maintaining the catalog:

```js
import fs from 'node:fs';
import { mergeTokenListings, modesFromResolver } from '@token-listing/utils';

const resolver = JSON.parse(fs.readFileSync('tokens.resolver.json', 'utf8'));

const merged = mergeTokenListings(
  [
    { listing: lightListing, mode: 'light' },
    { listing: darkListing, mode: 'dark' },
  ],
  { modes: modesFromResolver(resolver) },
);
```

## Development

```sh
node --test
```
