import { revalidatePath } from "next/cache";
import { failCheckout, fulfilCheckout } from "@/lib/claims";
import { dodo } from "@/lib/payments";

/** Dodo Payments webhook: a succeeded payment becomes a Claim; a failed or cancelled one marks its Checkout. */
export async function POST(req: Request) {
  const body = await req.text();
  let event;
  try {
    event = dodo().webhooks.unwrap(body, { headers: Object.fromEntries(req.headers) });
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }

  if (event.type === "payment.succeeded") {
    const checkoutId = String(event.data.metadata?.checkoutId ?? "");
    if (checkoutId) {
      await fulfilCheckout(checkoutId, event.data.payment_id);
      revalidatePath("/", "layout");
    }
  } else if (event.type === "payment.failed" || event.type === "payment.cancelled") {
    const checkoutId = String(event.data.metadata?.checkoutId ?? "");
    if (checkoutId) await failCheckout(checkoutId);
  }
  return new Response("ok");
}
