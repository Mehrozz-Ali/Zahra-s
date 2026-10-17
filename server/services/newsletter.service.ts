import { Subscriber } from "../models/Subscriber";

/** Idempotent: subscribing twice (or re-subscribing after opting out) just leaves the address active. */
export async function subscribe(email: string): Promise<void> {
  await Subscriber.updateOne({ email }, { $set: { isActive: true } }, { upsert: true });
}
