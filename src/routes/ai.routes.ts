import { Router } from 'express';
import {
  generateImage,
  removeBackground,
  getDesignSuggestions,
  generateColorPalette,
  getFontSuggestions,
  enhanceText,
} from '../controllers/ai/ai.controller.js';


const router = Router();

router.post('/generate-image', generateImage);
router.post('/remove-background', removeBackground);
router.post('/design-suggestions', getDesignSuggestions);
router.post('/color-palette', generateColorPalette);
router.post('/font-suggestions', getFontSuggestions);
router.post('/enhance-text', enhanceText);

export default router;