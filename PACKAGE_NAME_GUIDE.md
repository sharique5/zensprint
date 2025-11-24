# Package Name & Bundle ID Configuration

## Current Configuration ✅

### Android Package Name
**`com.guidora.zensprint`**
- Location: `app.json` → `expo.android.package`
- This is what appears in Google Play Store URL
- Format: `com.yourcompany.appname`
- Must be **unique** across all Play Store apps
- **Cannot be changed** after first publish!

### iOS Bundle Identifier  
**`com.guidora.zensprint`**
- Location: `app.json` → `expo.ios.bundleIdentifier`
- This is what appears in App Store Connect
- Format: `com.yourcompany.appname`
- Must be **unique** across all App Store apps
- **Cannot be changed** after first publish!

---

## 🔴 IMPORTANT: Choose Wisely!

### Before Publishing, Decide:

**Option 1: Use Your Company/Personal Domain (Recommended)**
```json
"package": "com.yourname.zensprint"
"bundleIdentifier": "com.yourname.zensprint"
```
Example: `com.sharique.zensprint`

**Option 2: Use Generic Domain (Currently Set)**
```json
"package": "com.guidora.zensprint"
"bundleIdentifier": "com.guidora.zensprint"
```

**Option 3: Use Professional Domain**
```json
"package": "app.zensprint.mobile"
"bundleIdentifier": "app.zensprint.mobile"
```

### Rules:
- ✅ Must be reverse domain notation
- ✅ Only lowercase letters, numbers, and dots
- ✅ Must start with `com.`, `io.`, `app.`, etc.
- ❌ Cannot use `test`, `demo`, `example`
- ❌ Cannot use trademarked names (unless you own them)
- ⚠️ **CANNOT CHANGE AFTER FIRST PUBLISH**

---

## How to Update Package Name

### 1. Edit `app.json`
```json
{
  "expo": {
    "android": {
      "package": "com.yourname.zensprint"  // ← Change this
    },
    "ios": {
      "bundleIdentifier": "com.yourname.zensprint"  // ← Change this
    }
  }
}
```

### 2. Clean Build (If you've built before)
```bash
# Remove old build artifacts
rm -rf android/ ios/

# Rebuild with new package name
npx expo prebuild --clean
```

### 3. Verify in Generated Files

**Android:** `android/app/build.gradle`
```gradle
defaultConfig {
    applicationId "com.yourname.zensprint"  // Should match
}
```

**iOS:** `ios/zensprint/Info.plist`
```xml
<key>CFBundleIdentifier</key>
<string>com.yourname.zensprint</string>  <!-- Should match -->
```

---

## Play Store URL Preview

Once published, your app will be available at:

**Google Play Store:**
```
https://play.google.com/store/apps/details?id=com.guidora.zensprint
```

**Apple App Store:**
```
https://apps.apple.com/app/zensprint/id[APPLE_ASSIGNS_THIS]
```

---

## Recommended Package Name for ZenSprint

If you own a domain or personal brand:
```json
"package": "com.[yourdomain].zensprint"
```

If using generic (current setup is fine):
```json
"package": "com.guidora.zensprint"
```

For a professional look:
```json
"package": "app.zensprint.game"
```

---

## Checklist Before First Publish

- [ ] Decided on final package name
- [ ] Updated in `app.json`
- [ ] Tested build with new package name
- [ ] Verified package name is available (search Play Store/App Store)
- [ ] Noted that package name **cannot be changed later**
- [ ] Committed changes to git

---

## Current Status

Your app is configured with:
- **Package Name:** `com.guidora.zensprint`
- **Version:** 1.0.0
- **Version Code (Android):** 1
- **Build Number (iOS):** 1.0.0

✅ Ready for submission if you're happy with `com.guidora.zensprint`!

---

## Need to Change It?

Run this command to update the package name everywhere:

```bash
# Option 1: Using VS Code Find & Replace
# Find: com.guidora.zensprint
# Replace: com.yourname.zensprint

# Option 2: Manually edit app.json (recommended)
# Then clean rebuild:
npx expo prebuild --clean
```

⚠️ **Do this BEFORE your first publish!** After publishing, the package name is permanent for that app.
