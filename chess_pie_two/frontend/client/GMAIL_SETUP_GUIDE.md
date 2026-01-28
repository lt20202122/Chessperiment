# Gmail Configuration Guide for Feedback Feature

## Quick Setup Checklist

- [ ] Enable 2-Step Verification on your Google Account
- [ ] Generate a Gmail App Password
- [ ] Create `.env.local` file with credentials
- [ ] Test the feedback form

## Step-by-Step Instructions

### 1. Enable 2-Step Verification

1. Go to https://myaccount.google.com/security
2. Scroll to "How you sign in to Google"
3. Click on "2-Step Verification"
4. Follow the prompts to enable it (you'll need your phone)

### 2. Create an App Password

1. Go to https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. In the "Select app" dropdown, choose "Mail"
3. In the "Select device" dropdown, choose "Other (Custom name)"
4. Enter "Chessperiment Feedback" or similar
5. Click "Generate"
6. **Copy the 16-character password** (shown in yellow box)
   - Example format: `abcd efgh ijkl mnop`
   - You can remove spaces when copying: `abcdefghijklmnop`

### 3. Create .env.local File

In the `/chess_pie_two/frontend/client/` directory, create a file named `.env.local`:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

Replace with:
- `your-email@gmail.com` → The Gmail address you want to send FROM
- `abcdefghijklmnop` → The 16-character App Password you just generated

### 4. Verify Configuration

Start your development server:

```bash
npm run dev
```

Navigate to: http://localhost:3000/en/feedback

Try submitting feedback and check:
1. The form shows a success message
2. You receive an email at contact.chesspie@gmail.com

## Common Issues

### "Invalid login credentials"
- Make sure you're using an App Password, NOT your regular Gmail password
- Verify 2-Step Verification is enabled
- Check for typos in EMAIL_USER and EMAIL_PASSWORD

### "No recipients defined"
- The destination email is hardcoded in `src/app/api/feedback/route.ts`
- Make sure line 30 has: `to: "contact.chesspie@gmail.com"`

### Email not arriving
- Check Gmail spam/junk folder
- Verify the sending email (EMAIL_USER) is valid
- Check server console for error messages

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. **DO NOT** commit `.env.local` to Git
2. Set environment variables in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
3. Add both `EMAIL_USER` and `EMAIL_PASSWORD`
4. Redeploy your application

## Alternative Email Providers

If you don't want to use Gmail, you can modify `src/app/api/feedback/route.ts`:

### Using a Different Email Service

```typescript
const transporter = nodemailer.createTransport({
    host: "smtp.example.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});
```

### Using SendGrid, Mailgun, etc.

For production, consider using dedicated email services:
- SendGrid
- Mailgun
- Amazon SES
- Postmark

These are more reliable for transactional emails and don't require 2FA setup.

## Security Best Practices

✅ **DO:**
- Use App Passwords (more secure than regular passwords)
- Store credentials in environment variables
- Use a dedicated email account for sending feedback
- Set up SPF and DKIM records for production

❌ **DON'T:**
- Commit `.env.local` to version control
- Share your App Password
- Use your personal Gmail account in production
- Disable 2-Step Verification to avoid App Passwords

## Testing Checklist

After setup, verify:

- [ ] Can access /feedback page
- [ ] Can select a feedback type
- [ ] Can fill and submit the form
- [ ] Success message appears
- [ ] Email arrives at contact.chesspie@gmail.com
- [ ] Email formatting looks correct
- [ ] Email contains all submitted information

## Need Help?

If you're still having issues:

1. Check the server console for error messages
2. Verify all environment variables are set correctly
3. Test with a simple email first using a Gmail test account
4. Check Google Account security settings
5. Try regenerating a new App Password

---

**Created for:** ChessPIE Feedback Feature  
**Last Updated:** January 2026
