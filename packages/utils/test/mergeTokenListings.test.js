import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeTokenListings } from '../src/index.js';

/**
 * Builds a minimal valid listing with the passed meta fields and data entries.
 */
function listing(metaOverrides = {}, data = []) {
  return {
    meta: { version: 1, authoringTool: 'Style Dictionary', ...metaOverrides },
    data,
  };
}

/**
 * Builds a minimal listed token.
 */
function token(name, value, listingOverrides = {}) {
  return {
    $name: name,
    $type: 'color',
    $value: value,
    $extensions: { listing: { platforms: {}, ...listingOverrides } },
  };
}

describe('mergeTokenListings', () => {
  describe('inputs', () => {
    it('throws on empty or non-array inputs', () => {
      assert.throws(() => mergeTokenListings([]), /non-empty array/);
      assert.throws(() => mergeTokenListings('nope'), /non-empty array/);
    });

    it('throws on inputs that are not listings', () => {
      assert.throws(() => mergeTokenListings([{ foo: 'bar' }]), /inputs\[0\] is not a Token Listing/);
    });

    it('throws on unsupported versions', () => {
      assert.throws(
        () => mergeTokenListings([listing({ version: 2 })]),
        /version 2.*only Token Listing Format version 1/,
      );
    });

    it('accepts bare listings and { listing, mode } wrappers alike', () => {
      const merged = mergeTokenListings([
        listing({}, [token('color.a', '#000')]),
        { listing: listing({}, [token('color.b', '#fff')]), mode: 'dark' },
      ]);
      assert.equal(merged.data.length, 2);
    });
  });

  describe('meta', () => {
    it('emits version 1 and the shared authoring tool', () => {
      const merged = mergeTokenListings([listing(), listing()]);
      assert.equal(merged.meta.version, 1);
      assert.equal(merged.meta.authoringTool, 'Style Dictionary');
    });

    it('throws when authoring tools differ, unless overridden', () => {
      const inputs = [listing(), listing({ authoringTool: 'Terrazzo' })];
      assert.throws(() => mergeTokenListings(inputs), /different tools/);
      const merged = mergeTokenListings(inputs, { authoringTool: 'my-merger' });
      assert.equal(merged.meta.authoringTool, 'my-merger');
    });

    it('merges mode catalogs by name, unioning values and keeping agreed defaults', () => {
      const merged = mergeTokenListings([
        listing({ modes: [{ name: 'theme', values: ['light'], default: 'light' }] }),
        listing({
          modes: [{ name: 'theme', values: ['dark'], default: 'light', description: 'Theme' }],
        }),
      ]);
      assert.deepEqual(merged.meta.modes, [
        { name: 'theme', values: ['light', 'dark'], default: 'light', description: 'Theme' },
      ]);
    });

    it('throws on conflicting mode defaults', () => {
      assert.throws(
        () =>
          mergeTokenListings([
            listing({ modes: [{ name: 'theme', values: ['light', 'dark'], default: 'light' }] }),
            listing({ modes: [{ name: 'theme', values: ['light', 'dark'], default: 'dark' }] }),
          ]),
        /conflicting defaults/,
      );
    });

    it('prefers the modes option over derived catalogs', () => {
      const modes = [{ name: 'density', values: ['compact', 'cozy'] }];
      const merged = mergeTokenListings(
        [listing({ modes: [{ name: 'theme', values: ['light'] }] }, [token('color.a', '#000')])],
        { modes },
      );
      assert.deepEqual(merged.meta.modes, modes);
    });

    it('merges platforms and groups, requiring identical same-key entries', () => {
      const merged = mergeTokenListings([
        listing({ platforms: { css: { description: 'CSS' } }, groups: { color: { description: 'Colors' } } }),
        listing({ platforms: { js: {} }, groups: { color: { description: 'Colors' } } }),
      ]);
      assert.deepEqual(merged.meta.platforms, { css: { description: 'CSS' }, js: {} });
      assert.deepEqual(merged.meta.groups, { color: { description: 'Colors' } });

      assert.throws(
        () =>
          mergeTokenListings([
            listing({ platforms: { css: { description: 'CSS' } } }),
            listing({ platforms: { css: { description: 'Cascading Style Sheets' } } }),
          ]),
        /"meta\.platforms\.css" differs/,
      );
    });

    it('keeps the shared source of truth and throws on disagreement, unless overridden', () => {
      const merged = mergeTokenListings([listing({ sourceOfTruth: 'figma' }), listing()]);
      assert.equal(merged.meta.sourceOfTruth, 'figma');

      const conflicting = [listing({ sourceOfTruth: 'figma' }), listing({ sourceOfTruth: 'css' })];
      assert.throws(() => mergeTokenListings(conflicting), /different sources of truth/);
      assert.equal(
        mergeTokenListings(conflicting, { sourceOfTruth: 'css' }).meta.sourceOfTruth,
        'css',
      );
    });

    it('omits empty meta fields', () => {
      const merged = mergeTokenListings([listing()]);
      assert.ok(!('modes' in merged.meta));
      assert.ok(!('platforms' in merged.meta));
      assert.ok(!('groups' in merged.meta));
      assert.ok(!('sourceOfTruth' in merged.meta));
    });
  });

  describe('mode stamping', () => {
    it('stamps the input mode onto entries without one', () => {
      const merged = mergeTokenListings([
        { listing: listing({}, [token('color.bg', '#fff')]), mode: 'light' },
        { listing: listing({}, [token('color.bg', '#000')]), mode: 'dark' },
      ]);
      assert.deepEqual(
        merged.data.map((entry) => entry.$extensions.listing.mode),
        ['light', 'dark'],
      );
    });

    it('never overrides an entry-level mode', () => {
      const merged = mergeTokenListings([
        { listing: listing({}, [token('color.bg', '#888', { mode: 'dim' })]), mode: 'dark' },
      ]);
      assert.equal(merged.data[0].$extensions.listing.mode, 'dim');
    });

    it('treats "." and empty input modes as the default mode', () => {
      const merged = mergeTokenListings([
        { listing: listing({}, [token('color.bg', '#fff')]), mode: '.' },
      ]);
      assert.ok(!('mode' in merged.data[0].$extensions.listing));
    });

    it('does not mutate the input listings', () => {
      const input = listing({}, [token('color.bg', '#fff')]);
      mergeTokenListings([{ listing: input, mode: 'dark' }]);
      assert.ok(!('mode' in input.data[0].$extensions.listing));
    });

    it('throws for modes missing from the merged catalog', () => {
      assert.throws(
        () =>
          mergeTokenListings([
            {
              listing: listing({ modes: [{ name: 'theme', values: ['light', 'dark'] }] }, [
                token('color.bg', '#fff'),
              ]),
              mode: 'blue',
            },
          ]),
        /mode "blue" of token "color.bg"/,
      );
    });
  });

  describe('entry reconciliation', () => {
    it('deduplicates identical entries', () => {
      const merged = mergeTokenListings([
        listing({}, [token('color.a', '#000')]),
        listing({}, [token('color.a', '#000')]),
      ]);
      assert.equal(merged.data.length, 1);
    });

    it('keeps same-name entries with different modes apart', () => {
      const merged = mergeTokenListings([
        { listing: listing({}, [token('color.a', '#fff')]), mode: 'light' },
        { listing: listing({}, [token('color.a', '#000')]), mode: 'dark' },
      ]);
      assert.equal(merged.data.length, 2);
    });

    it('throws on conflicting duplicates by default', () => {
      assert.throws(
        () =>
          mergeTokenListings([
            listing({}, [token('color.a', '#000')]),
            listing({}, [token('color.a', '#111')]),
          ]),
        /token "color.a" appears in several listings/,
      );
    });

    it('resolves conflicting duplicates per the onConflict option', () => {
      const inputs = () => [
        listing({}, [token('color.a', '#000')]),
        listing({}, [token('color.a', '#111')]),
      ];
      assert.equal(mergeTokenListings(inputs(), { onConflict: 'first' }).data[0].$value, '#000');
      assert.equal(mergeTokenListings(inputs(), { onConflict: 'last' }).data[0].$value, '#111');
      assert.throws(
        () => mergeTokenListings(inputs(), { onConflict: 'maybe' }),
        /"onConflict" must be one of/,
      );
    });
  });
});
