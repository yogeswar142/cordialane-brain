import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId | string;
  botId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  isHidden: boolean;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    botId: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorAvatar: { type: String },
    content: { type: String, required: true, maxlength: 1000 },
    isHidden: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);
