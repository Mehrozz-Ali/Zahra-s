import { getAuthUser } from "../middleware/auth";
import * as cartService from "../services/cart.service";
import * as orderService from "../services/order.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";
import type { OrderListQuery, PlaceOrderInput, QuoteInput } from "../validations/order.validation";

export const quote = asyncHandler(async (req, res) => {
  sendSuccess(res, await cartService.quoteCheckout((req.body as QuoteInput).lines, (req.body as QuoteInput).couponCode), "Checkout priced successfully");
});

export const placeOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, { order: orderService.toCustomerOrder(await orderService.placeOrder(getAuthUser(req).id, req.body as PlaceOrderInput)) }, "Order placed", 201);
});

export const getOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, { order: orderService.toCustomerOrder(await orderService.getOrderForUser(getAuthUser(req).id, String(req.params.id))) }, "Order fetched successfully");
});

export const listMyOrders = asyncHandler(async (req, res) => {
  sendSuccess(res, await orderService.listOrdersForUser(getAuthUser(req).id, req.query as unknown as OrderListQuery), "Orders fetched successfully");
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, { order: orderService.toCustomerOrder(await orderService.cancelOrder(String(req.params.id), { userId: getAuthUser(req).id })) }, "Order cancelled");
});
