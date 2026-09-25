---
title: Generate a Token Listing with Terrazzo
description: Configure @terrazzo/plugin-token-listing to emit a Token Listing alongside your other Terrazzo build outputs.
---

This guide shows how to add a Token Listing to an existing Terrazzo build and how to configure each part of the listing: platforms, modes, source of truth, subtypes, preview values and source paths. It assumes you already have a working `terrazzo.config.ts`. If you are new to Terrazzo, start with [Build your first Token Listing](/tutorials/first-listing/).

:::caution[Plugin status]
The published `@terrazzo/plugin-token-listing` 0.1.x writes the proof-of-concept shape (`app.terrazzo.listing`, `names`, `originalValue`, `source.resource`) and does not yet enumerate resolver modes. The configuration below is the same for both shapes; the emitted JSON matches this site's [specification](/spec/) from the plugin's v1 release onward.
:::

## Install the plugin

```sh
npm install -D @terrazzo/plugin-token-listing
```

Add it after the plugins that build your tokens. It runs as a post-build step and reads what those plugins produced.

```ts title="terrazzo.config.ts"
import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";
import listing from "@terrazzo/plugin-token-listing";

export default defineConfig({
  tokens: ["./tokens/tokens.resolver.json"],
  outDir: "./dist/",
  plugins: [
    css({ filename: "tokens.css" }),
    listing({ filename: "tokens.listing.json" }),
  ],
});
```

Run `npx tz build`. The listing lands in `outDir` next to your other outputs. Every option below is optional; with none set you get a listing with DTCG fields, preview values, alias chains and source locations, but no platform names.

## Declare platforms

A platform is any place your tokens exist: a CSS bundle, a Sass file, a Figma library. Each platform entry produces a `platforms.<id>` object on every token that exists on that platform, with the token's name there.

### Reuse a Terrazzo plugin's naming

Pass the plugin's format name as `name`. The listing plugin asks that plugin for each token's identifier, so the names in the listing are exactly the ones in the built file.

```ts
listing({
  platforms: {
    css: { name: "@terrazzo/plugin-css", description: "CSS custom properties for web apps" },
    sass: { name: "@terrazzo/plugin-sass", description: "Sass variables for the legacy app" },
  },
});
```

As a shorthand, pass the plugin name as the whole entry: `platforms: { css: "@terrazzo/plugin-css" }`. The description is then generated.

Tokens the plugin did not build are left out of that platform. For instance, the CSS plugin skips composite tokens that have no CSS shorthand, so those tokens have no `css` entry.

### Name tokens on a platform without a plugin

Pass a function instead. It receives the token, the current mode, the whole token set and a logger, and returns the name or `undefined` to exclude the token.

```ts
listing({
  platforms: {
    figma: {
      description: "Figma variables curated by the design system team",
      name: ({ token }) => token.id.replace(/\./g, "/"),
    },
  },
});
```

### Filter which tokens a platform includes

Add a `filter`. It can be a plugin name (include only tokens that plugin built) or a function returning a boolean. Filters combine with `name`: a token needs a name and a passing filter to be listed on the platform.

```ts
listing({
  platforms: {
    sass: {
      description: "Sass variables (modes are not supported by the legacy app)",
      name: "@terrazzo/plugin-sass",
      filter: ({ mode }) => mode === ".",
    },
    figma: {
      description: "Figma variables",
      name: ({ token }) => token.id.replace(/\./g, "/"),
      filter: ({ token }) => !token.id.startsWith("internal."),
    },
  },
});
```

`"."` is the default mode. The `sass` example above lists only the mode-less value of each token.

## Declare modes

