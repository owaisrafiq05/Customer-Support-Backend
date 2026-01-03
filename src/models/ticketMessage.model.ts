import { Schema, models, model, Model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { ITicketMessage } from "../types/type.d";

export enum SenderRole {
  CUSTOMER = "customer",
  AGENT = "agent",
  SYSTEM = "system",
  AI = "ai",
}

const TicketMessageSchema = new Schema<ITicketMessage>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket reference is required"],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // null for system/AI messages
    },
    senderRole: {
      type: String,
      enum: Object.values(SenderRole),
      default: SenderRole.CUSTOMER,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    attachments: [
      {
        filename: String,
        url: String,
        mimeType: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  } 
);

// Indexes for efficient queries
TicketMessageSchema.index({ ticket: 1, createdAt: 1 });
TicketMessageSchema.index({ sender: 1 });

TicketMessageSchema.plugin(mongoosePaginate);

export const TicketMessage: Model<ITicketMessage> =
  models.TicketMessage || model<ITicketMessage>("TicketMessage", TicketMessageSchema);
