import { Schema, models, model, Model } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUser } from "../types/type";
import mongoosePaginate from "mongoose-paginate-v2";

export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
  TEAM = "team",
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true as any,
      validate: validator.isEmail,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    phone: {
      type: String,
      required: false,
      minlength: [7, "Phone number must be at least 7 characters"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    address: String,
    avatar: String,
    hasNotifications: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre<IUser>("save", async function (next) {
  // Return if the password is not modified
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = async function (): Promise<string> {
  const token = jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET!
  );

  return token;
};

UserSchema.plugin(mongoosePaginate);

export const User: Model<IUser> =
  models.User || model<IUser>("User", UserSchema);
