/**
 * @typedef {import('../types/index.d.ts').TokenListingModeOption} TokenListingModeOption
 * @typedef {import('../types/index.d.ts').ResolverDocument} ResolverDocument
 */

/**
 * Derives a Token Listing mode catalog from the modifiers of a DTCG Resolver document
 * (https://www.designtokens.org/tr/drafts/resolver/): one mode per modifier, with the
 * modifier's context names as values.
 *
 * Useful to keep `meta.modes` in sync with the resolver that drives multi-context builds,
 * e.g. `mergeTokenListings(inputs, { modes: modesFromResolver(resolver) })`.
 *
 * @param {ResolverDocument} resolver
 * @returns {TokenListingModeOption[]}
 */
export default function modesFromResolver(resolver) {
  if (!resolver || typeof resolver !== 'object') {
    throw new Error('modesFromResolver: pass a resolver document object.');
  }
  const modifiers = resolver.modifiers ?? {};
  if (typeof modifiers !== 'object' || Array.isArray(modifiers)) {
    throw new Error('modesFromResolver: "modifiers" must be an object mapping modifier names.');
  }

  return Object.entries(modifiers).map(([name, modifier]) => {
    const contexts = modifier?.contexts;
    if (!contexts || typeof contexts !== 'object' || Object.keys(contexts).length === 0) {
      throw new Error(
        `modesFromResolver: modifier "${name}" has no "contexts"; each modifier must declare a map of context names.`,
      );
    }
    if (modifier.default !== undefined && !Object.hasOwn(contexts, modifier.default)) {
      throw new Error(
        `modesFromResolver: the default "${modifier.default}" of modifier "${name}" is not one of its contexts.`,
      );
    }
    return {
      name,
      values: Object.keys(contexts),
      ...(typeof modifier.description === 'string' && modifier.description !== ''
        ? { description: modifier.description }
        : {}),
      ...(modifier.default !== undefined ? { default: modifier.default } : {}),
    };
  });
}
