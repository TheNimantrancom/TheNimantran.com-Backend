import mongoose, { Document, Schema } from 'mongoose';

export interface IDesign extends Document {
  templateId: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  canvasJSON: Record<string, unknown>; 
  previewImage: string; 
  status: 'draft' | 'saved' | 'exported';
  width:number;
  bleed:number;
  safeMargin:number;
  dpi:number;
  height:number
  exportedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DesignSchema = new Schema<IDesign>(
{
templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },

userId: { type: String, required: true },

name: { type: String, default: 'Untitled Design', trim: true },

canvasJSON: { type: Schema.Types.Mixed, required: true },

previewImage: { type: String, default: '' },

width: { type: Number, required: true },
height: { type: Number, required: true },

dpi: { type: Number, default: 300 },

bleed: { type: Number, default: 3 },

safeMargin: { type: Number, default: 5 },

status: { type: String, enum: ['draft','saved','exported'], default: 'draft' },

exportedAt: { type: Date }
},
{ timestamps: true }
);

DesignSchema.index({ userId: 1, createdAt: -1 });
DesignSchema.index({ templateId: 1 });

export default mongoose.model<IDesign>('Design', DesignSchema);