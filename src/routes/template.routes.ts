import { Router } from 'express';
import { createTemplate, getTemplates, getTemplateById, deleteTemplate } from '../controllers/template.controller.js';


const router = Router();

router.post('/', createTemplate);
router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.delete('/:id', deleteTemplate);

export default router;