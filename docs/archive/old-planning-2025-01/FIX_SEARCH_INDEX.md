# Fix MongoDB Atlas Search Index - Critical Issue

## Problem
The search functionality fails with error: "Path 'projectId' needs to be indexed as token"

## Root Cause
The Atlas Search index `memory_text` was created without including `projectId` in the field mappings. The $search operator requires all fields used in the compound filter to be indexed.

## Solution

### Manual Fix in MongoDB Atlas Console

1. **Navigate to Atlas Search**
   - Go to your MongoDB Atlas cluster
   - Click on "Atlas Search" in the left sidebar

2. **Delete the existing index**
   - Find the index named `memory_text`
   - Click the three dots menu → Delete

3. **Create new index with correct configuration**
   - Click "Create Search Index"
   - Choose "JSON Editor"
   - Index Name: `memory_text`
   - Database: `memory_engineering`
   - Collection: `memory_engineering_documents`
   - Use this exact JSON configuration:

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

4. **Wait for index to build**
   - Atlas will show the index status as "Building"
   - Wait until status changes to "Ready" (usually 1-2 minutes)

## Verification

After the index is ready, test the search functionality:

```bash
# Use Claude Code or any MCP client
memory_engineering_search --query "test"
```

The search should now work correctly and return results without the projectId error.

## Why This Happened

1. The original index creation in `src/tools/init.ts` didn't include `projectId` in the field mappings
2. The $search pipeline in `src/tools/search.ts` uses a compound filter that includes `projectId`
3. MongoDB Atlas Search requires all fields used in filters to be explicitly indexed

## Prevention

The fix has been applied to `src/tools/init.ts` (lines 448-452) so new projects will have the correct index configuration. However, existing projects need manual intervention due to Atlas Search limitations on updating existing indexes.

## Alternative: Command Line Fix

If you have Atlas CLI installed:

```bash
# Delete existing index
atlas clusters search indexes delete memory_text \
  --clusterName <your-cluster> \
  --db memory_engineering \
  --collection memory_engineering_documents

# Create new index with correct config
atlas clusters search indexes create \
  --clusterName <your-cluster> \
  --db memory_engineering \
  --collection memory_engineering_documents \
  --file atlas-search-index.json
```

Where `atlas-search-index.json` contains the JSON configuration above.