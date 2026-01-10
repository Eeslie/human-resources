# Email Setup Guide (Nodemailer - SMTP)

## Quick Setup with Gmail (Easiest)

1. **Create or edit `.env.local` file** in the `human-resources-master` directory (same level as `package.json`)

2. **Generate Gmail App Password:**
   - Go to https://myaccount.google.com/
   - Click **Security** in the left sidebar
   - Enable **2-Step Verification** (if not already enabled)
   - Under "2-Step Verification", click **App Passwords**
   - Select "Mail" as the app and "Other" as device
   - Copy the 16-character password generated

3. **Add to `.env.local`:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ```

4. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

## Other Email Providers

### Outlook/Office 365
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Yahoo
```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

### Custom SMTP Server
```
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
```

## Troubleshooting

### "Email service not configured"
- Make sure `.env.local` is in the correct directory (`human-resources-master/`)
- Check that `SMTP_USER` and `SMTP_PASSWORD` are set
- Restart your dev server after adding credentials

### "EAUTH" Authentication Failed
- **For Gmail**: Use an App Password, not your regular password
- Make sure 2-Step Verification is enabled
- Double-check the app password is correct

### "ECONNECTION" Connection Failed
- Check `SMTP_HOST` and `SMTP_PORT` are correct for your provider
- Try port 465 with `SMTP_SECURE=true` if 587 doesn't work
- Check firewall/antivirus isn't blocking the connection

### Still not working?
- Check the terminal/console for detailed error messages
- Verify your email and password are correct
- Make sure the `.env.local` file is in the right location
