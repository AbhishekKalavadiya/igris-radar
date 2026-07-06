# Mock Data Implementation - Provenance

## Overview
Successfully added 3 diverse mock data examples each for **Content Fingerprinting** and **Voice Monitor** features.

## ✅ Implementation Details

### 1. **Content Fingerprinting Mock Data (3 Examples)**

#### Example 1: Text Content with Confirmed Violation
- **Name:** Product Launch Script 2025.txt
- **Type:** Text
- **File Size:** 12.4 KB
- **Status:** `confirmed_violation` (Red badge - 92% similarity match found)
- **Fingerprint ID:** Auto-generated (e.g., CFP-2025-6WXTWC)
- **Match Details:** Competitor blog URL with 92% similarity
- **Date Registered:** 7 days ago
- **AI Fingerprint:** Includes key phrases, sentiment analysis, content hash

#### Example 2: Image Content with Possible Match
- **Name:** Brand Logo Design.png
- **Type:** Image
- **File Size:** 2.8 MB
- **Status:** `possible_match` (Cyan badge - 78% similarity match found)
- **Fingerprint ID:** Auto-generated (e.g., CFP-2025-LA395O)
- **Match Details:** Design marketplace URL with 78% similarity
- **Date Registered:** 14 days ago
- **AI Fingerprint:** Visual hash, dominant colors (#CCFF00, #00E5FF, #05050A), detected objects

#### Example 3: Audio Content Protected
- **Name:** Podcast Theme Music.mp3
- **Type:** Audio
- **File Size:** 5.2 MB
- **Status:** `protected` (Green badge - No violations detected)
- **Fingerprint ID:** Auto-generated (e.g., CFP-2025-B7JOF4)
- **Match Details:** None
- **Date Registered:** 5 days ago
- **AI Fingerprint:** Audio hash (chromaprint), duration, BPM, musical key

---

### 2. **Voice Monitor Mock Data (3 Examples)**

#### Example 1: YouTube Voice Clone (High Confidence)
- **Platform:** YouTube (with red YouTube icon)
- **Title:** "AI Voice Clone Tutorial - How to Sound Like Anyone"
- **URL:** https://youtube.com/watch?v=mockId12345
- **Match Confidence:** 94% (High - shown in red)
- **Duration:** 3:42
- **Status:** `pending` (Awaiting user review)
- **Detected:** 1 day ago
- **Waveform:** Animated audio visualization

#### Example 2: TikTok Brand Commercial (Medium-High Confidence)
- **Platform:** TikTok (with pink TikTok icon)
- **Title:** "Brand Commercial with Deepfake Voice"
- **URL:** https://tiktok.com/@creator/video/mockId67890
- **Match Confidence:** 87% (Medium-High - shown in cyan)
- **Duration:** 0:45
- **Status:** `pending`
- **Detected:** 2 days ago
- **Waveform:** Animated audio visualization

#### Example 3: SoundCloud Podcast (Lower Confidence)
- **Platform:** SoundCloud (with cyan SoundCloud icon)
- **Title:** "Podcast Episode 42 - Guest Interview (Possible Clone)"
- **URL:** https://soundcloud.com/podcast-show/episode-42-mock
- **Match Confidence:** 76% (Lower - shown in muted color)
- **Duration:** 12:18
- **Status:** `pending`
- **Detected:** 3 days ago
- **Waveform:** Animated audio visualization

---

## 🔧 Technical Implementation

### Backend Changes (`/app/app/api/[[...path]]/route.js`)

1. **Auto-population Logic:**
   - When `/api?path=content` is called and the `protected_content` collection is empty, automatically inserts 3 diverse mock examples
   - When `/api?path=voice-alerts` is called and the `voice_alerts` collection is empty, automatically inserts 3 diverse mock examples

2. **Manual Seed Endpoint:**
   - Added `/api?path=seed-mock-data` endpoint to manually reset and populate mock data
   - Clears existing data and inserts fresh mock examples
   - Returns count of inserted items

### Data Diversity

**Content Types Covered:**
- ✅ Text (.txt) - with confirmed violation
- ✅ Image (.png) - with possible match
- ✅ Audio (.mp3) - protected status

**Voice Platforms Covered:**
- ✅ YouTube (long-form video)
- ✅ TikTok (short-form video)
- ✅ SoundCloud (audio streaming)

**Status Variety:**
- ✅ Protected (safe)
- ✅ Possible Match (medium severity)
- ✅ Confirmed Violation (high severity)
- ✅ Pending alerts (voice monitor)

**Confidence Levels:**
- ✅ High (94%) - Immediate action required
- ✅ Medium-High (87%) - Investigation recommended
- ✅ Medium (76%) - Review suggested

---

## 🧪 Testing & Verification

### API Endpoint Tests (Successful ✅)

```bash
# Test Content Fingerprinting Endpoint
curl http://localhost:3000/api?path=content
# Returns: 3 items (text, image, audio)

# Test Voice Alerts Endpoint
curl http://localhost:3000/api?path=voice-alerts
# Returns: 3 items (YouTube, TikTok, SoundCloud)

# Manual Seed Endpoint
curl http://localhost:3000/api?path=seed-mock-data
# Returns: {"success": true, "contentCount": 3, "alertsCount": 3}
```

### Frontend Display
- ✅ Content Fingerprinting page at `/fingerprint` displays all 3 examples in the Protected Content Library table
- ✅ Voice Monitor page at `/voice-monitor` displays all 3 alerts with platform icons, waveforms, and action buttons
- ✅ Different status badges display with appropriate colors (Acid Green, Cyber Blue, Red)
- ✅ Match details side panel works for items with violations

---

## 📊 Data Schema

### Protected Content Schema
```javascript
{
  id: UUID,
  name: String,
  type: 'text' | 'image' | 'audio' | 'video',
  fileSize: String,
  fingerprintId: String (CFP-2025-XXXXXX),
  status: 'protected' | 'possible_match' | 'confirmed_violation',
  dateRegistered: String (YYYY-MM-DD),
  createdAt: Date,
  aiFingerprint: Object (varies by type),
  originalContent: String | null,
  matchDetails: {
    url: String,
    similarity: Number (0-100),
    detectedDate: String
  } | null
}
```

### Voice Alert Schema
```javascript
{
  id: UUID,
  platform: 'youtube' | 'tiktok' | 'soundcloud',
  title: String,
  url: String,
  matchConfidence: Number (0-100),
  duration: String (MM:SS),
  detectedDate: String (YYYY-MM-DD),
  status: 'pending' | 'flagged' | 'dismissed' | 'mine',
  createdAt: Date
}
```

---

## 🎯 User Benefits

1. **Immediate Visual Demo:** Users can see how the features work without uploading content first
2. **Status Examples:** Shows all possible states (protected, possible match, confirmed violation)
3. **Platform Variety:** Demonstrates multi-platform monitoring capability
4. **Realistic Data:** Uses plausible file names, sizes, and URLs for authenticity
5. **Time Progression:** Shows detections across different time periods (1 day, 2 days, 7 days, etc.)

---

## 🚀 How to Use

### For Users:
1. **Fresh Installation:** Mock data automatically appears when you first access the features
2. **Reset Data:** Call the seed endpoint to reset to demo state:
   ```
   GET /api?path=seed-mock-data
   ```

### For Developers:
- Mock data logic is in `/app/app/api/[[...path]]/route.js` 
- Automatically triggers when collections are empty
- Modify the mock arrays to customize examples

---

## ✨ Features Demonstrated

### Content Fingerprinting Page:
- ✅ Upload area for new content
- ✅ Protected content library table
- ✅ Fingerprint ID copying
- ✅ Status badges with color coding
- ✅ Scan web functionality
- ✅ Match details side panel
- ✅ Different content types (text, image, audio)

### Voice Monitor Page:
- ✅ Identity vault (voice sample + photo upload)
- ✅ Voice match alerts grid
- ✅ Platform-specific icons and colors
- ✅ Animated waveform visualizations
- ✅ Match confidence percentages
- ✅ Action buttons (Flag, Mine, Dismiss)
- ✅ Clickable external URLs
- ✅ Multiple alert statuses

---

## 📝 Notes

- Mock data uses realistic but fake URLs
- All fingerprint IDs are randomly generated
- Dates are calculated relative to current time
- AI fingerprint objects include realistic metadata
- Platform icons and colors match brand guidelines
- The mock data persists in MongoDB until manually cleared

