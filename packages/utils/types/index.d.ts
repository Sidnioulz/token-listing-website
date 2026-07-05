/**
 * Types for the Token Listing Format v1 (https://token-listing.org) and the utilities of
 * this package. Standalone on purpose: the format is tool-agnostic, so this package depends
 * on no producer.
 */

export type TokenListingSubtype =
  | 'bgColor'
  | 'fgColor'
  | 'borderColor'
  | 'padding'
  | 'margin'
  | 'gap'
  | 'size'
  | 'borderWidth'
  | 'borderRadius';

export interface TokenListingModeOption {
  name: string;
  values: string[];
  description?: string;
  default?: string;
}

export interface ListedTokenPlatform {
  name: string;
  value?: string;
  deprecated?: string | boolean;
}

export interface TokenListingExtension {
  platforms: Record<string, ListedTokenPlatform>;
  aliasChain?: string[];
  previewValue?: string;
  subtype?: TokenListingSubtype;
  mode?: string;
  sourceOfTruth?: string;
  source?: {
    $ref: string;
    via?: string;
    loc?: {
      start: { line: number; column: number; offset: number };
      end: { line: number; column: number; offset: number };
    };
  };
}

export interface ListedToken {
  $name: string;
  $type: string;
  $value: unknown;
  $description?: string;
  $deprecated?: string | boolean;
  $extensions: {
    listing: TokenListingExtension;
  };
}

export interface TokenListingMeta {
  version: number;
  authoringTool: string;
  modes?: TokenListingModeOption[];
  platforms?: Record<string, { description?: string }>;
  groups?: Record<string, { description?: string; deprecated?: string | boolean }>;
  sourceOfTruth?: string;
}

export interface TokenListing {
  meta: TokenListingMeta;
  data: ListedToken[];
}

/**
 * A listing to merge, optionally wrapped to label the mode its entries belong to. The mode
 * only applies to entries that do not already carry one.
 */
export type MergeTokenListingsInput = TokenListing | { listing: TokenListing; mode?: string };

export interface MergeTokenListingsOptions {
  /** Producer name of the merged document. Required when the inputs disagree. */
  authoringTool?: string;
  /** Mode catalog of the merged document. Defaults to merging the inputs' catalogs. */
  modes?: TokenListingModeOption[];
  /** Source of truth of the merged document. Required when the inputs disagree. */
  sourceOfTruth?: string;
  /**
   * What to do when the same token (same `$name` and mode) appears in several listings with
   * different content. Defaults to `'error'`.
   */
  onConflict?: 'error' | 'first' | 'last';
}

/** The subset of a DTCG Resolver document (2025.10) read by `modesFromResolver`. */
export interface ResolverDocument {
  modifiers?: Record<
    string,
    {
      contexts: Record<string, unknown>;
      default?: string;
      description?: string;
    }
  >;
  [key: string]: unknown;
}

export function mergeTokenListings(
  inputs: MergeTokenListingsInput[],
  options?: MergeTokenListingsOptions,
): TokenListing;

export function modesFromResolver(resolver: ResolverDocument): TokenListingModeOption[];
