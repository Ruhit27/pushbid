import "server-only";
import DodoPayments from "dodopayments";
import { fulfilCheckout } from "./claims";

export class PaymentsNotConfigured extends Error {}

let client: DodoPayments | null = null;

/** The Dodo Payments client, configured from DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_WEBHOOK_KEY and DODO_PAYMENTS_ENVIRONMENT. */
export function dodo(): DodoPayments {
  if (!process.env.DODO_PAYMENTS_API_KEY || !process.env.DODO_PRODUCT_ID) {
    throw new PaymentsNotConfigured("Payments aren't set up yet. Add the Dodo Payments keys to .env.local (see README).");
  }
  client ??= new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
  });
  return client;
}

/** Starts a hosted Dodo checkout for one Claim and returns the URL to send the customer to. */
export async function startPayment(input: {
  checkoutId: string;
  amount: number;
  customer: { email: string; name: string };
  returnUrl: string;
}): Promise<{ sessionId: string; checkoutUrl: string }> {
  const session = await dodo().checkoutSessions.create({
    // A pay-what-you-want product: the price is set per checkout, in cents.
    product_cart: [{ product_id: process.env.DODO_PRODUCT_ID!, quantity: 1, amount: input.amount * 100 }],
    customer: input.customer,
    return_url: input.returnUrl,
    metadata: { checkoutId: input.checkoutId },
  });
  if (!session.checkout_url) throw new Error("Dodo Payments returned no checkout URL.");
  return { sessionId: session.session_id, checkoutUrl: session.checkout_url };
}

/**
 * Asks Dodo directly whether a payment succeeded, and fulfils its Checkout if so. Used when the customer lands
 * back on the site, so the Claim shows up even if the webhook is late or can't reach this server (e.g. localhost).
 */
export async function confirmPayment(checkoutId: string, paymentId: string): Promise<void> {
  const payment = await dodo().payments.retrieve(paymentId);
  if (payment.metadata?.checkoutId === checkoutId && payment.status === "succeeded") {
    await fulfilCheckout(checkoutId, payment.payment_id);
  }
}
