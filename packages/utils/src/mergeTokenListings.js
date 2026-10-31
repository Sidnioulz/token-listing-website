/**
 * @typedef {import('../types/index.d.ts').TokenListing} TokenListing
 * @typedef {import('../types/index.d.ts').TokenListingMeta} TokenListingMeta
 * @typedef {import('../types/index.d.ts').TokenListingModeOption} TokenListingModeOption
 * @typedef {import('../types/index.d.ts').ListedToken} ListedToken
 * @typedef {import('../types/index.d.ts').MergeTokenListingsInput} MergeTokenListingsInput
 * @typedef {import('../types/index.d.ts').MergeTokenListingsOptions} MergeTokenListingsOptions
 */

const TOKEN_LISTING_VERSION = 1;
const DEFAULT_MODE = '.';

/**
 * @param {string} message
 * @returns {Error}
 */
function mergeError(message) {
  return new Error(`mergeTokenListings: ${message}`);
}

/**
 * Structural deep equality for JSON-compatible values.
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (a && b && typeof a === 'object') {
    const aRecord = /** @type {Record<string, unknown>} */ (a);
    const bRecord = /** @type {Record<string, unknown>} */ (b);
    const aKeys = Object.keys(aRecord);
    const bKeys = Object.keys(bRecord);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(
      (key) => Object.hasOwn(bRecord, key) && deepEqual(aRecord[key], bRecord[key]),
    );
  }
  return false;
}

/**
 * @param {MergeTokenListingsInput} input
 * @param {number} index
 * @returns {{ listing: TokenListing, mode: string | undefined }}
 */
function normalizeInput(input, index) {
  const wrapper =
    input && typeof input === 'object' && 'listing' in input
      ? /** @type {{ listing: TokenListing, mode?: string }} */ (input)
      : { listing: /** @type {TokenListing} */ (input), mode: undefined };

  const { listing, mode } = wrapper;
  if (
    !listing ||
    typeof listing !== 'object' ||
    typeof listing.meta !== 'object' ||
    !Array.isArray(listing.data)
  ) {
    throw mergeError(
      `inputs[${index}] is not a Token Listing document; expected an object with "meta" and "data", or a { listing, mode } wrapper.`,
    );
  }
  if (listing.meta.version !== TOKEN_LISTING_VERSION) {
    throw mergeError(
      `inputs[${index}] has version ${JSON.stringify(
        listing.meta.version,
      )}; only Token Listing Format version ${TOKEN_LISTING_VERSION} documents can be merged.`,
    );
  }
  if (mode !== undefined && typeof mode !== 'string') {
    throw mergeError(`the mode of inputs[${index}] must be a string, got ${typeof mode}.`);
  }
  return {
    listing,
    mode: mode === '' || mode === DEFAULT_MODE ? undefined : mode,
  };
}

/**
 * @param {Array<{ listing: TokenListing }>} inputs
 * @param {MergeTokenListingsOptions} options
 * @returns {string}
 */
function mergeAuthoringTool(inputs, options) {
  if (options.authoringTool !== undefined) {
    if (typeof options.authoringTool !== 'string' || options.authoringTool === '') {
      throw mergeError('"authoringTool" must be a non-empty string.');
    }
    return options.authoringTool;
  }
  const tools = [...new Set(inputs.map(({ listing }) => listing.meta.authoringTool))];
  if (tools.length > 1) {
    throw mergeError(
      `the listings were produced by different tools (${tools.join(
        ', ',
      )}); pass "authoringTool" to name the merged document's producer.`,
    );
  }
  return tools[0];
}

/**
 * Merges the mode catalogs of all listings: same-name modes have their values unioned, take
 * the first defined description, and must agree on their default.
 *
 * @param {Array<{ listing: TokenListing }>} inputs
 * @param {MergeTokenListingsOptions} options
 * @returns {TokenListingModeOption[]}
 */
function mergeModes(inputs, options) {
  if (options.modes !== undefined) {
    if (!Array.isArray(options.modes)) {
      throw mergeError('"modes" must be an array of mode definitions.');
    }
    return options.modes;
  }
  /** @type {Map<string, TokenListingModeOption>} */
  const modesByName = new Map();
  for (const { listing } of inputs) {
    for (const mode of listing.meta.modes ?? []) {
      const existing = modesByName.get(mode.name);
      if (!existing) {
        modesByName.set(mode.name, {
          name: mode.name,
          values: [...mode.values],
          ...(mode.description !== undefined ? { description: mode.description } : {}),
          ...(mode.default !== undefined ? { default: mode.default } : {}),
        });
        continue;
      }
      for (const value of mode.values) {
        if (!existing.values.includes(value)) {
          existing.values.push(value);
        }
      }
      if (existing.description === undefined && mode.description !== undefined) {
        existing.description = mode.description;
      }
      if (mode.default !== undefined) {
        if (existing.default !== undefined && existing.default !== mode.default) {
          throw mergeError(
            `mode "${mode.name}" has conflicting defaults across listings ("${existing.default}" vs "${mode.default}").`,
          );
        }
        existing.default = mode.default;
      }
    }
  }
  return [...modesByName.values()];
}

/**
 * Merges a map-shaped meta field (platforms or groups), requiring same-key entries to be
 * identical across listings.
 *
 * @param {Array<{ listing: TokenListing }>} inputs
 * @param {'platforms' | 'groups'} field
 * @returns {Record<string, object>}
 */
