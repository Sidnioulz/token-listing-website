import IconChip from './IconChip.astro';

export default {
  title: 'Brand/IconChip',
  component: IconChip,
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] }, name: { control: 'text' } },
  args: { name: 'ph:sparkle', size: 'md' },
};

export const Medium = {};
export const Small = { args: { size: 'sm' } };
export const Large = { args: { size: 'lg' } };
export const Phosphor = { args: { name: 'ph:shield-check' } };
export const OriginalExtra = { args: { name: 'original/lucide-bot' } };
export const AdjustedExtra = { args: { name: 'adjusted/lucide-bot' } };
