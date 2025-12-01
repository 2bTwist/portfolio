# Comments System Setup Guide

## ✅ What's Been Done

The complete comments system has been implemented with:
- User authentication (OAuth via Supabase)
- Comments table with Row Level Security (RLS)
- Real-time comment updates
- Delete functionality for comment owners
- Clean UI integrated into blog posts

## 📋 Setup Steps

### 1. Run the Database Migration

Execute the SQL schema in your Supabase project:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `supabase-comments-schema.sql`
6. Click **Run** to execute

This will create:
- `comments` table
- Indexes for performance
- Row Level Security (RLS) policies

### 2. Configure OAuth Providers

You need to enable Google and/or GitHub authentication in Supabase:

**IMPORTANT**: First, add the callback URL to your Supabase project:
1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - For local dev: `http://localhost:3000/auth/callback`
   - For production: `https://eddyb.dev/auth/callback`

#### **Enable GitHub OAuth**

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **GitHub** and click to expand
3. Toggle **Enable Sign in with GitHub**
4. Create a GitHub OAuth App:
   - Go to GitHub.com → Settings → Developer settings → OAuth Apps
   - Click **New OAuth App**
   - **Application name**: Your Portfolio
   - **Homepage URL**: `https://your-domain.com` (or localhost for dev)
   - **Authorization callback URL**: Copy from Supabase (looks like `https://xxx.supabase.co/auth/v1/callback`)
   - Click **Register application**
5. Copy **Client ID** and **Client Secret** from GitHub
6. Paste them into Supabase GitHub provider settings
7. Click **Save**

#### **Enable Google OAuth**

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Sign in with Google**
4. Create a Google OAuth Client:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select existing)
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Configure consent screen if prompted
   - **Application type**: Web application
   - **Authorized JavaScript origins**: Add your domains (e.g., `http://localhost:3000`, `https://your-domain.com`)
   - **Authorized redirect URIs**: Copy from Supabase (looks like `https://xxx.supabase.co/auth/v1/callback`)
   - Click **Create**
5. Copy **Client ID** and **Client Secret**
6. Paste them into Supabase Google provider settings
7. Click **Save**

### 3. Environment Variables

Make sure your `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Test Locally

```bash
pnpm dev
```

1. Navigate to any blog post (e.g., `/blog/my-first-post`)
2. Scroll to the comments section
3. Click "Sign in to comment"
4. Choose GitHub or Google
5. After signing in, post a test comment
6. Verify it appears in real-time
7. Test deleting your own comment

### 5. Deploy

Once tested locally, deploy to Vercel:

```bash
git add .
git commit -m "Add comments system with Supabase auth"
git push
```

Vercel will auto-deploy. Make sure your environment variables are set in Vercel dashboard.

## 🎯 Features Included

- **Authentication**: Google and GitHub OAuth
- **Spam Prevention**: Only authenticated users can comment
- **Ownership**: Users can only delete their own comments
- **Real-time**: Comments update live without refresh
- **Clean UI**: Matches your existing design system
- **RLS Security**: Database-level security policies

## 🔒 Security Notes

- All write operations require authentication (enforced by RLS)
- Users can only delete their own comments (enforced by RLS)
- OAuth tokens are managed by Supabase (secure)
- No API keys exposed to client (uses anon key with RLS)

## 🚀 Optional Enhancements

Consider adding later:
- Rate limiting (1 comment per 10 seconds)
- Comment editing
- Threading/replies
- Markdown support in comments
- Email notifications for new comments
- Admin moderation dashboard

## 📝 File Reference

- **Schema**: `supabase-comments-schema.sql`
- **Auth UI**: `components/AuthButton.tsx`
- **Comment Form**: `components/CommentForm.tsx`
- **Comment List**: `components/CommentsList.tsx`
- **Integration**: `app/blog/[slug]/page.tsx`

## 🐛 Troubleshooting

**Comments not appearing?**
- Check Supabase SQL Editor for errors when running schema
- Verify RLS policies are enabled
- Check browser console for errors

**Can't sign in?**
- Verify OAuth credentials in Supabase dashboard
- Check redirect URLs match exactly
- Ensure providers are enabled in Supabase

**Real-time not working?**
- Verify Supabase Realtime is enabled for the `comments` table
- Check browser console for subscription errors

Need help? Check Supabase docs: https://supabase.com/docs/guides/auth
