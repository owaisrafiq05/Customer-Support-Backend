import { Schema, models, model, Model } from "mongoose";
import { IDataEntry } from "../types/type";
import mongoosePaginate from "mongoose-paginate-v2";

const DataEntrySchema = new Schema<IDataEntry>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    value: {
      type: Number,
      required: [true, "Value is required"],
    },
    image: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CreatedBy is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
DataEntrySchema.index({ createdBy: 1, createdAt: -1 });
DataEntrySchema.index({ title: "text", description: "text" });

DataEntrySchema.plugin(mongoosePaginate);

export const DataEntry: Model<IDataEntry> =
  models.DataEntry || model<IDataEntry>("DataEntry", DataEntrySchema);

