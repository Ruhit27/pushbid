/**
 * Seeds Categories and a handful of Demo Listings with Claims spread over the last few days.
 * Safe to re-run: categories are upserted and demo data is replaced.
 *
 *   npm run seed
 */
import mongoose from "mongoose";
import { connectDb } from "../lib/db";
import { normalizeLink, slugFromKey } from "../lib/link";
import { Category, Claim, Listing } from "../lib/models";
import { compareStanding, utcDay } from "../lib/rules";

process.loadEnvFile(".env.local");

const categories: [slug: string, name: string, shortName: string][] = [
  ["leaderboards-attention", "Leaderboards & Attention Markets", "Leaderboards"],
  ["marketing-advertising", "Marketing & Advertising", "Marketing"],
  ["seo-ai-visibility", "SEO & AI Visibility", "SEO"],
  ["productivity-personal-tools", "Productivity & Personal Tools", "Productivity"],
  ["ai-agents-infrastructure", "AI Agents & Infrastructure", "Agents"],
  ["developer-tools", "Developer Tools", "Developer"],
  ["crypto-web3-investing", "Crypto, Web3 & Investing", "Crypto"],
  ["games-entertainment", "Games & Entertainment", "Games"],
  ["health-fitness-wellness", "Health, Fitness & Wellness", "Health"],
  ["business-finance-legal", "Business, Finance & Legal", "Business"],
  ["ecommerce-retail", "Ecommerce & Retail", "Ecommerce"],
  ["travel-local-lifestyle", "Travel, Local & Lifestyle", "Travel"],
  ["directories-launch-discovery", "Directories, Launch & Discovery", "Directories"],
  ["agencies-studios-services", "Agencies, Studios & Services", "Agencies"],
  ["ai-media-generation", "AI Media Generation", "AI Media"],
  ["social-media-creator-tools", "Social Media & Creator Tools", "Social"],
  ["education-learning", "Education & Learning", "Education"],
  ["people-profiles", "People & Profiles", "People"],
  ["design-creative", "Design & Creative", "Design"],
  ["hiring-jobs-careers", "Hiring, Jobs & Careers", "Hiring"],
  ["domains-web-assets", "Domains & Web Assets", "Domains"],
  ["sales-lead-generation", "Sales & Lead Generation", "Sales"],
  ["security-privacy-compliance", "Security, Privacy & Compliance", "Security"],
  ["media-news", "Media & News", "News"],
  ["real-estate-property", "Real Estate & Property", "Real Estate"],
  ["writing-content", "Writing & Content", "Writing"],
  ["audio-voice-podcasting", "Audio, Voice & Podcasting", "Audio"],
  ["analytics", "Analytics", "Analytics"],
  ["product-management", "Product Management", "Product Management"],
  ["other", "Other", "Other"],
];

/** Demo Listings: [link, title, description, category slug, Claims as [amount, daysAgo][]]. */
const demo: [string, string, string, string, [number, number][]][] = [
  ["https://see.io", "see.io", "Describe an idea and get a live website built by AI.", "ai-agents-infrastructure", [[120, 6], [60, 2], [25, 0]]],
  ["https://tutti.so", "Tutti", "A marketplace where creators get paid for brand campaigns.", "marketing-advertising", [[90, 5], [70, 1]]],
  ["https://joni.ai", "JONI", "A personal AI computer that runs a team of agents for you.", "ai-agents-infrastructure", [[100, 4], [30, 0]]],
  ["https://www.outrank.so", "Outrank", "Automated SEO content and backlinks for organic growth.", "seo-ai-visibility", [[80, 3], [35, 1]]],
  ["https://crowdreply.io", "CrowdReply", "Outreach that gets your brand cited on pages AI search engines use.", "seo-ai-visibility", [[75, 3], [20, 0]]],
  ["https://trycomp.ai", "Comp AI", "Compliance automation for SOC 2, ISO 27001, HIPAA and GDPR.", "security-privacy-compliance", [[60, 2], [12, 1]]],
  ["https://www.context.dev", "Context.dev", "A scraping API that turns web pages into clean data for AI agents.", "developer-tools", [[45, 2]]],
  ["https://fuellog.ai", "Fuel Log", "Photo-based calorie tracking with weekly leaderboards among friends.", "health-fitness-wellness", [[30, 1], [10, 0]]],
  ["https://publer.com", "Publer", "Schedule and manage posts across your social accounts.", "social-media-creator-tools", [[28, 1]]],
  ["https://pro.reactbits.dev", "React Bits Pro", "Animated React components and page blocks for polished UIs.", "developer-tools", [[22, 0]]],
  ["https://chartlo.com", "Chartlo", "Automatic dashboards from spreadsheets and APIs, right in your browser.", "analytics", [[15, 0]]],
];

async function main() {
  await connectDb();

  for (const [i, [slug, name, shortName]] of categories.entries()) {
    await Category.updateOne({ slug }, { $set: { name, shortName, order: i } }, { upsert: true });
  }
  const catId = new Map((await Category.find()).map((c) => [c.slug, c._id]));
  console.log(`Categories: ${catId.size}`);

  const old = await Listing.find({ demo: true }, { _id: 1 });
  await Claim.deleteMany({ $or: [{ demo: true }, { listing: { $in: old.map((l) => l._id) } }] });
  await Listing.deleteMany({ demo: true });

  const now = Date.now();
  const claims: { listingId: mongoose.Types.ObjectId; amount: number; at: Date }[] = [];
  for (const [url, title, description, cat, spends] of demo) {
    const link = normalizeLink(url);
    if (await Listing.exists({ key: link.key })) {
      console.log(`Skipping ${link.key}: a real listing already uses it`);
      continue;
    }
    const at = spends.map(([amount, daysAgo], i) => ({ amount, at: new Date(now - daysAgo * 86_400_000 - (i + 1) * 3_600_000 * 2) }));
    const listing = await Listing.create({
      key: link.key,
      slug: slugFromKey(link.key),
      url: link.url,
      kind: link.kind,
      title,
      description,
      iconUrl: `https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=128`,
      category: catId.get(cat),
      totalSpend: spends.reduce((s, [a]) => s + a, 0),
      spendSince: at[at.length - 1].at,
      raises: spends.length - 1,
      clicks: Math.floor(Math.random() * 400) + 20,
      demo: true,
      createdAt: at[0].at,
    });
    claims.push(...at.map((c) => ({ listingId: listing._id, ...c })));
  }

  // Replay Claims in time order so each one records the Rank it reached at that moment.
  claims.sort((a, b) => a.at.getTime() - b.at.getTime());
  const running = new Map<string, { spend: number; since: Date }>();
  for (const c of claims) {
    running.set(c.listingId.toString(), { spend: (running.get(c.listingId.toString())?.spend ?? 0) + c.amount, since: c.at });
    const standings = [...running.entries()].map(([id, s]) => ({ id, ...s })).sort(compareStanding);
    await Claim.create({
      listing: c.listingId,
      amount: c.amount,
      day: utcDay(c.at),
      rankAfter: standings.findIndex((s) => s.id === c.listingId.toString()) + 1,
      demo: true,
      createdAt: c.at,
    });
  }
  console.log(`Demo listings: ${running.size}, demo claims: ${claims.length}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