Modes are the variation axes of your token system: theme, density, device class. When your tokens come from a [DTCG resolver](https://www.designtokens.org/tr/2025.10/resolver/), each modifier is a mode and its contexts are the values. Declare them so consumers can build mode selectors from `meta.modes`.

```ts
listing({
  modes: [
    {
      name: "theme",
      values: ["light", "dark"],
      default: "light",
      description: "Color theme matching user device preferences",
    },
    {
      name: "device",
      values: ["mobile", "tablet", "desktop"],
      description: "Tokens that depend on device size",
    },
  ],
});
```

Use the same names and values as your resolver's modifiers and contexts. A token that varies across a mode produces one entry per value, each tagged with `mode`.

## Declare a source of truth

Tell consumers where tokens are authored so they can link to the right editor.

```ts
listing({
  sourceOfTruth: "figma",
});
```

If different tokens are authored in different places, provide a default plus a per-token override. Only tokens where the function returns a value get a per-token `sourceOfTruth`.

```ts
listing({
  sourceOfTruth: {
    default: "figma",
    custom: ({ token }) => (token.id.startsWith("dev.") ? "css" : undefined),
  },
});
```

The value should be a platform id from `platforms`, but any string is accepted.

## Assign subtypes

Subtypes let documentation tools pick a better preview than the DTCG type alone allows: a background color as a filled block, a foreground color as sample text, a padding as an inset. Because the right subtype depends on your naming conventions, you supply the mapping.

```ts
listing({
  subtype: ({ token }) => {
    if (token.$type === "color") {
      if (token.id.includes("background")) return "bgColor";
      if (token.id.includes("border")) return "borderColor";
      if (token.id.includes("icon") || token.id.includes("text")) return "fgColor";
    }
    if (token.$type === "dimension") {
      if (token.id.includes("width") || token.id.includes("height")) return "size";
      if (token.id.includes("space") || token.id.includes("gap")) return "gap";
      if (token.id.includes("padding")) return "padding";
      if (token.id.includes("margin")) return "margin";
      if (token.id.includes("stroke")) return "borderWidth";
      if (token.id.includes("radius")) return "borderRadius";
    }
    return undefined;
  },
});
```

Return one of the values listed under [`subtype` in the specification](/spec/#subtype). Anything else is ignored.

## Customise preview values

Preview values are computed automatically as CSS, using the CSS plugin's transforms, and typography tokens get a `font` shorthand. Override them only when the default does not suit your consumers, for example to force sRGB output. Return `undefined` to keep the computed value.

```ts
import Color from "colorjs.io";

listing({
  previewValue: ({ token }) => {
    if (token.$type === "color") {
      const { colorSpace, components, alpha } = token.$value;
      return new Color({ space: colorSpace, coords: components, alpha }).to("srgb").toString();
    }
    return undefined;
  },
});
```

## Control source paths

`source.$ref` is a path to the token's source file plus a JSON Pointer to the token inside it. Paths are relative to the resolver document when you build from a resolver, otherwise relative to the working directory. Set `resourceRoot` when your CI checks out the repository somewhere other than where the listing is consumed.

```ts
listing({
  resourceRoot: "./packages/tokens/src/",
});
```

## Verify the output

Validate the file against the published JSON Schema before shipping it, for example with `ajv`:

```sh
npx ajv-cli validate -s https://token-listing.org/schema.json -d dist/tokens.listing.json
```

Then spot-check one token that exists on every platform, one alias, and one token per mode value. If a platform column is empty for tokens you expected, check that the plugin named in `platforms` is actually in `plugins`, and that its format name matches. The plugin logs an error when it cannot find a format.

## Full example

```ts title="terrazzo.config.ts"
import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";
import sass from "@terrazzo/plugin-sass";
import listing from "@terrazzo/plugin-token-listing";

export default defineConfig({
  tokens: ["./tokens/tokens.resolver.json"],
  outDir: "./dist/",
  plugins: [
    css({
      filename: "tokens.css",
      permutations: [
        { input: { theme: "light" }, prepare: (c) => `:root {\n${c}\n}` },
        { input: { theme: "dark" }, prepare: (c) => `[data-theme="dark"] {\n${c}\n}` },
      ],
    }),
    sass({ filename: "tokens.scss" }),
    listing({
      filename: "tokens.listing.json",
      modes: [{ name: "theme", values: ["light", "dark"], default: "light" }],
      platforms: {
        css: "@terrazzo/plugin-css",
        sass: { name: "@terrazzo/plugin-sass", filter: ({ mode }) => mode === "." },
        figma: {
          description: "Figma variables",
          name: ({ token }) => token.id.replace(/\./g, "/"),
        },
      },
      sourceOfTruth: {
        default: "figma",
        custom: ({ token }) => (token.id.startsWith("dev.") ? "css" : undefined),
      },
      subtype: ({ token }) =>
        token.$type === "color" && token.id.includes("text") ? "fgColor" : undefined,
    }),
  ],
});
```

## Reference

The plugin's own documentation lists every option with its type: [terrazzo.app/docs/integrations/token-listing](https://terrazzo.app/docs/integrations/token-listing). The fields it writes are defined in the [specification](/spec/).
