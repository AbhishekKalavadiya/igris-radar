# Keyword Research Setup Guide

This guide walks you through setting up the 4 data sources for `node scripts/keyword-research.mjs`.

**The script works immediately with zero setup** using Google Trends + Autocomplete. Google Search Console and Keyword Planner are optional add-ons that provide richer data.

---

## Quick Start (Zero Setup)

```bash
# Install the Google Trends dependency
yarn add google-trends-api

# Run with Trends + Autocomplete (no API keys needed)
node scripts/keyword-research.mjs --no-gsc --no-kwp

# Focus on one service
node scripts/keyword-research.mjs --no-gsc --no-kwp --service security
```

That's it! You'll get trending keywords and autocomplete suggestions immediately.

---

## Source 1: Google Trends (Zero Setup)

**What it gives you**: Trending keyword data, rising queries, interest comparison.

**Setup**: Just install the npm package:
```bash
yarn add google-trends-api
```

No API key needed. Completely free.

---

## Source 2: Google Autocomplete (Zero Setup)

**What it gives you**: Real autocomplete suggestions — the exact phrases people type into Google.

**Setup**: None. Uses Google's public autocomplete endpoint. Works out of the box.

---

## Source 3: Google Search Console (Free, 10-min setup)

**What it gives you**: Your actual ranking data — which queries your site appears for, clicks, impressions, CTR, and average position.

### Step 1: Verify your site in Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. If `igrisradar.com` is not already verified, add it as a property
3. Verify ownership (DNS, HTML file, or Google Analytics method)

### Step 2: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Name it something like "Igris Radar SEO" → **Create**
4. Make sure the project is selected

### Step 3: Enable the Search Console API

1. Go to [API Library](https://console.cloud.google.com/apis/library)
2. Search for **"Google Search Console API"**
3. Click **Enable**

### Step 4: Create a Service Account

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click **+ Create Service Account**
3. Name: `gsc-reader` → **Create and Continue**
4. Skip the optional roles → **Done**
5. Click on the service account you just created
6. Go to **Keys** tab → **Add Key** → **Create new key** → **JSON** → **Create**
7. A JSON file downloads — save it securely

### Step 5: Grant Search Console Access

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property (`igrisradar.com`)
3. Go to **Settings** → **Users and permissions** → **Add user**
4. Enter the service account email (from the JSON file, looks like `gsc-reader@project-name.iam.gserviceaccount.com`)
5. Set permission to **Full** → **Add**

### Step 6: Configure Environment Variable

Base64-encode the JSON key file and add it to `.env.local`:

**On macOS/Linux:**
```bash
base64 -w0 path/to/service-account-key.json
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("path\to\service-account-key.json"))
```

Add to `.env.local`:
```bash
GSC_SERVICE_ACCOUNT_KEY=<paste the base64 string here>
GSC_SITE_URL=https://igrisradar.com
```

### Test it

```bash
node scripts/keyword-research.mjs --no-kwp
```

---

## Source 4: Google Keyword Planner (Free Google Ads Account)

**What it gives you**: Actual monthly search volume numbers, competition levels, and CPC bid data for any keyword.

> **Note**: You do NOT need to run ads or spend money. A free Google Ads account is sufficient. Without ad spend, Google shows volume ranges (e.g., "1K–10K") instead of exact numbers — still very useful.

### Step 1: Create a Google Ads Account

1. Go to [Google Ads](https://ads.google.com)
2. Click **Start now** and create an account
3. When asked to create a campaign, look for **"Switch to Expert Mode"** → **"Create an account without a campaign"**
4. Complete the setup (no payment required for API access)
5. Note your **Customer ID** (format: `XXX-XXX-XXXX`, shown in top right)

### Step 2: Apply for API Access

1. Go to [Google Ads API Center](https://ads.google.com/aw/apicenter)
2. Apply for a **Developer Token**
3. Fill in the application:
   - **API usage**: "Internal tool for SEO keyword research"
   - **Contact email**: Your email
4. You'll get a **test developer token** immediately (works for testing)
5. Full approval may take a few days

### Step 3: Create OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Use the same project from Step 2 of the GSC setup (or create a new one)
3. Go to **APIs & Services** → **Credentials**
4. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Desktop app** (or Web app)
6. Note the **Client ID** and **Client Secret**

### Step 4: Generate a Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the ⚙️ gear icon → Check **"Use your own OAuth credentials"**
3. Enter your Client ID and Client Secret
4. In the left panel, find **Google Ads API** → select `https://www.googleapis.com/auth/adwords`
5. Click **Authorize APIs** → sign in with your Google Ads account
6. Click **Exchange authorization code for tokens**
7. Copy the **Refresh Token**

### Step 5: Configure Environment Variables

Add to `.env.local`:
```bash
GOOGLE_ADS_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token
GOOGLE_ADS_CUSTOMER_ID=123-456-7890
```

### Test it

```bash
node scripts/keyword-research.mjs --no-gsc
```

---

## Running with All 4 Sources

Once everything is configured:

```bash
# Full run — all sources
node scripts/keyword-research.mjs

# Focus on one service
node scripts/keyword-research.mjs --service security

# Limit results
node scripts/keyword-research.mjs --top 20

# Verbose output (debug)
node scripts/keyword-research.mjs --verbose
```

The report is saved to `csv_export/keyword-report-YYYY-MM-DD.json` for reference.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `google-trends-api not installed` | Run `yarn add google-trends-api` |
| `GSC authentication failed` | Check that the base64-encoded key is correct and the service account has access in Search Console |
| `Keyword Planner auth failed` | Verify your OAuth credentials and refresh token |
| `Keyword Planner API error 403` | Your developer token may still be pending approval — use the test token for now |
| `Autocomplete HTTP 429` | You're being rate-limited — wait a minute and try again, or use `--no-autocomplete` |
| No results from Trends | Google Trends may have rate limits — wait and retry, or use `--no-trends` |
