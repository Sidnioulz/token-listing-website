import type { StorybookConfig } from '@storybook-astro/framework';

const config: StorybookConfig = {
  stories: ['../src/brand/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: { name: '@storybook-astro/framework', options: {} },
  viteFinal(viteConfig) {
    // Starlight brings @astrojs/mdx along. Its Vite plugin would compile the brand MDX pages
    // (which are Storybook docs, not Astro content), so drop it and let addon-docs handle .mdx.
    const flat = (viteConfig.plugins ?? []).flat(Infinity) as { name?: string }[];
    viteConfig.plugins = flat.filter((p) => !(p && typeof p.name === 'string' && /mdx/.test(p.name) && !/storybook/.test(p.name)));
    viteConfig.plugins.push({
      // Starlight injects a client script that imports astro:prefetch. Astro's own Vite plugin
      // (astro:prefetch) would replace these placeholders, but the framework drops that plugin.
      name: 'tl:astro-prefetch-placeholders',
      transform(code, id) {
        if (!id.includes('astro/dist/prefetch/')) return;
        return code
          .replace('__PREFETCH_PREFETCH_ALL__', 'false')
          .replace('__PREFETCH_DEFAULT_STRATEGY__', '"hover"')
          .replace('__EXPERIMENTAL_CLIENT_PRERENDER__', 'false');
      },
    });
    return viteConfig;
  },
};

export default config;
