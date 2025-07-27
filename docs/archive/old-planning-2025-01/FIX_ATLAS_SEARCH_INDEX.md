# Fix MongoDB Atlas Search Index - CRITICAL

## The Problem
You're seeing this error:
```
Path 'projectId' needs to be indexed as token
```

This happens because the Atlas Search index was created before we understood that `projectId` must be indexed as `token` type, not `string`.

## The Solution - Manual Fix in Atlas UI

### Step 1: Open MongoDB Atlas
1. Go to https://cloud.mongodb.com
2. Navigate to your cluster
3. Click on "Atlas Search" in the left sidebar

### Step 2: Delete Old Indexes
1. Find indexes named `memory_text` and `memory_vectors`
2. Click the three dots → Delete Index
3. Confirm deletion for both

### Step 3: Create New Text Search Index

1. Click "Create Search Index"
2. Choose "JSON Editor"
3. Index Name: `memory_text`
4. Database: `memory_engineering`
5. Collection: `memory_engineering_documents`
6. Paste this EXACT configuration:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "projectId": {
        "type": "token",
        "normalizer": "lowercase"
      },
      "searchableText": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "memoryClass": {
        "type": "token",
        "normalizer": "lowercase"
      },
      "memoryType": {
        "type": "token",
        "normalizer": "lowercase"
      },
      "metadata.tags": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "metadata.importance": {
        "type": "number"
      },
      "metadata.freshness": {
        "type": "date"
      },
      "content.fileName": {
        "type": "token",
        "normalizer": "lowercase"
      },
      "content.markdown": {
        "type": "string",
        "analyzer": "lucene.standard"
      }
    }
  }
}
```

7. Click "Create Search Index"
8. Wait 2-3 minutes for index to build

### Step 4: Create Vector Search Index

1. Click "Create Search Index" again
2. Choose "JSON Editor"
3. Index Name: `memory_vectors`
4. Database: `memory_engineering`
5. Collection: `memory_engineering_documents`
6. Paste this configuration:

```json
{
  "fields": [{
    "type": "vector",
    "path": "contentVector",
    "numDimensions": 1024,
    "similarity": "cosine"
  }]
}
```

7. Click "Create Search Index"
8. Wait 2-3 minutes for index to build

### Step 5: Verify Indexes Are Active
- Both indexes should show "Active" status
- If they show "Building", wait a few more minutes

## Alternative: Command Line Fix

If you have Atlas CLI installed:

```bash
# Delete old indexes
atlas clusters search indexes delete memory_text --clusterName YOUR_CLUSTER --projectId YOUR_PROJECT_ID
atlas clusters search indexes delete memory_vectors --clusterName YOUR_CLUSTER --projectId YOUR_PROJECT_ID

# Create new indexes using the JSON files
atlas clusters search indexes create --clusterName YOUR_CLUSTER --file scripts/atlas-search-indexes.json
```

## Verification

After indexes are recreated, test with:

```bash
# This should now work without errors
memory_engineering_search --query "test search"
```

## Why This Happens

MongoDB Atlas Search has two field types for exact matching:
- `string`: For full-text search (analyzed)
- `token`: For exact filtering (not analyzed)

Since `projectId` is used for filtering (not searching), it MUST be `token` type.

## Prevention

Always use the init script for new projects:
```bash
memory_engineering_init
```

This creates the correct index configuration from the start.

---

**⚠️ IMPORTANT**: This is a ONE-TIME fix. Once corrected, the indexes will work perfectly.