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

export interface IAttachment {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface ITicket extends Document {
  ticketNumber: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: "technical" | "billing" | "general" | "feature_request" | "bug_report";
  customer: Schema.Types.ObjectId;
  assignedTo?: Schema.Types.ObjectId | null;
  tags: string[];
  attachments: IAttachment[];
  // AI-enhanced fields
  aiSentiment?: "positive" | "neutral" | "negative" | null;
  aiSuggestedPriority?: string | null;
  aiSuggestedCategory?: string | null;
  aiSummary?: string | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
  firstResponseAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicketMessage extends Document {
  ticket: Schema.Types.ObjectId;
  sender?: Schema.Types.ObjectId | null;
  senderRole: "customer" | "agent" | "system" | "ai";
  content: string;
  attachments: IAttachment[];
  isInternal: boolean;
  aiGenerated: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}