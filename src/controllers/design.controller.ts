import { Request, Response } from 'express';
import Design from '../models/design.model.js';
import Template from '../models/template.model.js';

// POST /api/designs - Save or update design
export const saveDesign = async (req: Request, res: Response): Promise<void> => {
  try {

      const userId = req.user?._id;
    const { templateId, name, canvasJSON, previewImage, designId } = req.body;

    if (!templateId || !userId || !canvasJSON) {
      res.status(400).json({ error: 'templateId, userId, and canvasJSON are required' });
      return;
    }

    // Verify template exists
    const template = await Template.findById(templateId);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    let design;

    if (designId) {
      // Update existing design
      design = await Design.findByIdAndUpdate(
        designId,
        { name: name || 'Untitled Design', canvasJSON, previewImage, status: 'saved', updatedAt: new Date() },
        { new: true }
      );
    } else {
      // Create new design
      design = new Design({
        templateId,
        userId,
        name: name || 'Untitled Design',
        canvasJSON,
        previewImage,
        status: 'saved',
      });
      await design.save();
    }

    res.status(201).json({ success: true, data: design });
  } catch (error) {
    console.error('saveDesign error:', error);
    res.status(500).json({ error: 'Failed to save design' });
  }
};

// GET /api/designs/:id - Get single design
export const getDesignById = async (req: Request, res: Response): Promise<void> => {
  try {
    const design = await Design.findById(req.params.id).populate('templateId');
    if (!design) {
      res.status(404).json({ error: 'Design not found' });
      return;
    }
    res.json({ success: true, data: design });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch design' });
  }
};

// GET /api/user/designs - Get all designs for a user
export const getUserDesigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.user._id;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    const designs = await Design.find({ userId })
      .populate('templateId', 'name category thumbnailImage')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: designs, count: designs.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user designs' });
  }
};

// DELETE /api/designs/:id
export const deleteDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    await Design.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Design deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete design' });
  }
};