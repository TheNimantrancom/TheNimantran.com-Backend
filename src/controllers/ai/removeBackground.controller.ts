import { removeBackground } from '@imgly/background-removal-node';
import { generatePresignedUploadUrl, getCloudFrontUrl } from '../../utils/awsS3.js';

import { Request, Response } from 'express';
import  ApiResponse  from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
export const removeBg =  asyncHandler(  async (req: Request, res: Response): Promise<Response> => {
  try {

    const { key } = req.body as { key: string };

    if (!key) {
      return res.status(400).json({ error: 'S3 key is required' });
    }

    const imageUrl = getCloudFrontUrl(key);
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error('Failed to fetch image from CloudFront');
    const imageBuffer = await imageRes.arrayBuffer();

   
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const resultBlob = await removeBackground(blob);
    const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());

    const outputFileName = `${Date.now()}-${key.split('/').pop()}`;
    const { uploadUrl, viewUrl } = await generatePresignedUploadUrl(outputFileName, 'image/png', 'bg-removed');

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: resultBuffer,
      headers: { 'Content-Type': 'image/png' },
    });

    if (!uploadRes.ok) throw new Error('Failed to upload processed image to S3');

    return res.status(200).json(
      new ApiResponse(200,viewUrl, 
         'Background removed and image uploaded successfully')
    );
  
  } catch (err) {
    console.error('Background removal error:', err);
    return res.status(500).json({ error: 'Background removal failed' });
  }
});