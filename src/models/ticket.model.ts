import { Schema, models, model, Model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { ITicket } from "../types/type.d";

export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  PENDING = "pending",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum TicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high", 
  URGENT = "urgent",
}

export enum TicketCategory {
  TECHNICAL = "technical",
  BILLING = "billing",
  GENERAL = "general",
  FEATURE_REQUEST = "feature_request",
  BUG_REPORT = "bug_report",
}

const TicketSchema = new Schema<ITicket>(
  {
    ticketNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
    },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
    },
    category: {
      type: String,
      enum: Object.values(TicketCategory),
      default: TicketCategory.GENERAL,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tags: [{ type: String, trim: true }],
    attachments: [
      {
        filename: String,
        url: String,
        mimeType: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // AI enhanced fields
    aiSentiment: {
      type: String,
      enum: ["positive", "neutral", "negative", null],
      default: null,
    },
    aiSuggestedPriority: {
      type: String,
      enum: Object.values(TicketPriority).concat([null as any]),
      default: null,
    },
    aiSuggestedCategory: {
      type: String,
      enum: Object.values(TicketCategory).concat([null as any]),
      default: null,
    },
    aiSummary: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique ticket number before saving
TicketSchema.pre<ITicket>("save", async function (next) {
  if (this.isNew && !this.ticketNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.ticketNumber = `TKT-${timestamp}-${random}`;
  }
  next();
});

// Indexes for common queries
TicketSchema.index({ customer: 1, status: 1 });
TicketSchema.index({ assignedTo: 1, status: 1 });
TicketSchema.index({ ticketNumber: 1 });
TicketSchema.index({ createdAt: -1 });

TicketSchema.plugin(mongoosePaginate);

export const Ticket: Model<ITicket> =
  models.Ticket || model<ITicket>("Ticket", TicketSchema);
