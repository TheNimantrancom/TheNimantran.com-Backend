import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  category: 'packaging box' | 't-shirt' | 'card' | 'flyer' | 'sticker' | 'other';
  backgroundImage: string;
  thumbnailImage?: string;
  width: number;
  height: number;
  dpi?: number;
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
category: {
  type: String,
  required: true,
  enum: ['packaging box', 't-shirt', 'card', 'flyer', 'sticker', 'other']
},
    backgroundImage: { type: String, required: true },
    thumbnailImage: { type: String },
    width: { type: Number, required: true, default: 800 },
    height: { type: Number, required: true, default: 600 },
    dpi: { type: Number, default: 300 },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITemplate>('Template', TemplateSchema);