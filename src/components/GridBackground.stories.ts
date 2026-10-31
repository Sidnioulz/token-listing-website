import GridBackground from './GridBackground.astro';

export default {
  title: 'Brand/GridBackground',
  component: GridBackground,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    cell: { control: 'text' },
    lineAlpha: { control: { type: 'range', min: 0, max: 0.6, step: 0.005 } },
    spotLineAlpha: { control: { type: 'range', min: 0, max: 0.6, step: 0.01 } },
    spotRadius: { control: 'text' },
    spotSoftness: { control: 'text' },
    spotIntensity: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    spotBloom: { control: { type: 'range', min: 0, max: 0.3, step: 0.01 } },
    spotFollow: { control: { type: 'range', min: 0.01, max: 1, step: 0.01 } },
    breathePeriod: { control: 'text' },
    breatheAmount: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    scrollRate: { control: { type: 'range', min: 0, max: 4, step: 0.25 } },
  },
  args: { position: 'absolute', cell: '40px', lineAlpha: 0.055, spotLineAlpha: 0.2, spotRadius: '110vmax', spotSoftness: '0%', spotIntensity: 0.35, spotBloom: 0.05, spotFollow: 0.3, breathePeriod: '8s', breatheAmount: 0.35, scrollRate: 0.333 },
  decorators: [
    (story: () => unknown) => `<div style="position:relative;min-height:400vh;background:var(--tl-surface-primary-background)">${story()}<p style="position:sticky;top:0;margin:0;padding:3rem;color:var(--tl-text-auxiliary-foreground);font-family:var(--tl-font-mono)">Move the pointer: the lime tint follows it. Scroll: cells grow by the scroll rate per viewport height, anchored to the bottom edge.</p></div>`,
  ],
};

export const Default = {};
export const Louder = { args: { lineAlpha: 0.12, spotLineAlpha: 0.4, spotIntensity: 0.8, spotBloom: 0.15, spotRadius: '50vmax' } };
export const Still = { args: { spotFollow: 1, breatheAmount: 0, scrollRate: 0 } };
export const FastGrowth = { args: { scrollRate: 1 } };
