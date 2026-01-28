# Feedback Feature

This feature allows users to submit feedback, bug reports, and feature suggestions through the website.

## Setup

### 1. Install Dependencies

The feedback feature uses Nodemailer to send emails. Dependencies should already be installed, but if needed:

```bash
npm install nodemailer @types/nodemailer
```

### 2. Configure Email Credentials

Create a `.env.local` file in the `client` directory with the following variables:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

**Important:** For Gmail, you MUST use an App Password, not your regular password.

#### How to create a Gmail App Password:

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification (if not already enabled)
4. Search for "App Passwords" and create a new one
5. Select "Mail" and "Other (Custom name)"
6. Copy the generated 16-character password
7. Use this password in your `.env.local` file

### 3. Destination Email

Feedback emails are currently sent to: **contact.chesspie@gmail.com**

To change this, edit the file:
`src/app/api/feedback/route.ts` and update line 30:

```typescript
to: "your-email@example.com",
```

## How It Works

1. **Frontend**: Users select a feedback type (Bug Report, Feature Suggestion, or General Feedback)
2. **Form**: They fill out an optional email field and required message field
3. **API**: The form submits to `/api/feedback` endpoint
4. **Email**: Nodemailer sends the feedback via Gmail SMTP to the configured address
5. **Confirmation**: User sees a success message

## File Structure

```
src/
├── app/
│   ├── [locale]/
│   │   └── feedback/
│   │       └── page.tsx          # Feedback form UI
│   └── api/
│       └── feedback/
│           └── route.ts          # API endpoint for email sending
├── messages/
│   ├── en.json                   # English translations
│   └── de.json                   # German translations
└── components/
    ├── Header.tsx                # Desktop navigation
    └── MobileMenu.tsx            # Mobile navigation
```

## Troubleshooting

### Email not sending?

1. Check that `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env.local`
2. Verify you're using an App Password, not your regular password
3. Check the server console for error messages
4. Make sure 2FA is enabled on your Google account

### Gmail blocking sign-in attempts?

- Use an App Password instead of your regular password
- Make sure "Less secure app access" is NOT needed (App Passwords are more secure)

## Security Notes

- Never commit `.env.local` to version control
- Use App Passwords instead of regular passwords
- Consider using a dedicated email account for sending feedback
- In production, use environment variables from your hosting platform
