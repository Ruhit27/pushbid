# Push Bid

A public product leaderboard where rank is what you spend. The terms used throughout the code are defined in [GLOSSARY.md](GLOSSARY.md).

## Setup

1. `npm install`
2. Create `.env.local`:

   ```
   MONGODB_URI=mongodb+srv://...
   AUTH_SECRET=            # openssl rand -base64 32
   AUTH_GOOGLE_ID=
   AUTH_GOOGLE_SECRET=
   ADMIN_EMAIL=you@example.com
   ADMIN_PASSWORD=choose-a-long-password
   DODO_PAYMENTS_API_KEY=
   DODO_PAYMENTS_WEBHOOK_KEY=   # whsec_...
   DODO_PAYMENTS_ENVIRONMENT=test_mode   # live_mode in production
   DODO_PRODUCT_ID=             # a one-time, pay-what-you-want product
   ```

3. Google sign-in: in [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** (type: Web application). Add these authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-DOMAIN/api/auth/callback/google`

   Then copy the client ID and secret into `.env.local`.
4. Payments: in the [Dodo Payments dashboard](https://app.dodopayments.com), create a one-time product with **Pay What You Want** pricing (minimum $10) and put its ID in `DODO_PRODUCT_ID`. Each Claim charges its own amount against that product. Create an API key, then add a webhook pointing to `https://YOUR-DOMAIN/api/webhooks/dodo` with the `payment.succeeded`, `payment.failed` and `payment.cancelled` events, and copy its signing secret into `DODO_PAYMENTS_WEBHOOK_KEY`. Locally, the return page confirms payments directly with Dodo, so Claims land without the webhook.
5. `npm run seed` adds the categories and Demo Listings. It's safe to run again.
6. `npm run dev`

## Admin

Sign in at `/admin/login` with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. From the admin panel you can add and edit Listings, manage categories, see users and what they've spent, and delete all demo data before launch.

## Deploying to Vercel

Add every variable from `.env.local` to the project's environment variables, and add the production Google redirect URI. In MongoDB Atlas → Network Access, allow Vercel to connect (`0.0.0.0/0`, or Vercel's IP ranges).

## Scripts

- `npm test`: the rule and link tests
- `npm run typecheck`
- `npm run seed`
