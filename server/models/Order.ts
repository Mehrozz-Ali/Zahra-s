import { Schema, model, type Types } from "mongoose";
import {
  DELIVERY_METHODS, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, SIZES,
  type DeliveryMethod, type OrderStatus, type PaymentMethod, type PaymentStatus, type Size,
} from "../types";
import { randomCode } from "../utils/slugify";

/** Snapshot of the product at purchase time, so later edits never change old orders. */
export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  slug: string;
  image?: string;
  sku: string;
  size: Size;
  quantity: number;
  price: number; // unit price paid
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
}

export interface IStatusEvent {
  status: OrderStatus;
  note?: string;
  changedAt: Date;
}

export interface IOrder {
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  coupon?: { code: string; discountAmount: number };
  stripePaymentIntentId?: string;
  statusHistory: IStatusEvent[];
  inventoryRestored: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: String,
    sku: { type: String, required: true },
    size: { type: String, enum: SIZES, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [itemSchema], validate: [(v: IOrderItem[]) => v.length > 0, "An order needs at least one item"] },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      province: { type: String, required: true },
      postalCode: String,
      country: { type: String, default: "Pakistan" },
    },
    deliveryMethod: { type: String, enum: DELIVERY_METHODS, default: "standard" },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "pending" },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: "pending" },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    coupon: { code: String, discountAmount: Number },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    statusHistory: {
      type: [new Schema<IStatusEvent>({ status: { type: String, enum: ORDER_STATUSES, required: true }, note: String, changedAt: { type: Date, default: Date.now } }, { _id: false })],
      default: [],
    },
    inventoryRestored: { type: Boolean, default: false },
  },
  { timestamps: true },
);

orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

orderSchema.pre("validate", async function () {
  if (!this.isNew) return;
  if (!this.orderNumber) {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    let number = `ORD-${day}-${randomCode(2)}`;
    while (await Order.exists({ orderNumber: number })) number = `ORD-${day}-${randomCode(2)}`;
    this.orderNumber = number;
  }
  if (this.statusHistory.length === 0) this.statusHistory.push({ status: this.orderStatus, changedAt: new Date() });
});

export const Order = model<IOrder>("Order", orderSchema);
