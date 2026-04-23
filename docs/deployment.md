# Deployment

## Lovable hosting (recommended)

1. Open the [Lovable project](https://lovable.dev/projects/650cf0a2-871e-4448-bdc4-a29898cc14e9)
2. Click **Share → Publish**
3. (Optional) Connect a custom domain via **Project → Settings → Domains**

## cPanel / shared hosting

1. Build locally:
   ```bash
   npm run build
   ```
2. Upload `dist/` contents to `public_html/` (or a subdomain root).
3. Add a `.htaccess` to enable SPA routing:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
4. Verify env vars in `dist/index.html` reference the correct Supabase URL.

## Mobile (Capacitor)

```bash
npm run build
npx cap sync
npx cap open android    # Android Studio
npx cap open ios        # Xcode
```

Required Capacitor plugins are pre-configured: Camera, Geolocation, Filesystem, Network, Push Notifications, Splash Screen, Status Bar.

## Environment

All connection strings (Supabase URL, anon key) are auto-injected via Lovable Cloud. No `.env` editing is required for production builds.

For M-Pesa Daraja credentials, store as Supabase Edge Function secrets:
```bash
# Set via Lovable secrets panel:
MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET
MPESA_SHORTCODE
MPESA_PASSKEY
MPESA_CALLBACK_URL
```
