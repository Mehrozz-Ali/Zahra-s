import { env } from "../config/env";
import { Order } from "../models/Order";
import { ApiError } from "../utils/ApiError";
import { buildCreateOrderPayload, extractErrorMessage, extractTrackingNumber } from "./postex.payload";

/** The courier feature is off until both settings exist, so a store without a PostEx account behaves exactly as before. */
export const isPostexConfigured = (): boolean => Boolean(env.POSTEX_API_TOKEN && env.POSTEX_PICKUP_ADDRESS_CODE);

const LOCK_SECONDS = 120; // a booking that dies halfway frees itself after this
const TIMEOUT_MS = 20_000;

/**
 * Books a confirmed order with PostEx and saves the tracking number on it. Called by an admin pressing "Book with PostEx".
 * Safety rules: one booking per order (atomic claim), the order is never marked shipped by this call, and the
 * tracking number is saved only after PostEx answers with one.
 */
export async function bookOrderWithPostex(orderId: string) {
  if (!isPostexConfigured()) throw ApiError.badRequest("PostEx is not set up yet. Add the PostEx settings to the server first.");

  const existing = await Order.findById(orderId);
  if (!existing) throw ApiError.notFound("Order not found");
  if (existing.shipment?.trackingNumber) throw ApiError.conflict(`This order is already booked with PostEx (tracking ${existing.shipment.trackingNumber}).`);
  if (existing.orderStatus !== "confirmed" && existing.orderStatus !== "processing") throw ApiError.conflict("Only a confirmed order can be booked. Confirm the order first.");
  if (existing.paymentMethod === "stripe" && existing.paymentStatus !== "paid") throw ApiError.conflict("This card order has not been paid yet.");

  // Claim the order: only one request can hold the lock at a time
  const staleBefore = new Date(Date.now() - LOCK_SECONDS * 1000);
  const order = await Order.findOneAndUpdate(
    { _id: orderId, "shipment.trackingNumber": { $exists: false }, $or: [{ shipmentLockedAt: { $exists: false } }, { shipmentLockedAt: null }, { shipmentLockedAt: { $lt: staleBefore } }] },
    { $set: { shipmentLockedAt: new Date() } },
    { new: true },
  );
  if (!order) throw ApiError.conflict("This order is already being booked. Wait a moment and reload.");

  const release = () => Order.updateOne({ _id: order._id }, { $unset: { shipmentLockedAt: 1 } }).catch(() => undefined);
  try {
    const payload = buildCreateOrderPayload(order, env.POSTEX_PICKUP_ADDRESS_CODE);
    let response: Response;
    try {
      response = await fetch(`${env.POSTEX_BASE_URL}/v3/create-order`, {
        method: "POST",
        headers: { token: env.POSTEX_API_TOKEN, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      // We cannot know whether PostEx created the shipment, so tell the admin to look before retrying
      console.error(`PostEx booking for ${order.orderNumber} got no answer:`, error instanceof Error ? error.message : error);
      throw new ApiError(504, "PostEx did not answer in time. Check your PostEx dashboard for this order before trying again, so it is not booked twice.");
    }

    const body: unknown = await response.json().catch(() => null);
    const tracking = response.ok ? extractTrackingNumber(body) : null;
    if (!tracking) {
      const reason = extractErrorMessage(body);
      console.error(`PostEx rejected ${order.orderNumber}: HTTP ${response.status}${reason ? ` - ${reason}` : ""}`); // never log the token
      if (response.status === 401 || response.status === 403) throw new ApiError(502, "PostEx refused the login. Check the PostEx token in the server settings.");
      if (response.ok) throw new ApiError(502, `PostEx answered but gave no tracking number${reason ? ` (${reason})` : ""}. Check your PostEx dashboard before trying again.`);
      throw new ApiError(502, `PostEx could not book this order${reason ? `: ${reason}` : ` (error ${response.status})`}.`);
    }

    const booked = await Order.findOneAndUpdate(
      { _id: order._id },
      {
        $set: { shipment: { courier: "postex", trackingNumber: tracking, bookedAt: new Date() } },
        $unset: { shipmentLockedAt: 1 },
      },
      { new: true },
    );
    return booked!;
  } catch (error) {
    await release();
    throw error;
  }
}
