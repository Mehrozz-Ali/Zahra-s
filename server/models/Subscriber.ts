import { Schema, model } from "mongoose";

export interface ISubscriber {
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Subscriber = model<ISubscriber>("Subscriber", subscriberSchema);
