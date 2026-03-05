import { Request, Response } from 'express';
import Template from '../models/template.model.js';

export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  try {

    const { name, category, width, height, dpi, tags, backgroundImage } = req.body

    if (!name || !category) {
      res.status(400).json({ success: false, message: "Name and category are required" })
      return
    }
const allowedCategories = [
  "packaging box",
  "t-shirt",
  "card",
  "flyer",
  "sticker",
  "other"
]

const normalizedCategory = category?.toLowerCase().trim()

if (!allowedCategories.includes(normalizedCategory)) {
  throw new Error("Invalid category")
}
    if (!backgroundImage) {
      res.status(400).json({ success: false, message: "Background image URL is required" })
      return
    }

    let parsedTags: string[] = []

    if (tags) {
      try {
        const parsed = typeof tags === "string" ? JSON.parse(tags) : tags
        if (Array.isArray(parsed)) {
          parsedTags = parsed.map((t: string) => t.toLowerCase().trim())
        }
      } catch {
        res.status(400).json({ success: false, message: "Invalid tags format" })
        return
      }
    }

    const template = await Template.create({
      name: name.trim(),
      category: category.toLowerCase().trim(),
      backgroundImage,
      thumbnailImage: backgroundImage,
      width: Number(width) || 800,
      height: Number(height) || 600,
      dpi: Number(dpi) || 300,
      tags: parsedTags
    })

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template
    })
  } catch (error) {
    console.error("createTemplate error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create template"
    })
  }
}

// GET /api/templates - List all active templates
export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    const query: Record<string, unknown> = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const templates = await Template.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: templates, count: templates.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// GET /api/templates/:id
export const getTemplateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

// DELETE /api/templates/:id
export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
};