import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  botId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema(
  {
    botId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

reviewSchema.index({ botId: 1, userId: 1 }, { unique: true });

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
