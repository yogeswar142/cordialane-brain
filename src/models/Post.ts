import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  botId?: string;
  authorId: string;
  authorType: 'user' | 'bot';
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema(
  {
    botId: { type: String, index: true },
    authorId: { type: String, required: true, index: true },
    authorType: { type: String, enum: ['user', 'bot'], default: 'bot' },
    authorName: { type: String, required: true },
    authorAvatar: { type: String },
    title: { type: String, required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
  },
  { timestamps: true }
);

export const Post = mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
