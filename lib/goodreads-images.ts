const GOODREADS_COVER_RESIZE = /\._[^./]+_(?=\.(?:jpe?g|png|webp)(?:$|\?))/i;
const GOODREADS_PROFILE_SIZE = /(images\.gr-assets\.com\/users\/\d+)p\d+(\/)/i;

/** Return the highest-resolution Goodreads asset represented by a thumbnail URL. */
export function highResolutionGoodreadsImage(src?: string | null): string | undefined {
  if (!src) return undefined;

  return src
    .replace(GOODREADS_COVER_RESIZE, "")
    .replace(GOODREADS_PROFILE_SIZE, "$1p8$2");
}
