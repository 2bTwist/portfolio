# Supabase Configuration Checklist for Production

## ⚠️ CRITICAL: Production OAuth Not Working but Local Works

If local works but production fails, follow these steps in **EXACT ORDER**:

---

## 1. Supabase Authentication → URL Configuration

Go to: https://app.supabase.com/project/ahzyocxdtsuayqfqptyp/auth/url-configuration

### Site URL (MOST IMPORTANT)
**MUST BE EXACTLY:**
```
https://eddyb.dev
```
⚠️ **Not** `https://www.eddyb.dev` (no www)
⚠️ **Not** `http://` (must be https)
⚠️ Must match your Vercel domain EXACTLY

### Redirect URLs
**ADD BOTH OF THESE:**
```
https://eddyb.dev/auth/callback
http://localhost:3000/auth/callback
```

Click **Save** after adding both.

---

## 2. Check Vercel Environment Variables

Go to: https://vercel.com → Your Project → Settings → Environment Variables

**Required for Production:**
```
NEXT_PUBLIC_SUPABASE_URL=https://ahzyocxdtsuayqfqptyp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_P3jjVW4BA-xayML-_VF-Ew_J8u5a4Wd
```

After adding/changing variables:
1. Click **Save**
2. Go to **Deployments** tab
3. Click on latest deployment → **Redeploy**

---

## 3. Verify OAuth Providers

### GitHub OAuth App Settings
Go to: https://github.com/settings/developers

Find your OAuth App and verify:

**Homepage URL:**
```
https://eddyb.dev
```

**Authorization callback URL:**
```
https://ahzyocxdtsuayqfqptyp.supabase.co/auth/v1/callback
```

### Google OAuth Settings
Go to: https://console.cloud.google.com/apis/credentials

Find your OAuth 2.0 Client ID:

**Authorized JavaScript origins:**
```
https://eddyb.dev
```

**Authorized redirect URIs:**
```
https://ahzyocxdtsuayqfqptyp.supabase.co/auth/v1/callback
```

---

## 4. Test Production Flow

1. Clear browser cache/cookies for eddyb.dev
2. Open incognito/private window
3. Go to a blog post: `https://eddyb.dev/blog/<any-post>`
4. Click "Sign in to comment"
5. Choose GitHub or Google
6. Complete OAuth

**Expected behavior:**
- Redirects to `https://eddyb.dev/auth/callback?redirect_to=/blog/<post>`
- Briefly shows "Signing you in…"
- Redirects back to blog post
- Shows "Signed in as [your name]"

**If it fails:**
- Open browser DevTools → Console tab
- Look for errors
- Check Network tab for failed requests
- Share any error messages

---

## 5. Common Production Issues

### Issue: Still redirects to home page
**Solution:** Site URL doesn't match. Verify it's exactly `https://eddyb.dev` without www

### Issue: "Invalid redirect URL" error
**Solution:** Add `https://eddyb.dev/auth/callback` to Redirect URLs in Supabase

### Issue: Works in dev but fails in production after deploy
**Solution:** Redeploy Vercel after changing environment variables

### Issue: OAuth loop or session doesn't persist
**Solution:** Clear all cookies for eddyb.dev and try again in incognito

---

## Quick Verification Commands

After you've updated Supabase settings, verify in browser DevTools Console on production site:

```javascript
// Check environment variables are set
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Check current session
const { data, error } = await window.supabase.auth.getSession()
console.log('Session:', data.session)
```

---

## What to Check RIGHT NOW:

1. [ ] Supabase Site URL is `https://eddyb.dev` (exact match, no www)
2. [ ] Redirect URLs include `https://eddyb.dev/auth/callback`
3. [ ] Vercel env vars are set for Production environment
4. [ ] Redeployed Vercel after setting env vars
5. [ ] GitHub OAuth callback is Supabase URL (not your domain)
6. [ ] Google OAuth callback is Supabase URL (not your domain)

Once ALL of these are checked, the production OAuth will work.

---

**Most likely culprit:** Site URL in Supabase doesn't exactly match your production domain (www vs non-www).
