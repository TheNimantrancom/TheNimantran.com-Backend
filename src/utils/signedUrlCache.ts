import { generateSignedUrl } from "./awsS3.js"

/* ======================================================
   TYPES
====================================================== */

interface CardImages {
  primaryImageKey?: string
  primaryImage?: string
  primaryUrlExpiresAt?: Date

  secondaryImageKey?: string
  secondaryImage?: string
  secondaryUrlExpiresAt?: Date
}

interface CardLike {
  images?: CardImages
}

/* ======================================================
   REFRESH SIGNED URL CACHE
====================================================== */

export function refreshSignedUrlsIfNeeded(
  card: CardLike
): boolean {
  if (!card.images) return false

  const now = Date.now()
  const CACHE_DURATION = 12 * 60 * 60 * 1000 // 12 hours

  let updated = false

  /* ---------------- PRIMARY ---------------- */

  if (
    card.images.primaryImageKey &&
    (
      !card.images.primaryUrlExpiresAt ||
      now > card.images.primaryUrlExpiresAt.getTime()
    )
  ) {
    card.images.primaryImage = generateSignedUrl(
      card.images.primaryImageKey
    )

    card.images.primaryUrlExpiresAt = new Date(
      now + CACHE_DURATION
    )

    updated = true
  }

  /* ---------------- SECONDARY ---------------- */

  if (
    card.images.secondaryImageKey &&
    (
      !card.images.secondaryUrlExpiresAt ||
      now > card.images.secondaryUrlExpiresAt.getTime()
    )
  ) {
    card.images.secondaryImage = generateSignedUrl(
      card.images.secondaryImageKey
    )

    card.images.secondaryUrlExpiresAt = new Date(
      now + CACHE_DURATION
    )

    updated = true
  }

  return updated
}