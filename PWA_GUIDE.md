# Progressive Web App (PWA) Guide

## Overview

BOB Home Care is now a **Progressive Web App (PWA)**, which means users can install it on their mobile devices and use it like a native app with offline capabilities.

---

## Features

### ✅ **Installable**
- Users can add the app to their home screen on both Android and iOS devices
- No app store required - install directly from the website
- App icon appears on home screen alongside other apps

### ✅ **Offline Support**
- Service worker caches essential assets for offline access
- Users can view previously loaded pages without internet connection
- Network-first strategy for pages, cache-first for static assets

### ✅ **App-Like Experience**
- Runs in standalone mode (no browser UI)
- Custom splash screen with app icon
- Smooth animations and native-like interactions

### ✅ **Fast Loading**
- Cached assets load instantly
- Progressive enhancement for better performance
- Optimized for mobile networks

---

## How to Install

### **Android (Chrome/Edge)**

1. Open the website in Chrome or Edge browser
2. Look for the "Install" banner at the bottom of the screen
3. Tap **"Install"** button
4. Alternatively, tap the menu (⋮) → **"Add to Home screen"** or **"Install app"**
5. Confirm installation
6. App icon will appear on your home screen

### **iOS (Safari)**

1. Open the website in Safari browser
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired (default: "BOB Home Care")
5. Tap **"Add"**
6. App icon will appear on your home screen

### **Desktop (Chrome/Edge)**

1. Open the website in Chrome or Edge
2. Look for the install icon (⊕) in the address bar
3. Click **"Install"**
4. App will open in a standalone window

---

## Technical Details

### **Manifest Configuration**

Location: `/client/public/manifest.json`

Key settings:
- **Name**: BOB Home Care - Professional Cleaning Services
- **Short Name**: BOB Home Care
- **Theme Color**: #10b981 (Green)
- **Background Color**: #ffffff (White)
- **Display Mode**: Standalone
- **Start URL**: /

### **App Icons**

Location: `/client/public/icons/`

Generated icons:
- `icon-72x72.png` - Small devices
- `icon-96x96.png` - Standard mobile
- `icon-128x128.png` - High-res mobile
- `icon-144x144.png` - iPad
- `icon-152x152.png` - iOS devices
- `icon-192x192.png` - Android standard
- `icon-384x384.png` - High-res Android
- `icon-512x512.png` - Splash screens
- `icon-192x192-maskable.png` - Android adaptive icon
- `icon-512x512-maskable.png` - Android adaptive icon (large)

### **Service Worker**

Location: `/client/public/sw.js`

Caching strategies:
- **Pages**: Network-first (always try to fetch fresh, fallback to cache)
- **Static Assets**: Cache-first (serve from cache, update in background)
- **API Requests**: Always fetch fresh (no caching)

Cache names:
- `bob-home-care-v1` - Precached assets
- `bob-runtime-v1` - Runtime cached assets

### **Registration**

Location: `/client/src/registerSW.ts`

Features:
- Automatic service worker registration on page load
- Update detection and notification
- Install prompt handling
- PWA detection (checks if running as installed app)

---

## User Experience

### **Install Banner**

Component: `/client/src/components/PWAInstallBanner.tsx`

The install banner appears automatically when:
- User visits the site on a mobile device
- PWA is not already installed
- User has not dismissed the banner in the last 7 days

Banner features:
- Bilingual support (English/Arabic)
- One-click installation
- Dismissible (remembers for 7 days)
- Responsive design

### **Shortcuts**

Quick actions available from home screen icon (long-press):
1. **Book Service** - Direct link to `/book`
2. **My Bookings** - Direct link to `/dashboard`

---

## Testing PWA

### **Chrome DevTools**

1. Open DevTools (F12)
2. Go to **Application** tab
3. Check sections:
   - **Manifest**: Verify manifest.json is loaded correctly
   - **Service Workers**: Check if SW is registered and active
   - **Cache Storage**: View cached assets

### **Lighthouse Audit**

1. Open DevTools (F12)
2. Go to **Lighthouse** tab
3. Select **Progressive Web App** category
4. Click **Generate report**
5. Review PWA score and recommendations

### **Mobile Testing**

1. Use Chrome Remote Debugging for Android devices
2. Use Safari Web Inspector for iOS devices
3. Test install flow on real devices
4. Verify offline functionality

---

## Maintenance

### **Updating the Service Worker**

When you make changes to the website:

1. Update the version in `sw.js`:
   ```javascript
   const CACHE_NAME = 'bob-home-care-v2'; // Increment version
   ```

2. Service worker will automatically update
3. Users will see update notification
4. Reload to activate new version

### **Clearing Cache**

To force clear all caches:

```javascript
// Run in browser console
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
  console.log('All caches cleared');
});
```

### **Uninstalling PWA**

**Android:**
- Long-press app icon → App info → Uninstall

**iOS:**
- Long-press app icon → Remove App → Delete

**Desktop:**
- Open app → Settings (⋮) → Uninstall

---

## Future Enhancements

### **Potential Features**

1. **Push Notifications**
   - Booking confirmations
   - Service reminders
   - Promotional offers

2. **Background Sync**
   - Queue bookings when offline
   - Sync when connection restored

3. **Offline Booking Form**
   - Save draft bookings locally
   - Submit when online

4. **App Shortcuts**
   - Quick actions from home screen
   - Deep links to specific services

---

## Troubleshooting

### **Service Worker Not Registering**

- Check browser console for errors
- Verify `/sw.js` is accessible
- Ensure HTTPS is enabled (required for PWA)
- Clear browser cache and reload

### **Icons Not Showing**

- Verify icon files exist in `/client/public/icons/`
- Check manifest.json icon paths
- Clear browser cache
- Regenerate icons if needed

### **Install Prompt Not Showing**

- PWA criteria must be met (manifest, service worker, HTTPS)
- User may have dismissed prompt before
- Try different browser or device
- Check Chrome://flags for PWA settings

### **Offline Mode Not Working**

- Verify service worker is active
- Check cache storage in DevTools
- Ensure caching strategy is correct
- Test with DevTools offline mode

---

## Browser Support

| Browser | Install | Offline | Notifications |
|---------|---------|---------|---------------|
| Chrome (Android) | ✅ | ✅ | ✅ |
| Chrome (Desktop) | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Safari (iOS) | ✅ | ✅ | ❌ |
| Safari (macOS) | ✅ | ✅ | ❌ |
| Firefox | ⚠️ | ✅ | ✅ |
| Samsung Internet | ✅ | ✅ | ✅ |

✅ = Fully supported  
⚠️ = Partial support  
❌ = Not supported

---

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Documentation](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Service Worker Cookbook](https://serviceworke.rs/)

---

## Support

For PWA-related issues or questions, please contact the development team or refer to the project documentation.
