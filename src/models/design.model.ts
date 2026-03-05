import mongoose, { Document, Schema } from 'mongoose';

export interface IDesign extends Document {
  templateId: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  canvasJSON: Record<string, unknown>; 
  previewImage: string; 
  status: 'draft' | 'saved' | 'exported';
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
    status: { type: String, enum: ['draft', 'saved', 'exported'], default: 'draft' },
    exportedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for fast user queries
DesignSchema.index({ userId: 1, createdAt: -1 });
DesignSchema.index({ templateId: 1 });

export default mongoose.model<IDesign>('Design', DesignSchema);