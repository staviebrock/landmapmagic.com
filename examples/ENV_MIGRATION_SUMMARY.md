# Environment Variable Migration Summary

This document summarizes the changes made to update all LandMapMagic examples to use environment variables for API keys instead of hardcoded values.

## Changes Made

### 1. Worker API Authentication (`landapi/worker/src/auth.ts`)

**Before:**
- The `dev` API key was accepted in both `development` AND `staging` environments

**After:**
- The `dev` API key is now ONLY accepted in `development` environment
- Staging and production environments **require real API keys**

```typescript
// OLD: Allowed 'dev' in staging
if ((env.ENVIRONMENT === 'development' || env.ENVIRONMENT === 'staging') && api_key === 'dev')

// NEW: Only allows 'dev' in development
if (env.ENVIRONMENT === 'development' && api_key === 'dev')
```

### 2. Environment Variable Setup Files

#### Created `examples/env.example`
A template file showing all available environment variables:
- `VITE_GOOGLE_MAPS_API_KEY` - For Google Maps examples
- `VITE_LANDMAP_API_KEY` - For LandMapMagic API access
- `VITE_MAPBOX_TOKEN` - For Mapbox examples
- `VITE_STAGE_*_API_URL` - Optional API URL overrides for dev/staging/prod

#### Created `examples/src/vite-env.d.ts`
TypeScript definitions for all Vite environment variables to ensure type safety.

### 3. React Example Updates

#### `examples/src/GreenFieldExample.tsx`
**Before:**
- Hardcoded `apiKey="dev"` 
- Hardcoded `baseApiUrl="https://staging-api.landmapmagic.com"`
- Hardcoded API keys in environment configurations

**After:**
- Uses `import.meta.env.VITE_LANDMAP_API_KEY` with `dev` fallback
- Uses `selectedEnvironment.apiKey` from environment selector
- Uses `selectedEnvironment.apiUrl` from environment selector
- Development environment: `apiKey: 'dev'` (allowed in dev only)
- Staging environment: `apiKey: landmapApiKey` (uses env var)
- Production environment: `apiKey: landmapApiKey` (uses env var)

#### `examples/src/ExistingMapboxExample.tsx`
**Already correct** - was already using `import.meta.env.VITE_LANDMAP_API_KEY` with `dev` fallback

### 4. HTML Example Updates

#### `examples/vanilla-html-example.html`
**Before:**
- API key input field defaulted to `value="dev"`
- Default API URL was production

**After:**
- API key input field is empty by default with placeholder text
- Placeholder: `"Enter your API key (or 'dev' for local testing)"`
- Default API URL changed to staging: `https://staging-api.landmapmagic.com`

#### `examples/google-maps-example.html`
**Before:**
- Used `VITE_LANDMAP_API_KEY` with `dev` fallback (no comments)

**After:**
- Added clear comments explaining setup
- Added note that `dev` fallback only works in development environment
```javascript
// To set up: Copy env.example to .env.local and add your API keys
// Note: 'dev' fallback only works in development environment
// For staging/production, you must set VITE_LANDMAP_API_KEY in .env.local
```

#### `examples/google-maps-selectable.html`
Same updates as `google-maps-example.html`

#### `examples/google-maps-aoi-example.html`
Same updates as `google-maps-example.html`

#### `examples/cloudflare-worker-example.ts`
**Before:**
- Basic comment about API_KEYS environment variable

**After:**
- Expanded comments explaining when to use `dev` vs real API keys:
```typescript
// For development: "dev"
// For production: "your-api-key-1,your-api-key-2"
// Note: 'dev' key should only be enabled in development environment
```

### 5. Documentation Updates

#### Created `examples/SETUP.md`
Comprehensive setup guide covering:
- Quick start instructions
- Environment variable configuration
- How to get a LandMapMagic API key
- Development vs Staging vs Production setup
- Troubleshooting common issues
- Security best practices

