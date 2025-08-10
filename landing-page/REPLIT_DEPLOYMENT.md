# 🚀 Deploying Memory Engineering MCP Landing Page to Replit

## Quick Deploy (Easiest Method)

1. **Go to Replit**: https://replit.com
2. **Click "Create Repl"**
3. **Import from GitHub**:
   - URL: `https://github.com/romiluz13/memory-engineering-mcp`
   - Select the `/landing-page` folder
4. **Replit will auto-detect Next.js** and set everything up!

## Manual Setup (If needed)

### Step 1: Fork or Import
```bash
# In Replit, import from:
https://github.com/romiluz13/memory-engineering-mcp
```

### Step 2: Navigate to Landing Page
The landing page is in the `/landing-page` directory

### Step 3: Install Dependencies
```bash
cd landing-page
npm install
```

### Step 4: Run Development Server
```bash
npm run dev
```

Your site will be available at your Replit URL!

## Configuration Files Already Included

✅ **`.replit`** - Configures Node.js 20, ports, and build commands
✅ **`replit.nix`** - Sets up Node.js environment
✅ **`next.config.js`** - Optimized for Replit deployment
✅ **`package.json`** - Scripts configured for 0.0.0.0 hostname

## Features Optimized for Replit

- **Port Configuration**: Automatically uses port 3000
- **Hostname Binding**: Set to 0.0.0.0 for Replit access
- **Standalone Output**: Next.js configured for optimal Replit performance
- **Node.js 20**: Latest LTS version for best performance

## Environment Variables (Optional)

No environment variables needed! The landing page is a static marketing site.

## Custom Domain (Replit Hacker Plan)

If you have Replit Hacker plan, you can:
1. Go to your Repl settings
2. Add a custom domain
3. Point your domain to the Repl

## Troubleshooting

### If the site doesn't load:
1. Check the Console tab in Replit
2. Make sure you're in the `/landing-page` directory
3. Try running: `npm run build && npm run start`

### If you see module errors:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### If port issues occur:
The `.replit` file already configures port 3000 → 80 mapping

## Performance Tips

1. **Use Production Build**: Run `npm run build` then `npm run start` for best performance
2. **Enable Always On**: If you have Replit Hacker plan
3. **Monitor Resources**: Check the Resources tab in Replit

## What You Get

- ✨ Beautiful landing page with animations
- 🔥 Code Embeddings feature prominently displayed
- 📱 Mobile responsive design
- 🌙 Dark theme
- ⚡ Fast performance
- 🎯 SEO optimized

## Support

- GitHub Issues: https://github.com/romiluz13/memory-engineering-mcp/issues
- Landing Page Source: `/landing-page` directory

---

**Ready to deploy!** Just import to Replit and watch your landing page go live! 🎉
