import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <article className="prose-page mx-auto max-w-2xl">
      <h1>Terms of Service</h1>
      <p>
        <em>This is a starting template. Have it reviewed before you take real payments.</em>
      </p>
      <h2>Using Push Bid</h2>
      <p>By signing in or making a Claim, you agree to these terms and to the rules. If you don&apos;t agree, please don&apos;t use the service.</p>
      <h2>Listings</h2>
      <ul>
        <li>You may only list products or profiles that you own or are authorized to represent.</li>
        <li>Listings must follow the rules. We may edit, recategorize, hide or remove any listing at any time.</li>
        <li>Listed websites should show valid company or owner details.</li>
      </ul>
      <h2>Credits and Claims</h2>
      <ul>
        <li>Credits have no cash value and can&apos;t be transferred or withdrawn.</li>
        <li>Claims are final. Credits spent on a Claim are not returned, including when a listing is outranked or removed.</li>
        <li>Your rank is set when the Claim is recorded and can change whenever someone else claims.</li>
      </ul>
      <h2>No guarantees</h2>
      <p>Push Bid is provided as is. We don&apos;t promise any particular number of Clicks, visitors or results from a ranking.</p>
      <h2>Changes</h2>
      <p>We may update these terms. If you keep using Push Bid after a change, you accept the updated terms.</p>
    </article>
  );
}
