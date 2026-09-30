import Link from "next/link";
import { Logo } from "./_components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto grid max-w-md flex-1 place-content-center gap-4 px-4 py-24 text-center">
      <Link href="/" className="mx-auto">
        <Logo />
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Not on the board</h1>
      <p className="text-muted">That page doesn&apos;t exist, or the listing was removed.</p>
      <Link href="/" className="mx-auto rounded-full bg-brand px-5 py-2.5 font-semibold text-white">
        Back to the leaderboard
      </Link>
    </main>
  );
}
