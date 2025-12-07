# Google AdSense Integration Guide

This document provides step-by-step instructions for integrating Google AdSense ads into BatchTube.

## 📋 Overview

Three manual ad slots have been integrated:
1. **AdSlotSearch** - Below the search bar
2. **AdSlotGrid** - Between video cards (after every 8th card)
3. **AdSlotModal** - Inside the download progress modal

## 🔧 Step 1: Get Your AdSense Publisher ID

1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Get your Publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXX`)
3. Create 3 ad units in AdSense dashboard:
   - **Search Bar Ad** (responsive, auto format)
   - **Grid Ad** (rectangle format, responsive)
   - **Modal Ad** (300x250 rectangle, responsive)

## 🔧 Step 2: Update Ad Client ID

### Option A: Environment Variable (Recommended)

Create/update `.env` file in `frontend/`:

```env
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

Then update `adLoader.ts`:

```typescript
// frontend/src/lib/adLoader.ts
const CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX';
```

### Option B: Direct Update

Update the following files with your actual Publisher ID:

1. **`frontend/src/lib/adLoader.ts`** (line 23):
   ```typescript
   script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';
   ```

2. **`frontend/src/components/AdSlotSearch.tsx`** (line 6):
   ```typescript
   clientId = 'ca-pub-XXXXXXXXXXXXXXXX'
   ```

3. **`frontend/src/components/AdSlotGrid.tsx`** (line 6):
   ```typescript
   clientId = 'ca-pub-XXXXXXXXXXXXXXXX'
   ```

4. **`frontend/src/components/AdSlotModal.tsx`** (line 6):
   ```typescript
   clientId = 'ca-pub-XXXXXXXXXXXXXXXX'
   ```

## 🔧 Step 3: Update Ad Slot IDs

For each ad component, replace `data-ad-slot="XXXXXXXXXX"` with your actual AdSense ad slot IDs:

1. **AdSlotSearch.tsx** (line 25):
   ```tsx
   data-ad-slot="YOUR_SEARCH_AD_SLOT_ID"
   ```

2. **AdSlotGrid.tsx** (line 36):
   ```tsx
   data-ad-slot="YOUR_GRID_AD_SLOT_ID"
   ```

3. **AdSlotModal.tsx** (line 30):
   ```tsx
   data-ad-slot="YOUR_MODAL_AD_SLOT_ID"
   ```

## 📍 Integration Points

### 1. AdSlotSearch (Below Search Bar)

**Location:** `frontend/src/App.tsx` (line ~128)

```tsx
<Hero onSearch={handleSearch} loading={isSearching} t={t} />

{/* Ad Slot: Below Search Bar */}
{results.length > 0 && <AdSlotSearch />}
```

- **Conditional:** Only shows when search results exist
- **Responsive:** Full-width container, auto-sized ad
- **No layout impact:** Uses margin spacing only

### 2. AdSlotGrid (Between Video Cards)

**Location:** `frontend/src/App.tsx` (line ~130-145)

```tsx
{results.map((video, index) => (
  <React.Fragment key={video.id}>
    <VideoCard ... />
    {/* Ad Slot: After every 8th video card */}
    {(index + 1) % 8 === 0 && (
      <AdSlotGrid index={Math.floor((index + 1) / 8)} />
    )}
  </React.Fragment>
))}
```

- **Frequency:** After every 8th video card
- **Grid-compatible:** Uses `gridColumn: span 1` to fit grid
- **Native style:** Looks like a video card with "AD" label
- **No layout break:** Maintains grid structure

### 3. AdSlotModal (Inside Download Modal)

**Location:** `frontend/src/components/ProgressModal.tsx` (line ~435)

```tsx
{/* Footer Actions */}
<div className="p-4 sm:p-6 ...">
  ...
</div>

{/* Ad Slot: Inside Download Modal (bottom section) */}
<AdSlotModal />
```

- **Position:** Bottom of modal, after footer actions
- **Size:** 300x250 or responsive
- **Centered:** Horizontally centered, max-width 300px
- **Non-intrusive:** Separated with border-top

## ✅ Verification Checklist

- [ ] AdSense script loads (check browser console)
- [ ] All 3 ad slots display correctly
- [ ] Ads are responsive on mobile/tablet/desktop
- [ ] Grid layout remains intact
- [ ] Modal layout remains intact
- [ ] No UI elements are displaced
- [ ] Cookie consent works (ads only load after consent)

## 🐛 Troubleshooting

### Ads Not Showing

1. **Check AdSense Script:**
   - Open browser console
   - Look for `[AdSense] Script loaded successfully`
   - If missing, check cookie consent

2. **Check Ad Slot IDs:**
   - Verify `data-ad-slot` values match your AdSense dashboard
   - Ensure ad units are approved in AdSense

3. **Check Client ID:**
   - Verify Publisher ID is correct
   - Check for typos in `ca-pub-` format

### Layout Issues

- **Grid breaking:** Ensure `AdSlotGrid` uses `gridColumn: span 1`
- **Modal overflow:** Check `max-w-[300px]` on `AdSlotModal`
- **Spacing issues:** Verify margin/padding classes

## 📝 Notes

- **Auto Ads:** Remain enabled in AdSense dashboard
- **Manual Slots:** These 3 slots are in addition to auto ads
- **Cookie Consent:** Ads only load after user accepts cookies
- **No Style Changes:** All existing UI components remain unchanged
- **Responsive:** All ads use `data-full-width-responsive="true"`

## 🚀 Deployment

After updating client IDs and slot IDs:

1. Test locally with `npm run dev`
2. Build for production: `npm run build`
3. Deploy to your hosting platform
4. Verify ads appear in production

---

**Important:** Replace all placeholder values (`ca-pub-XXXXXXXXXXXXXXXX` and `XXXXXXXXXX`) with your actual AdSense Publisher ID and Ad Slot IDs before deploying to production.

