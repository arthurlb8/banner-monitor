# 🚀 NETLIFY DEPLOYMENT GUIDE
## 100% FREE Automated Banner Verification

---

## 🎉 **What You're Getting:**

✅ **FREE Forever** - No monthly costs!  
✅ **Auto HTTPS** - Free SSL certificate  
✅ **Custom Domain** - Easy setup  
✅ **Auto Deploy** - Every git push  
✅ **Daily Scans** - GitHub Actions (FREE)  
✅ **CDN** - Super fast globally  

---

## ⏱️ **Setup Time: 30 Minutes**

### **Prerequisites:**
- GitHub account (free)
- Netlify account (free)

---

## 📋 **STEP-BY-STEP DEPLOYMENT:**

### **PART 1: Setup GitHub Repository (10 minutes)**

#### **1. Create GitHub Account (if needed):**
- Go to: https://github.com/signup
- Create free account

#### **2. Create New Repository:**
1. Click "New" repository
2. **Name:** `banner-verification`
3. **Visibility:** Public (required for free GitHub Actions)
4. ✅ Check "Add README"
5. Click "Create repository"

#### **3. Upload Your Files:**

**Option A: Via GitHub Website (Easy)**
1. Click "Add file" → "Upload files"
2. Drag ALL files from the NETLIFY-SYSTEM folder
3. Make sure to include:
   - `.github/workflows/` folder
   - `public/` folder
   - `scanner/` folder
   - `reference-banners/` folder
   - `websites.csv`
   - `package.json`
   - `netlify.toml`
4. Commit: "Initial commit"

**Option B: Via Git (Advanced)**
```bash
git clone https://github.com/YOUR-USERNAME/banner-verification.git
cd banner-verification
# Copy all NETLIFY-SYSTEM files here
git add .
git commit -m "Initial commit"
git push
```

---

### **PART 2: Setup Netlify (10 minutes)**

#### **1. Create Netlify Account:**
- Go to: https://www.netlify.com/
- Sign up with GitHub (recommended)

#### **2. Import Your Repository:**
1. Click "Add new site" → "Import an existing project"
2. Choose "GitHub"
3. Authorize Netlify
4. Select `banner-verification` repository
5. **Build settings:**
   - Build command: (leave empty)
   - Publish directory: `public`
6. Click "Deploy site"

#### **3. Get Your URL:**
After 1-2 minutes:
- Your site is live!
- URL: `https://random-name-12345.netlify.app`

#### **4. (Optional) Custom Domain:**
1. Click "Domain settings"
2. Click "Add custom domain"
3. Enter your domain (e.g., `banners.example.com`)
4. Follow DNS instructions
5. HTTPS auto-enabled! 🔒

---

### **PART 3: Enable GitHub Actions (5 minutes)**

#### **1. Give GitHub Actions Write Permission:**
1. Go to your GitHub repository
2. Click "Settings" → "Actions" → "General"
3. Scroll to "Workflow permissions"
4. Select "Read and write permissions"
5. Click "Save"

#### **2. Verify Workflow File:**
Make sure `.github/workflows/daily-scan.yml` exists in your repo.

#### **3. Test Manual Run:**
1. Go to "Actions" tab
2. Click "Daily Banner Verification"
3. Click "Run workflow" → "Run workflow"
4. Wait ~10-15 minutes
5. Should see ✅ green checkmark when done

---

### **PART 4: Verify Everything Works (5 minutes)**

#### **1. Check GitHub Actions:**
- Go to "Actions" tab
- Should see successful run ✅
- Click on it to see logs

#### **2. Check Your Netlify Site:**
- Visit: `https://your-site.netlify.app`
- Should see dashboard with results!
- Screenshots should be visible

#### **3. Verify Daily Schedule:**
- Actions will run automatically at 2:00 AM UTC daily
- Or click "Run workflow" anytime to trigger manually

---

## 🎯 **How It Works:**

```
┌────────────────────────────────┐
│  EVERY DAY AT 2:00 AM UTC      │
│  GitHub Actions Triggers       │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────┐
│  GitHub Actions Runner         │
│  1. Install dependencies       │
│  2. Run banner scanner         │
│  3. Take screenshots           │
│  4. Detect banners (OpenCV)    │
│  5. Generate JSON report       │
│  (Takes ~15 minutes)           │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────┐
│  Commit Results to GitHub      │
│  - public/data/results.json    │
│  - public/screenshots/         │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────┐
│  Netlify Auto-Deploys          │
│  (Triggered by git push)       │
│  - Takes 1-2 minutes           │
│  - Site updates automatically  │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────┐
│  YOU VIEW RESULTS              │
│  https://your-site.netlify.app │
│  - See latest banners          │
│  - View screenshots            │
│  - Filter by status            │
└────────────────────────────────┘
```

