import Link from "next/link";
import { usd } from "@/lib/format";
import { STARTING_CREDITS } from "@/lib/rules";
import { getViewer } from "@/lib/viewer";
import { yourListings } from "@/lib/welcome";
import { ListingIcon } from "./Board";
import { WelcomePopup } from "./WelcomePopup";

function Movement({ rank, before }: { rank: number; before: number }) {
  const moved = before - rank;
  if (moved === 0) return <span className="text-xs text-muted">no change</span>;
  return moved > 0 ? (
    <span className="text-xs font-semibold text-ok">▲ {moved}</span>
  ) : (
    <span className="text-xs font-semibold text-brand">▼ {-moved}</span>
  );
}

/** The popup a user sees right after signing in with Google: the Starting Credits for a new user, a catch-up for a returning one. */
export async function Welcome() {
  const viewer = await getViewer();
  if (!viewer?.pendingWelcome) return null;

  if (viewer.pendingWelcome === "new") {
    return (
      <WelcomePopup
        title={`You've got ${usd(STARTING_CREDITS)} in Credits`}
        toast={`Signed in · ${usd(STARTING_CREDITS)} in Credits added`}
        claimLabel="Claim your first spot"
        bigCelebration
      >
        <p className="text-muted">Spend them on Claims to put a product on the board. Higher Spend, higher Rank.</p>
      </WelcomePopup>
    );
  }

  const listings = await yourListings(viewer.id);
  const firstName = viewer.name.split(" ")[0];
  return (
    <WelcomePopup
      title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
      toast={`Welcome back · ${usd(viewer.credits)} in Credits`}
      claimLabel={viewer.credits > 0 ? "Claim" : null}
    >
      <p className="text-muted">
        {viewer.credits > 0 ? (
          <>
            You have <strong className="text-fg">{usd(viewer.credits)}</strong> in Credits.
          </>
        ) : (
          "You've spent all your Credits."
        )}
      </p>
      {listings.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-muted">Your listings on the All-time board, since your last Claim</p>
          <ul className="grid gap-2">
            {listings.map((l) => (
              <li key={l.slug}>
                <Link href={`/product/${l.slug}`} className="flex items-center gap-3 rounded-2xl border border-line p-2.5 transition hover:border-fg">
                  <ListingIcon src={l.iconUrl} size={32} />
                  <span className="min-w-0 flex-1 truncate font-medium">{l.title}</span>
                  <span className="font-semibold tabular-nums">#{l.rank}</span>
                  <span className="w-16 text-right">
                    <Movement rank={l.rank} before={l.rankBefore} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </WelcomePopup>
  );
}
