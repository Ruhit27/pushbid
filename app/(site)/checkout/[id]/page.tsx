import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { AutoRefresh } from "@/app/_components/AutoRefresh";
import { connectDb } from "@/lib/db";
import { usd } from "@/lib/format";
import { Checkout, type CheckoutDoc } from "@/lib/models";
import { confirmPayment } from "@/lib/payments";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Payment" };

/** Where Dodo Payments sends the customer after checkout: shows whether their Claim has landed yet. */
export default async function CheckoutPage({ params, searchParams }: PageProps<"/checkout/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=/checkout/${id}`);
  if (!isValidObjectId(id)) notFound();
  await connectDb();
  const find = () => Checkout.findOne({ _id: id, user: viewer.id }).lean<CheckoutDoc>();
  let checkout = await find();
  if (!checkout) notFound();

  const paymentId = typeof sp.payment_id === "string" ? sp.payment_id : "";
  if (checkout.status !== "paid" && paymentId) {
    try {
      await confirmPayment(id, paymentId);
      checkout = (await find())!;
    } catch (err) {
      // The webhook will still fulfil it; this page keeps checking.
      console.error(err);
    }
  }

  const failed = checkout.status === "failed" || (checkout.status === "pending" && (sp.status === "failed" || sp.status === "cancelled"));

  return (
    <div className="mx-auto grid max-w-md gap-4 py-16 text-center">
      {checkout.status === "paid" && checkout.result ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">You&apos;re #{checkout.result.rank}</h1>
          <p className="text-muted">
            Payment of <strong className="text-fg">{usd(checkout.amount)}</strong> received. Your listing is now{" "}
            <strong className="text-fg">#{checkout.result.rank}</strong> on the All-time board.
          </p>
          <Link href={`/product/${checkout.result.slug}`} className="mx-auto rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-strong">
            See your listing
          </Link>
        </>
      ) : failed ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">Payment didn&apos;t go through</h1>
          <p className="text-muted">You haven&apos;t been charged, and nothing changed on the board.</p>
          <Link href="/#claim" className="mx-auto rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-strong">
            Try again
          </Link>
        </>
      ) : (
        <>
          <AutoRefresh seconds={3} />
          <h1 className="text-3xl font-semibold tracking-tight">Confirming your payment…</h1>
          <p className="text-muted">This usually takes a few seconds. Your listing goes live as soon as the payment is confirmed.</p>
        </>
      )}
    </div>
  );
}
