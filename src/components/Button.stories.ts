import Button from './Button.astro';

export default {
  title: 'Brand/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'auxiliary'] },
    iconPosition: { control: 'select', options: ['start', 'end'] },
    href: { control: 'text' },
    icon: { control: 'text' },
  },
  args: { href: '#', variant: 'primary', icon: 'ph:rocket-launch', iconPosition: 'end', slots: { default: 'Get started' } },
};

export const Primary = {};
export const Secondary = { args: { variant: 'secondary', icon: 'ph:book-open-text', slots: { default: 'Read the spec' } } };
export const Auxiliary = { args: { variant: 'auxiliary', icon: undefined, slots: { default: 'Learn more' } } };
export const IconStart = { args: { iconPosition: 'start' } };
export const NoIcon = { args: { icon: undefined } };
export const AsButtonElement = { args: { href: undefined, slots: { default: 'Submit' } } };