function mergeMetaMap(inputs, field) {
  /** @type {Record<string, object>} */
  const merged = {};
  for (const { listing } of inputs) {
    for (const [key, entry] of Object.entries(listing.meta[field] ?? {})) {
      if (!Object.hasOwn(merged, key)) {
        merged[key] = entry;
      } else if (!deepEqual(merged[key], entry)) {
        throw mergeError(
          `"meta.${field}.${key}" differs across listings (${JSON.stringify(
            merged[key],
          )} vs ${JSON.stringify(entry)}).`,
        );
      }
    }
  }
  return merged;
}

/**
 * @param {Array<{ listing: TokenListing }>} inputs
 * @param {MergeTokenListingsOptions} options
 * @returns {string | undefined}
 */
function mergeSourceOfTruth(inputs, options) {
  if (options.sourceOfTruth !== undefined) {
    if (typeof options.sourceOfTruth !== 'string' || options.sourceOfTruth === '') {
      throw mergeError('"sourceOfTruth" must be a non-empty string.');
    }
    return options.sourceOfTruth;
  }
  const defined = [
    ...new Set(
      inputs
        .map(({ listing }) => listing.meta.sourceOfTruth)
        .filter((sourceOfTruth) => sourceOfTruth !== undefined),
    ),
  ];
  if (defined.length > 1) {
    throw mergeError(
      `the listings declare different sources of truth (${defined.join(
        ', ',
      )}); pass "sourceOfTruth" to pick the merged document's one.`,
    );
  }
  return defined[0];
}

/**
 * Returns the entry as-is when it already carries the wanted mode, or a copy stamped with the
 * input's mode. Never mutates the source listing.
 *
 * @param {ListedToken} entry
 * @param {string | undefined} inputMode
 * @returns {ListedToken}
 */
function withMode(entry, inputMode) {
  const entryMode = entry.$extensions?.listing?.mode;
  if (inputMode === undefined || entryMode !== undefined) {
    return entry;
  }
  return {
    ...entry,
    $extensions: {
      ...entry.$extensions,
      listing: {
        ...entry.$extensions.listing,
        mode: inputMode,
      },
    },
  };
}

/**
 * Merges several Token Listing documents into one, typically partial listings produced by one
 * build per mode context (e.g. a light build and a dark build).
 *
 * Entries are identified by their `$name` and mode: an entry without a mode takes the mode of
 * the input it came from (pass `{ listing, mode }` wrappers to label unstamped partial
 * listings). Identical duplicate entries are deduplicated; conflicting duplicates are handled
 * per the `onConflict` option.
 *
 * @param {MergeTokenListingsInput[]} inputs
 * @param {MergeTokenListingsOptions} [options]
 * @returns {TokenListing}
 */
export default function mergeTokenListings(inputs, options = {}) {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw mergeError('pass a non-empty array of Token Listing documents to merge.');
  }
  const onConflict = options.onConflict ?? 'error';
  if (!['error', 'first', 'last'].includes(onConflict)) {
    throw mergeError(`"onConflict" must be one of "error", "first" or "last", got "${onConflict}".`);
  }

  const normalized = inputs.map(normalizeInput);

  /** @type {TokenListingMeta} */
  const meta = {
    version: TOKEN_LISTING_VERSION,
    authoringTool: mergeAuthoringTool(normalized, options),
  };
  const modes = mergeModes(normalized, options);
  if (modes.length > 0) {
    meta.modes = modes;
  }
  const platforms = mergeMetaMap(normalized, 'platforms');
  if (Object.keys(platforms).length > 0) {
    meta.platforms = platforms;
  }
  const groups = mergeMetaMap(normalized, 'groups');
  if (Object.keys(groups).length > 0) {
    meta.groups = groups;
  }
  const sourceOfTruth = mergeSourceOfTruth(normalized, options);
  if (sourceOfTruth !== undefined) {
    meta.sourceOfTruth = sourceOfTruth;
  }

  const knownModeValues = new Set(modes.flatMap((mode) => mode.values));

  /** @type {Map<string, ListedToken>} */
  const entriesByIdentity = new Map();
  for (const { listing, mode: inputMode } of normalized) {
    for (const sourceEntry of listing.data) {
      const entry = withMode(sourceEntry, inputMode);
      const entryMode = entry.$extensions?.listing?.mode;
      if (entryMode !== undefined && knownModeValues.size > 0 && !knownModeValues.has(entryMode)) {
        throw mergeError(
          `mode "${entryMode}" of token "${entry.$name}" is not part of the merged mode values; declare it in a listing's "meta.modes" or in the "modes" option.`,
        );
      }
      const identity = `${entry.$name} ${entryMode ?? ''}`;
      const existing = entriesByIdentity.get(identity);
      if (existing === undefined) {
        entriesByIdentity.set(identity, entry);
      } else if (!deepEqual(existing, entry)) {
        if (onConflict === 'error') {
          throw mergeError(
            `token "${entry.$name}"${
              entryMode !== undefined ? ` in mode "${entryMode}"` : ''
            } appears in several listings with different content; pass "onConflict" to pick a resolution strategy.`,
          );
        }
        if (onConflict === 'last') {
          entriesByIdentity.set(identity, entry);
        }
      }
    }
  }

  return { meta, data: [...entriesByIdentity.values()] };
}
