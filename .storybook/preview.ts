import './preview.css';

export default {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
    backgrounds: { disable: true },
  },
};
