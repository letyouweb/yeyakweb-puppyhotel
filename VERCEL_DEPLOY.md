# Vercel Deploy Guide

## Prerequisite Checklist
- Local build passes (`npm run build`)
- Git branch up to date with `main`
- Required environment variables exist both locally (`.env`) and in the Vercel project

---

## Environment Variables (Local `.env` + Vercel Project)
Set the following keys for every environment (`Production`, `Preview`, `Development`) inside Vercel > Project > Settings > Environment Variables. Keep them in sync with the values in `.env`.

| Key | Sample Value | Notes |
| --- | --- | --- |
| `VITE_PUBLIC_SUPABASE_URL` | `https://ssvkmyscxjhrkbulujvq.supabase.co` | Used by the web client |
| `VITE_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_iBq280ikbyXnH9ikXBm-7A_q719JG5D` | Supabase anon key |
| `VITE_SUPABASE_URL` | `https://ssvkmyscxjhrkbulujvq.supabase.co` | Convenience alias for edge/functions |
| `VITE_SUPABASE_ANON_KEY` | same as above | Matches the public key |
| `VITE_SOLAPI_API_KEY` | `<your SOLAPI key>` | Required for auto-SMS |
| `VITE_SMS_SENDER` | `01012345678` | Must be a pre-registered SOLAPI sender number |

> After editing Vercel env vars, click **Redeploy** on the latest deployment so the new values take effect.

---

## Deploy Steps
1. **Install deps & test locally**
   ```bash
   npm install
   npm run build
   ```
2. **Commit & push**
   ```bash
   git add .
   git commit -m "chore: prep deploy"
   git push origin main
   ```
3. **Trigger Vercel build**
   - Visit https://vercel.com/letyouweb/yeyakweb-puppyhotel
   - Open the latest deployment and click **Redeploy** if it has not started automatically.

---

## Post-Deploy Smoke Test
- Public site: `https://yeyakweb-puppyhotel.vercel.app`
- Admin login: `/admin` (test base auth + dashboard)
- Chatbot helpers: open browser console and run `await window.getAvailableSlots('2024-12-25', 'grooming')`
- Reservation status updates should still send SOLAPI SMS via the Supabase edge function

---

## Troubleshooting
- **Build fails**: Check Vercel build logs; verify env variables are set.
- **Supabase errors**: Ensure URLs/keys match the Supabase project.
- **SMS not sending**: Confirm `VITE_SOLAPI_API_KEY` and `VITE_SMS_SENDER` and that the SOLAPI sender is pre-approved.

Need help? Share the failing deployment URL or console logs along with any recent code changes.
