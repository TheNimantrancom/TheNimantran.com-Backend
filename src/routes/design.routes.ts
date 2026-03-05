import { Router } from 'express';
import { saveDesign, getDesignById, getUserDesigns, deleteDesign } from '../controllers/design.controller.js';

const router = Router();

router.post('/', saveDesign);
router.get('/designs/:id', getDesignById);
router.get('/:id', getDesignById);
router.get('/user/designs', getUserDesigns);
router.delete('/:id', deleteDesign);

export default router;