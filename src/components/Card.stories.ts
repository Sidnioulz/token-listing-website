import Card from './Card.astro';

export default {
  title: 'Brand/Card',
  component: Card,
  argTypes: { title: { control: 'text' }, icon: { control: 'text' }, href: { control: 'text' } },
  args: {
    title: 'Interoperable',
    icon: 'ph:plugs-connected',
    slots: { default: "Any compliant translator's output is consumable by any compliant consumer. Switch tools without rewriting your token data pipelines." },
  },
};

export const Default = {};
export const AsLink = { args: { href: '#', title: 'Tutorials', icon: 'ph:graduation-cap', slots: { default: 'Learn by doing. Build your first Token Listing with Terrazzo.' } } };
export const WithLinksInBody = {
  args: {
    title: 'Reference',
    icon: 'ph:book-bookmark',
    slots: { default: 'The normative <a href="#">specification</a>, annotated <a href="#">examples</a>, the <a href="#">glossary</a> and the <a href="#">JSON Schema</a>.' },
  },
};
export const AdjustedIcon = { args: { title: 'MCP servers', icon: 'adjusted/tabler-robot', slots: { default: 'Expose structured token data to AI assistants and agent-based tooling.' } } };
export const NoIcon = { args: { icon: undefined } };
