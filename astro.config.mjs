// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://token-listing.org',
	redirects: {
		'/overview/': '/explanation/why-token-listing/',
		'/versioning/': '/explanation/design-decisions/#forward-compatibility-and-versioning',
	},
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
				{
					label: 'Tutorials',
					items: [
						{ label: 'Build your first Token Listing', slug: 'tutorials/first-listing' },
						{ label: 'Read a Token Listing in your own tool', slug: 'tutorials/read-a-listing' },
					],
				},
				{
					label: 'How-to guides',
					items: [
						{ label: 'Show tokens in Storybook with Swatchbook', slug: 'how-to/storybook-swatchbook' },
						{ label: 'Generate with Terrazzo', slug: 'how-to/terrazzo' },
						{ label: 'Generate with Style Dictionary', slug: 'how-to/style-dictionary', badge: { text: 'Stub', variant: 'caution' } },
					],
				},
				{
					label: 'Understanding',
					items: [
						{ label: 'Why Token Listing exists', slug: 'explanation/why-token-listing' },
						{ label: 'Token Listing and DTCG', slug: 'explanation/token-listing-and-dtcg' },
						{ label: 'Modes, platforms and provenance', slug: 'explanation/modes-platforms-and-provenance' },
						{ label: 'Design decisions', slug: 'explanation/design-decisions' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Specification', slug: 'spec' },
						{ label: 'Examples', slug: 'examples' },
						{ label: 'Glossary', slug: 'glossary' },
						{ label: 'JSON Schema', link: '/schema.json' },
					],
				},
			],
		}),
	],
});
