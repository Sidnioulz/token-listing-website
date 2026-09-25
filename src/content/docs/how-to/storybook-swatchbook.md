---
title: Show tokens in Storybook with Swatchbook
description: Use the Swatchbook addon to render your design tokens in Storybook, with per-platform names and preview values taken from a Token Listing.
---

[Swatchbook](https://github.com/unpunnyfuns/swatchbook) is a Storybook addon that renders DTCG tokens as swatch grids, tables and inspectors, with a toolbar that flips themes. Under the hood it runs Terrazzo in memory, including `@terrazzo/plugin-token-listing`, and reads the resulting Token Listing to display each token's platform names and preview values. This guide wires it up and shows how to feed it the same listing configuration as your production build.

## Prerequisites

- Storybook 10.1 or later on the Vite builder, with React 18 or later.
- Node.js 24 or later.
- Your tokens in DTCG 2025.10 format, ideally with a [resolver document](https://www.designtokens.org/tr/2025.10/resolver/). Swatchbook can also work from a list of token files if you have no resolver yet.

## Install the addon

```sh
npm install -D @unpunnyfuns/swatchbook-addon
```

The addon pulls in Swatchbook's core loader, doc blocks and theme switcher, as well as Terrazzo's parser, CSS plugin and Token Listing plugin.

## Register it

Point the addon at your resolver in `.storybook/main.ts` and pick a prefix for the CSS variables it emits in the preview.

```ts title=".storybook/main.ts"
import { defineMain } from '@storybook/react-vite/node';

export default defineMain({
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    {
      name: '@unpunnyfuns/swatchbook-addon',
      options: {
        config: {
          resolver: 'tokens/tokens.resolver.json',
          cssVarPrefix: 'ds',
        },
      },
    },
  ],
});
```

Then opt the preview into the addon's decorator and globals.

```ts title=".storybook/preview.ts"
import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';
import swatchbookAddon from '@unpunnyfuns/swatchbook-addon';

export default definePreview({
  addons: [addonDocs(), swatchbookAddon()],
});
```

Start Storybook. A Swatchbook button appears in the toolbar with one dropdown per resolver modifier.

If you prefer to keep the configuration in its own file, for example to share it with a CI job, create `swatchbook.config.ts` with `defineSwatchbookConfig` from `@unpunnyfuns/swatchbook-core` and pass `options.configPath` instead of `options.config`.

## Render tokens on a docs page

Create an MDX file under your stories glob and drop in the blocks you want.

```mdx title="src/docs/Tokens.mdx"
import { Meta } from '@storybook/addon-docs/blocks';
import { ColorPalette, ColorTable, DimensionScale, TokenDetail, TokenTable, TypographyScale } from '@unpunnyfuns/swatchbook-addon';

<Meta title="Tokens/Overview" />

# Design tokens

## Colors

<ColorPalette filter="color.**" />

## Semantic colors, one row per role

<ColorTable filter="color.semantic.**" />

## Spacing

<DimensionScale filter="space.**" />

## Typography

<TypographyScale filter="typography.**" />

## Everything

<TokenTable filter="**" />

## One token in depth

<TokenDetail path="color.text.primary" />
```

Every block repaints when you flip an axis in the toolbar. `TokenDetail` shows the alias chain, which tokens alias this one, how the value varies per axis, and a consumer output section listing the token's name on each platform in the listing.

To put the catalogue in the sidebar instead of an MDX page, mount a block as a story:

```tsx title="src/stories/tokens/Colors.stories.tsx"
import { ColorTable } from '@unpunnyfuns/swatchbook-addon';
import preview from '../../../.storybook/preview';

const meta = preview.meta({ title: 'Tokens/Colors', component: ColorTable });
export default meta;

export const Palette = meta.story({ args: { filter: 'color.**' } });
```

## Show names for more platforms

Out of the box the listing Swatchbook builds has one platform, `css`. To display Sass, Swift, Android or any other identifier next to each token, register the platform in `listingOptions` and load the matching Terrazzo plugin in `terrazzoPlugins`. Both are needed: the plugin computes the names, the platform entry tells the listing to record them.

```ts title="swatchbook.config.ts"
import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';
import swiftPlugin from '@terrazzo/plugin-swift';

export default defineSwatchbookConfig({
  resolver: 'tokens/tokens.resolver.json',
  cssVarPrefix: 'ds',
  listingOptions: {
    platforms: {
      css: { name: '@terrazzo/plugin-css', description: 'CSS custom properties' },
      swift: { name: '@terrazzo/plugin-swift', description: 'SwiftUI Color' },
    },
  },
  terrazzoPlugins: [swiftPlugin({ filename: 'tokens.swift' })],
});
```

`listingOptions` accepts everything the [Terrazzo listing plugin](/how-to/terrazzo/) accepts except `filename`: `platforms`, `modes`, `sourceOfTruth`, `subtype` and `previewValue`. Pass the plugin invocations with the same options as your production build, or the names shown in Storybook will differ from the ones you ship.

## Keep Storybook and the production build aligned

If you also run `tz build` for production, put the options both builds share in one module and import it from both configs. That way a change to the CSS plugin's options, or a new platform, reaches Storybook and the shipped files in one edit.

```ts title="shared-terrazzo-options.ts"
import type { TokenListingPluginOptions } from '@terrazzo/plugin-token-listing';
import swiftPlugin from '@terrazzo/plugin-swift';

export const cssVarPrefix = 'ds';

export const sharedPlugins = [swiftPlugin({ filename: 'tokens.swift' })];

export const sharedListingOptions: Omit<TokenListingPluginOptions, 'filename'> = {
  platforms: {
    css: { name: '@terrazzo/plugin-css', description: 'CSS custom properties' },
    swift: { name: '@terrazzo/plugin-swift', description: 'SwiftUI Color' },
  },
  sourceOfTruth: 'figma',
};
```

```ts title="terrazzo.config.ts"
import { defineConfig } from '@terrazzo/cli';
import css from '@terrazzo/plugin-css';
import listing from '@terrazzo/plugin-token-listing';
import { makeCSSVar } from '@terrazzo/token-tools/css';
import { cssVarPrefix, sharedListingOptions, sharedPlugins } from './shared-terrazzo-options';

export default defineConfig({
  tokens: ['tokens/tokens.resolver.json'],
  outDir: 'dist',
  plugins: [
    css({ filename: 'tokens.css', variableName: (token) => makeCSSVar(String(token.id), { prefix: cssVarPrefix }) }),
    ...sharedPlugins,
    listing({ ...sharedListingOptions, filename: 'tokens.listing.json' }),
  ],
});
```

```ts title="swatchbook.config.ts"
import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';
import { cssVarPrefix, sharedListingOptions, sharedPlugins } from './shared-terrazzo-options';

export default defineSwatchbookConfig({
  resolver: 'tokens/tokens.resolver.json',
  cssVarPrefix,
  listingOptions: sharedListingOptions,
  terrazzoPlugins: sharedPlugins,
});
```

Swatchbook owns CSS variable naming through `cssVarPrefix`, so the production CSS plugin has to reproduce that naming with `variableName`, as above. Swatchbook's [alignment guide](https://unpunnyfuns.github.io/swatchbook/guides/sharing-terrazzo-options) covers the remaining shared options.

## Troubleshooting

- **A platform column is empty.** The plugin named in `listingOptions.platforms` is not in `terrazzoPlugins`, or the two resolve to different copies of `@terrazzo/parser`. Check that your lockfile has a single version of the parser.
- **Values look different from production.** Swatchbook's CSS plugin runs with default options. Forward your production options through `cssOptions`, for example `{ legacyHex: true }`.
- **No modes in the toolbar.** Swatchbook takes axes from the resolver's modifiers. Without a resolver, declare them in the layered form with `tokens` and `axes`.

## Reference

- [Swatchbook quickstart](https://unpunnyfuns.github.io/swatchbook/quickstart) and [config reference](https://unpunnyfuns.github.io/swatchbook/reference/config)
- [Starter project](https://github.com/unpunnyfuns/swatchbook-example)
- [Generate a Token Listing with Terrazzo](/how-to/terrazzo/) for every listing option
