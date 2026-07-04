// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://token-listing.org',
	integrations: [
		starlight({
			title: 'Token Listing',
			description: 'The design-token interchange format for build tools.',
			social: [
				{
					icon: 'github',
					label: 'RFC Discussion',
					href: 'https://github.com/style-dictionary/style-dictionary/discussions/1479',
				},
			],
			customCss: ['./src/styles/custom.css'],
			expressiveCode: {
				themes: ['dracula', 'github-light'],
			},
			sidebar: [
				{ label: 'Overview', slug: 'overview' },
				{ label: 'Specification', slug: 'spec' },
				{ label: 'Examples', slug: 'examples' },
				{ label: 'Versioning', slug: 'versioning' },
				{ label: 'Glossary', slug: 'glossary' },
			],
		}),
	],
});
