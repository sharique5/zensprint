# Building Android App Bundle (AAB) for ZenSprint

## Option 1: EAS Build (Cloud - Recommended for beginners)

### Prerequisites
- [x] Expo account created ✅
- [x] EAS CLI installed ✅
- [x] Logged into EAS ✅
- [x] Project configured ✅

### Build Commands

**For Internal Testing (Preview):**
```bash
eas build --platform android --profile preview
```

**For Production (Play Store):**
```bash
eas build --platform android --profile production
```

### What EAS Build Does
- ✅ Builds in the cloud (no local setup needed)
- ✅ Creates signed AAB automatically
- ✅ Provides download link when done (~10-15 min)
- ✅ Free tier: 30 builds/month

### Build Process
1. Command uploads your code to Expo servers
2. Cloud builds the AAB with your package name
3. You get a download link
4. Download AAB and upload to Play Console

---

## Option 2: Local Build (Advanced - Full Control)

### Prerequisites
```bash
# Install Android Studio
# Download from: https://developer.android.com/studio

# Set environment variables (add to ~/.bashrc or ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

### Step 1: Generate Native Projects
```bash
npx expo prebuild --clean
```
This creates `android/` and `ios/` folders.

### Step 2: Navigate to Android Folder
```bash
cd android
```

### Step 3: Build AAB
```bash
# Windows
.\gradlew bundleRelease

# Mac/Linux
./gradlew bundleRelease
```

### Step 4: Find Your AAB
```
Location: android/app/build/outputs/bundle/release/app-release.aab
```

### Step 5: Sign the AAB (Required for Play Store)

#### Generate Keystore (First Time Only)
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore zensprint-release.keystore -alias zensprint -keyalg RSA -keysize 2048 -validity 10000
```

**Save these details securely:**
- Keystore password: ________________
- Key alias: zensprint
- Key password: ________________

⚠️ **CRITICAL:** If you lose this keystore, you can NEVER update your app in Play Store!

#### Configure Signing
Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('zensprint-release.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'zensprint'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Build Signed AAB
```bash
cd android
./gradlew bundleRelease
```

---

## Option 3: Quick APK for Testing (Not for Play Store)

### Build APK (Installable on your phone)
```bash
cd android
./gradlew assembleRelease
```

**Location:** `android/app/build/outputs/apk/release/app-release.apk`

**Install on Phone:**
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

⚠️ **Note:** Play Store requires AAB, not APK!

---

## Comparison: EAS vs Local

| Feature | EAS Build | Local Build |
|---------|-----------|-------------|
| Setup Time | 5 minutes | 1-2 hours |
| Build Time | 10-15 min | 5-10 min |
| Requires Android Studio | No | Yes |
| Free Tier | 30 builds/month | Unlimited |
| Keystore Management | Handled by Expo | Manual |
| CI/CD Ready | Yes | Requires setup |
| Recommended For | Most developers | Advanced users |

---

## Recommended Workflow

### For First Build (Today):
**Use EAS Build** - Fastest way to get your AAB for Play Console testing.

```bash
eas build --platform android --profile preview
```

Wait ~15 minutes, download the AAB, upload to Play Console Internal Testing.

### For Future Updates:
Continue with EAS Build OR switch to local if you need more control.

---

## Troubleshooting EAS Build

### "Build failed" Error
Check the build logs:
```bash
eas build:list
```
Click the build URL to see detailed logs.

### "Invalid credentials" Error
Re-login:
```bash
eas logout
eas login
```

### "Quota exceeded" Error
You've used your 30 free builds. Options:
- Wait until next month
- Upgrade to paid plan ($29/month)
- Switch to local builds

---

## After Building

### Upload to Play Console

1. **Go to:** https://play.google.com/console
2. **Navigate to:** Your app → Testing → Internal testing
3. **Click:** Create new release
4. **Upload:** Your AAB file
5. **Add testers:** Your email or test group
6. **Save & Review:** Then click "Start rollout"

### Test Installation

1. Tester receives email with Play Store link
2. Opens link on Android phone
3. Joins internal testing program
4. Downloads app from Play Store
5. Tests all features
6. Provides feedback

---

## Current Build Status

✅ Project configured: `com.disionix.zensprint`
✅ EAS Build ready
✅ Version: 1.0.0 (versionCode: 1)

**Next Command:**
```bash
eas build --platform android --profile preview
```

This will:
- Build in Expo cloud (~15 min)
- Generate signed AAB
- Provide download link
- You upload to Play Console

---

## Build Checklist

Before building, verify:
- [ ] Package name is final: `com.disionix.zensprint`
- [ ] Version is correct: `1.0.0`
- [ ] App name is correct: `ZenSprint`
- [ ] Icon files exist in `assets/`
- [ ] All code is committed to git
- [ ] Tested on physical device with Expo Go

After building:
- [ ] Download AAB from EAS
- [ ] Upload to Play Console Internal Testing
- [ ] Add yourself as tester
- [ ] Install and test on real device
- [ ] Fix any issues
- [ ] Repeat until ready for production

---

## Need Help?

**EAS Build Docs:** https://docs.expo.dev/build/introduction/
**Play Console Help:** https://support.google.com/googleplay/android-developer

**Common Commands:**
```bash
# Check build status
eas build:list

# View build details
eas build:view [BUILD_ID]

# Cancel running build
eas build:cancel

# Configure new platform
eas build:configure
```

---

## Ready to Build!

Run this command when you're ready:
```bash
eas build --platform android --profile preview
```

✨ Your first Android build will be ready in ~15 minutes!