---

## 🔧 **Configuration:**

### **Change Scan Time:**

Edit `.github/workflows/daily-scan.yml`:

```yaml
schedule:
  - cron: '0 2 * * *'  # 2:00 AM UTC
  # Change to:
  - cron: '0 14 * * *'  # 2:00 PM UTC
  # Or:
  - cron: '30 6 * * *'  # 6:30 AM UTC
```

**Cron Format:** `minute hour day month dayofweek`

### **Add More Reference Images:**

1. Add images to `reference-banners/` folder
2. Edit `scanner/banner-verification-netlify.js`:

```javascript
referenceImages: [
  './reference-banners/metro-campaign.png',
  './reference-banners/obras-campaign.png',
  './reference-banners/policia-campaign.png',
  './reference-banners/new-banner.png'  // ADD THIS
],
```

3. Commit and push

### **Update Websites List:**

Edit `websites.csv`:
```csv
name,url
New Site,https://newsite.com
```

Commit and push!

---

## 💡 **Pro Tips:**

### **1. Timezone Adjustment:**

GitHub Actions runs in UTC. Convert to your timezone:
- **Santo Domingo (AST):** UTC-4
  - 2:00 AM AST = 6:00 AM UTC
  - Use: `cron: '0 6 * * *'`

### **2. Manual Trigger:**

Run scan anytime:
1. Go to GitHub → Actions
2. Click "Daily Banner Verification"
3. Click "Run workflow"

### **3. View Logs:**

Check what happened:
1. Go to GitHub → Actions
2. Click on any run
3. Click "scan-banners"
4. Expand steps to see details

### **4. Custom Domain:**

Make it professional:
```
Before: random-name-12345.netlify.app
After:  banners.yoursite.com
```

1. Netlify → Domain settings
2. Add custom domain
3. Update DNS (takes 5-10 min)
4. Free HTTPS included! 🔒

---

## 🐛 **Troubleshooting:**

### **GitHub Actions Failing:**

**Check:**
1. Workflow permissions (must be "Read and write")
2. View logs in Actions tab
3. Look for error messages

**Common Issues:**
- Missing files → Re-upload everything
- Permission error → Enable write permissions
- Timeout → Reduce sites or pages in config

### **No Results on Dashboard:**

**Check:**
1. Did Actions run successfully? (✅ green)
2. Are files in `public/data/results.json`?
3. Check browser console for errors
4. Hard refresh: Ctrl+Shift+R

### **Screenshots Not Showing:**

**Check:**
1. Path in dashboard matches actual files
2. Screenshots in `public/screenshots/`
3. Netlify deployed latest commit

---

## 📊 **Monitoring:**

### **GitHub Actions Limits (Free Tier):**
- ✅ 2,000 minutes/month (plenty!)
- ✅ 500 MB storage
- ✅ Public repos unlimited

**Your Usage:**
- ~15 min per scan
- 1 scan per day = 450 min/month
- Well within limits! ✅

### **Netlify Limits (Free Tier):**
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Unlimited sites

**Your Usage:**
- ~1 MB per deploy
- 30 deploys/month = 30 MB
- Tiny usage! ✅

---

## 🔐 **Security:**

### **Keep Repository Public:**
- Required for free GitHub Actions
- No sensitive data in repo
- Reference images are public anyway
- Results are public (that's the goal!)

### **No Secrets Needed:**
- No API keys required
- No passwords
- Everything is automated
- GitHub token auto-provided

---

## 📧 **Notifications (Optional):**

Want email when scans complete?

### **GitHub Notifications:**
1. Settings → Notifications
2. Enable "Actions" emails
3. Get notified on failures

### **Custom Webhook:**
Add to workflow:
```yaml
- name: Send notification
  run: |
    curl -X POST https://your-webhook-url \
      -d "Scan completed!"
```

---

## 🎉 **YOU'RE DONE!**

Your system is now:
- ✅ Running in the cloud
- ✅ Scanning daily at 2 AM
- ✅ Updating dashboard automatically
- ✅ Accessible from anywhere
- ✅ 100% FREE!

**Access your dashboard:**
```
https://your-site.netlify.app
```

---

## 📞 **Resources:**

- **Netlify Docs:** https://docs.netlify.com
- **GitHub Actions Docs:** https://docs.github.com/actions
- **Cron Schedule:** https://crontab.guru

---

## 🚀 **Next Steps:**

1. ✅ Bookmark your dashboard URL
2. ✅ Share with your team
3. ✅ Set up custom domain (optional)
4. ✅ Check results tomorrow morning!

**Total Cost:** $0/month forever! 🎉  
**Setup Time:** ~30 minutes  
**Maintenance:** Zero! 

---

**Questions? Issues?**  
Check GitHub Actions logs first - they show exactly what's happening!
