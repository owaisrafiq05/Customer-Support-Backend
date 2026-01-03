import { Document, PaginateModel, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  phone?: string;
  address?: string;
  name: string;
  avatar?: string;
  hasNotifications: boolean;
  isEmailVerified: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): Promise<string>;
}

export interface IDataEntry extends Document {
  title: string;
  description?: string;
  value: number;
  image?: string | null;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}