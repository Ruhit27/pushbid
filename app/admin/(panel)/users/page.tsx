import { connectDb } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { Claim, User, type UserDoc } from "@/lib/models";
import { CreditsForm } from "./CreditsForm";

export default async function AdminUsers() {
  await connectDb();
  const [users, spend] = await Promise.all([
    User.find().sort({ createdAt: -1 }).limit(500).lean<(UserDoc & { createdAt: Date })[]>(),
    Claim.aggregate<{ _id: unknown; total: number; n: number }>([
      { $match: { user: { $ne: null } } },
      { $group: { _id: "$user", total: { $sum: "$amount" }, n: { $sum: 1 } } },
    ]),
  ]);
  const spentBy = new Map(spend.map((s) => [String(s._id), s]));
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <div className="overflow-x-auto rounded-3xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2 text-right">Claims</th>
              <th className="px-4 py-2 text-right">Spent</th>
              <th className="px-4 py-2">Credits</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const s = spentBy.get(u._id.toString());
              return (
                <tr key={u._id.toString()} className="border-t border-line">
                  <td className="px-4 py-2">
                    <p className="font-semibold">{u.name || "—"}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-4 py-2 text-muted">{timeAgo(u.createdAt)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{s?.n ?? 0}</td>
                  <td className="px-4 py-2 text-right tabular-nums">${(s?.total ?? 0).toLocaleString("en-US")}</td>
                  <td className="px-4 py-2">
                    <CreditsForm id={u._id.toString()} credits={u.credits} />
                  </td>
                </tr>
              );
            })}
            {!users.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Nobody has signed in yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
