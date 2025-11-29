import { generateSignedUrl } from "./awsS3.js";

export function refreshSignedUrlsIfNeeded(card) {
  const now = Date.now();

  // 12 hours (adjust as needed)
  const CACHE_DURATION = 12 * 60 * 60 * 1000;

  let updated = false;

  // Primary
  if (
    !card.images.primaryUrlExpiresAt ||
    now > card.images.primaryUrlExpiresAt.getTime()
  ) {
    const newUrl = generateSignedUrl(card.images.primaryImageKey);
    card.images.primaryImage = newUrl;
    card.images.primaryUrlExpiresAt = new Date(now + CACHE_DURATION);
    updated = true;
  }

  // Secondary
  if (
    !card.images.secondaryUrlExpiresAt ||
    now > card.images.secondaryUrlExpiresAt.getTime()
  ) {
    const newUrl = generateSignedUrl(card.images.secondaryImageKey);
    card.images.secondaryImage = newUrl;
    card.images.secondaryUrlExpiresAt = new Date(now + CACHE_DURATION);
    updated = true;
  }

  return updated;
}