#### Updated `README.md` (root)
**Before:**
- Brief mention of `.env.local` in root directory
- Said `VITE_LANDMAP_API_KEY` was "optional" and defaulted to `dev`

**After:**
- Clear instructions to create `.env.local` in `examples/` directory
- Added new section: "Development vs Production API Keys"
- Explained when `dev` key works and when it doesn't:
  - ✅ Works with development API instances (localhost)
  - ❌ Does NOT work with staging/production APIs
- Added link to `examples/SETUP.md` for detailed instructions

## Key Behavioral Changes

### For Developers Using the Examples

1. **Local Development (with dev API):**
   - Can still use `VITE_LANDMAP_API_KEY=dev`
   - Only works when connecting to API with `ENVIRONMENT=development`
   - Typically `http://localhost:8787`

2. **Testing with Staging API:**
   - **Must** obtain a real API key from staging admin portal
   - Visit `https://staging-api.landmapmagic.com/admin`
   - Register and generate an API key
   - Set `VITE_LANDMAP_API_KEY=your_actual_key` in `.env.local`

3. **Production:**
   - **Must** use real production API key
   - Never use `dev` key in production

### For API Operators

The worker authentication change means:

1. **Development Worker (`ENVIRONMENT=development`):**
   - Still accepts `dev` API key for easy testing
   - Example: Local worker at `http://localhost:8787`

2. **Staging Worker (`ENVIRONMENT=staging`):**
   - **No longer accepts** `dev` API key
   - Forces use of real API keys for proper testing
   - This allows testing the full authentication flow before production

3. **Production Worker (`ENVIRONMENT=production`):**
   - Never accepted `dev` key (no change)
   - Only real API keys work

## Migration Steps for Users

If you were using the examples before this change:

1. **Create environment file:**
   ```bash
   cd examples
   cp env.example .env.local
   ```

2. **Get API key:**
   - Visit your API's `/admin` endpoint
   - Register an account
   - Generate an API key

3. **Update `.env.local`:**
   ```bash
   VITE_LANDMAP_API_KEY=your_api_key_here
   VITE_GOOGLE_MAPS_API_KEY=your_google_key_here
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

## Security Improvements

1. ✅ No more hardcoded API keys in source code
2. ✅ Staging environment now requires real keys (better security testing)
3. ✅ Clear documentation about when `dev` key works
4. ✅ `.env.local` in `.gitignore` (API keys not committed)
5. ✅ Examples use environment variables by default

## Files Changed

### API Worker
- `landapi/worker/src/auth.ts` - Restricted `dev` key to development only
- `landapi/worker/src/index.ts` - Added JWT payload type (unrelated bug fix)

### Examples Directory
- `examples/env.example` - Created
- `examples/SETUP.md` - Created
- `examples/ENV_MIGRATION_SUMMARY.md` - Created (this file)
- `examples/src/vite-env.d.ts` - Created
- `examples/src/GreenFieldExample.tsx` - Updated to use env vars
- `examples/src/ExistingMapboxExample.tsx` - Removed duplicate type declaration
- `examples/vanilla-html-example.html` - Updated API key input
- `examples/google-maps-example.html` - Added setup comments
- `examples/google-maps-selectable.html` - Added setup comments
- `examples/google-maps-aoi-example.html` - Added setup comments
- `examples/cloudflare-worker-example.ts` - Enhanced comments

### Documentation
- `README.md` - Updated environment variables section

## Testing Checklist

- [x] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Development examples work with `VITE_LANDMAP_API_KEY=dev`
- [ ] Staging examples work with real API key
- [ ] Production examples work with real API key
- [ ] Google Maps examples load with proper API key
- [ ] Mapbox examples load with proper token
- [ ] Vanilla HTML example accepts manual API key input
- [ ] Worker rejects `dev` key in staging environment
- [ ] Worker accepts `dev` key in development environment
- [ ] Worker accepts real API keys in all environments

