# Resend Migration - Quick Reference

## What Changed?

The feedback feature now uses **Resend** instead of Nodemailer (Gmail SMTP) to send emails.

## Why This Change?

1. **Simpler**: No Gmail App Password setup needed
2. **More Reliable**: Professional transactional email service
3. **Consistent**: Uses the same Resend API already configured for other emails (referral survey)
4. **Better Monitoring**: Track all emails in Resend dashboard

## What You Need to Know

### Environment Variable

The feedback feature uses the existing `RESEND_API_KEY` that's already configured in your `.env.local` file. **No additional setup required!**

### Email Destination

Feedback emails are sent to: **lassethoroe10@gmail.com**

### How to Test Locally

1. Make sure `RESEND_API_KEY` is in your `.env.local` (it should already be there)
2. Run `npm run dev`
3. Go to http://localhost:3000/en/feedback
4. Submit feedback
5. Check lassethoroe10@gmail.com for the email

### Resend Dashboard

View sent emails and their status at: https://resend.com/logs

## Technical Details

**Old Implementation:**

- Used Nodemailer with Gmail SMTP
- Required `EMAIL_USER` and `EMAIL_PASSWORD` env vars
- Needed Gmail App Password setup

**New Implementation:**

- Uses Resend API
- Requires only `RESEND_API_KEY` env var
- No email account configuration needed

**File Changed:**

- `src/app/api/feedback/route.ts` - Updated to use Resend

**Dependencies:**

- Removed: `nodemailer`, `@types/nodemailer`
- Using: `resend` (already installed)

## Code Example

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: "Chessperiment Feedback <onboarding@resend.dev>",
  to: ["lassethoroe10@gmail.com"],
  subject: "Chessperiment Feedback: Bug Report",
  html: "...",
});
```

## Troubleshooting

**Email not sending?**

1. Check that `RESEND_API_KEY` exists in `.env.local`
2. Verify the API key is valid in your Resend account
3. Check Resend logs at https://resend.com/logs

**In Production:**
Make sure `RESEND_API_KEY` is set in your hosting environment variables (should already be there if referral survey emails work).

---

**Migration Date**: January 2026  
**Status**: ✅ Complete and Tested
