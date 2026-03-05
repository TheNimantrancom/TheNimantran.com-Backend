interface CardImages {
  primaryImageKey?: string
  primaryImage?: string
  secondaryImageKey?: string
  secondaryImage?: string
}

interface CardLike {
  images?: CardImages
}

export const  attachCloudfrontUrls = (card: CardLike): boolean => {
  if (!card.images) return false

  const baseUrl = process.env.CLOUDFRONT_URL

  if (card.images.primaryImageKey) {
    card.images.primaryImage = `${baseUrl}/${card.images.primaryImageKey}`
  }

  if (card.images.secondaryImageKey) {
    card.images.secondaryImage = `${baseUrl}/${card.images.secondaryImageKey}`
  }
  return true;
}