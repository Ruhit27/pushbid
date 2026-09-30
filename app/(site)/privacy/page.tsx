import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="prose-page mx-auto max-w-2xl">
      <h1>Privacy Policy</h1>
      <p>
        <em>This is a starting template. Have it reviewed before launch.</em>
      </p>
      <h2>What we store</h2>
      <ul>
        <li>Your Google account&apos;s name, email address and profile picture, so we can sign you in and show your account.</li>
        <li>Your Credits balance and the Claims you make.</li>
        <li>The public details of listings: link, title, description, icon, category, Spend and Click count.</li>
      </ul>
      <h2>What is public</h2>
      <p>Listings, their Spend and their Click counts are public. Your name and email are never shown next to a Claim.</p>
      <h2>Cookies</h2>
      <p>We use one session cookie to keep you signed in. We don&apos;t use advertising cookies.</p>
      <h2>Deleting your data</h2>
      <p>Contact the site owner to have your account deleted. Listings you&apos;ve spent on stay on the board.</p>
    </article>
  );
}
