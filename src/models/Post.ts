import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  botId: string;
  authorId: string;
  title: string;
  content: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema(
  {
    botId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Post = mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
