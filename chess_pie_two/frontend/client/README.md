# chessPie

A modern chess web app, created to enable players from around the world to play chess and its thousands of variants. We not only give you normal chess, but lots of different variations, that allow you to boost your brain in terms of creativity, logical thinking and so much more.

## Setup

### Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Configure the required environment variables:
   - `RESEND_API_KEY`: Get your API key from [Resend](https://resend.com/api-keys) for the referral survey email functionality

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

## Features

### Referral Survey
When users first visit the site, a survey appears at the bottom asking "How did you find your way to Chessperiment?". User responses are automatically emailed to `contact.chesspie@gmail.com` via Resend.

Comments:
- Note1 means that this needs to change in the future when color should be random