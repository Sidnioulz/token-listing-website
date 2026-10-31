import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { modesFromResolver } from '../src/index.js';

describe('modesFromResolver', () => {
  it('derives one mode per modifier with context names as values', () => {
    const modes = modesFromResolver({
      version: '2025.10',
      sets: { foundation: { sources: [] } },
      modifiers: {
        theme: {
          description: 'Color theme',
          contexts: { light: [], dark: [] },
          default: 'light',
        },
        device: {
          contexts: { mobile: [], desktop: [] },
        },
      },
    });
    assert.deepEqual(modes, [
      { name: 'theme', values: ['light', 'dark'], description: 'Color theme', default: 'light' },
      { name: 'device', values: ['mobile', 'desktop'] },
    ]);
  });

  it('returns an empty catalog for resolvers without modifiers', () => {
    assert.deepEqual(modesFromResolver({ version: '2025.10' }), []);
  });

  it('throws on invalid resolvers and modifiers', () => {
    assert.throws(() => modesFromResolver(null), /pass a resolver document/);
    assert.throws(
      () => modesFromResolver({ modifiers: { theme: { contexts: {} } } }),
      /modifier "theme" has no "contexts"/,
    );
    assert.throws(
      () => modesFromResolver({ modifiers: { theme: { contexts: { light: [] }, default: 'dark' } } }),
      /default "dark" of modifier "theme" is not one of its contexts/,
    );
  });
});
