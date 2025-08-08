# 🔧 Memory Engineering MCP - Troubleshooting Guide

## 🚨 **CRITICAL ISSUES**

### **Connection Errors**

#### **MongoDB Connection Failed**
```
Error: MONGODB_URI environment variable is not set
```
**Solution:**
1. Copy `.env.example` to `.env`: `cp .env.example .env`
2. Add your MongoDB Atlas connection string to `.env`
3. Ensure your IP is whitelisted in MongoDB Atlas Network Access

#### **Voyage AI API Error**
```
Error: VOYAGE_API_KEY environment variable is not set
```
**Solution:**
1. Get API key from https://dash.voyageai.com/api-keys
2. Add to `.env`: `VOYAGE_API_KEY=pa-your-key-here`

### **Build Errors**

#### **TypeScript Compilation Failed**
```
error TS2307: Cannot find module
```
**Solution:**
1. Install dependencies: `npm install`
2. Clean build: `rm -rf dist && npm run build`
3. Check Node.js version: `node --version` (requires 18+)

#### **Import/Export Errors**
```
SyntaxError: Cannot use import statement outside a module
```
**Solution:**
1. Ensure `"type": "module"` in package.json
2. Use `.js` extensions in imports
3. Check tsconfig.json `"module": "ESNext"`

---

## ⚠️ **MODERATE ISSUES**

### **Search Not Working**

#### **No Search Results**
**Symptoms:** Search returns empty results despite having data
**Solution:**
1. Check MongoDB Atlas Search indexes exist
2. Run: `npm run db:indexes` to create indexes
3. Wait 2-3 minutes for indexes to build
4. Verify in Atlas UI: Database → Search → Indexes

#### **Vector Search Failed**
```
Error: index not found: memory_vectors
```
**Solution:**
1. Create vector search index manually in Atlas UI
2. Use index definition from `src/utils/search-indexes-v5.ts`
3. Set dimensions to 1024 for voyage-3 model

### **Code Sync Issues**

#### **AST Parsing Errors**
```
Error: Cannot traverse AST
```
**Solution:**
1. Check file encoding (must be UTF-8)
2. Verify syntax is valid for the language
3. Skip problematic files with ignore patterns

#### **Embedding Generation Slow**
**Symptoms:** Code sync takes very long
**Solution:**
1. Reduce batch size in code sync
2. Use `includeTests: false` to skip test files
3. Add ignore patterns for large generated files

---

## ℹ️ **MINOR ISSUES**

### **Performance**

#### **High Memory Usage**
**Solution:**
1. Reduce `MONGODB_MAX_POOL_SIZE` in .env
2. Process files in smaller batches
3. Use `minChunkSize` to filter small chunks

#### **Slow Queries**
**Solution:**
1. Ensure proper MongoDB indexes exist
2. Use specific search terms instead of broad queries
3. Limit search results with `limit` parameter

### **Logging**

#### **Log Files Growing Large**
**Solution:**
1. Set custom log directory: `LOG_DIRECTORY=/tmp/logs`
2. Implement log rotation (external tool)
3. Set `NODE_ENV=production` to reduce debug logs

---

## 🔍 **DEBUGGING STEPS**

### **1. Environment Check**
```bash
# Check Node.js version
node --version  # Should be 18+

# Check environment variables
cat .env | grep -E "(MONGODB_URI|VOYAGE_API_KEY)"

# Test MongoDB connection
npm run db:test
```

### **2. Build Verification**
```bash
# Clean build
rm -rf dist
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### **3. Database Verification**
```bash
# List databases
npm run db:list

# Check collections
npm run db:collections

# Verify indexes
npm run db:indexes
```

### **4. API Testing**
```bash
# Test Voyage AI connection
curl -H "Authorization: Bearer $VOYAGE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"input":"test","model":"voyage-3"}' \
     https://api.voyageai.com/v1/embeddings
```

---

## 📋 **COMMON SOLUTIONS**

### **Complete Reset**
```bash
# 1. Clean everything
rm -rf node_modules dist logs
rm .env

# 2. Fresh install
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 4. Build and test
npm run build
npm run db:indexes
```

### **Index Recreation**
```bash
# Delete and recreate all indexes
npm run db:indexes --force

# Or manually in Atlas UI:
# 1. Go to Database → Search → Indexes
# 2. Delete existing indexes
# 3. Create new ones with correct definitions
```

---

## 🆘 **GETTING HELP**

### **Log Analysis**
1. Check logs in `./logs/` directory
2. Look for ERROR level messages
3. Note timestamps and error patterns

### **Issue Reporting**
Include in your report:
- Node.js version: `node --version`
- Package version: `npm list memory-engineering-mcp`
- Environment: Development/Production
- Error logs with timestamps
- Steps to reproduce

### **Resources**
- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- Voyage AI API Docs: https://docs.voyageai.com/
- TypeScript Handbook: https://www.typescriptlang.org/docs/

---

**💡 Most issues are resolved by ensuring proper environment setup and valid API credentials!**
