import { Router } from 'express';
import { createTemplate, getTemplates, getTemplateById, deleteTemplate } from '../controllers/template.controller.js';
import {removeBg} from "../controllers/ai/removeBackground.controller.js"

const router = Router();

router.post('/', createTemplate);
router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.delete('/:id', deleteTemplate);
router.post("/remove-bg",removeBg)

export default router;