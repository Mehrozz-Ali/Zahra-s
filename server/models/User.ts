import bcrypt from "bcryptjs";
import { Model, Schema, model, type Types } from "mongoose";
import { USER_ROLES, type CloudinaryImage, type UserRole } from "../types";

export interface IAddress {
  _id?: Types.ObjectId;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  avatar?: CloudinaryImage;
  addresses: IAddress[];
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const addressSchema = new Schema<IAddress>({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  line1: { type: String, required: true, trim: true },
  line2: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  province: { type: String, required: true, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, default: "Pakistan", trim: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: USER_ROLES, default: "customer" },
    phone: { type: String, trim: true },
    avatar: { url: String, publicId: String },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: Date,
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const out = ret as Record<string, unknown>;
        for (const key of ["password", "emailVerificationToken", "emailVerificationExpires", "passwordResetToken", "passwordResetExpires", "__v"]) delete out[key];
        return out;
      },
    },
  },
);

userSchema.index({ role: 1, createdAt: -1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
  // 1s back-dated so a token issued right after the change is still valid; older tokens are rejected
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.method("comparePassword", function (candidate: string) {
  return bcrypt.compare(candidate, this.password); // load the user with .select("+password") first
});

export const User = model<IUser, UserModel>("User", userSchema);
