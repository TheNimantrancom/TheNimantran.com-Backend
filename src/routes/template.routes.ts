import { Router } from 'express';
import { createTemplate, getTemplates, getTemplateById, deleteTemplate } from '../controllers/template.controller.js';
import {removeBg} from "../controllers/ai/removeBackground.controller.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// router.use(verifyJWT)
router.post('/', createTemplate);
router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.delete('/:id', deleteTemplate);
// router.post("/remove-bg",removeBg)

export default router;