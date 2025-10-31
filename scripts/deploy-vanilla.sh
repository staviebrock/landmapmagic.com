#!/bin/bash
set -e

echo "🚀 Deploying LandMapMagic Vanilla JS to Cloudflare R2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required environment variables are set
if [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ] || [ -z "$R2_BUCKET" ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    echo "   R2_ACCESS_KEY_ID"
    echo "   R2_SECRET_ACCESS_KEY" 
    echo "   R2_BUCKET"
    echo ""
    echo "Set these in your environment or .env file"
    exit 1
fi

# Build the vanilla version first
echo -e "${BLUE}📦 Building vanilla JS bundle...${NC}"
npm run build

# Check if build succeeded - handle both possible filenames
VANILLA_FILE=""
if [ -f "dist/landmap-vanilla.js" ]; then
    VANILLA_FILE="dist/landmap-vanilla.js"
elif [ -f "dist/landmap-vanilla.global.js" ]; then
    VANILLA_FILE="dist/landmap-vanilla.global.js"
    # Create a symlink with the expected name
    ln -sf landmap-vanilla.global.js dist/landmap-vanilla.js
    ln -sf landmap-vanilla.global.js.map dist/landmap-vanilla.js.map
else
    echo -e "${RED}❌ Build failed - vanilla JS file not found${NC}"
    echo "Expected: dist/landmap-vanilla.js or dist/landmap-vanilla.global.js"
    echo "Make sure 'npm run build' completed successfully"
    exit 1
fi

echo -e "${BLUE}📁 Using vanilla JS file: ${VANILLA_FILE}${NC}"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}📋 Version: ${VERSION}${NC}"

# Get file sizes for reporting
MAIN_SIZE=$(du -h dist/landmap-vanilla.js | cut -f1)
MAP_SIZE=$(du -h dist/landmap-vanilla.js.map | cut -f1)

echo -e "${BLUE}📊 File sizes:${NC}"
echo "   landmap-vanilla.js: ${MAIN_SIZE}"
echo "   landmap-vanilla.js.map: ${MAP_SIZE}"

# Set up AWS CLI configuration for R2
export AWS_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=auto

# Determine endpoint URL
if [ -z "$R2_ENDPOINT_URL" ]; then
    if [ -z "$R2_ACCOUNT_ID" ]; then
        echo -e "${RED}❌ Either R2_ENDPOINT_URL or R2_ACCOUNT_ID must be set${NC}"
        exit 1
    fi
    ENDPOINT_URL="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
else
    ENDPOINT_URL=$R2_ENDPOINT_URL
fi

echo -e "${BLUE}☁️ Uploading to Cloudflare R2...${NC}"
echo "   Bucket: ${R2_BUCKET}"
echo "   Endpoint: ${ENDPOINT_URL}"

# Upload versioned file (long cache)
echo -e "${YELLOW}📤 Uploading versioned file...${NC}"
aws s3 cp dist/landmap-vanilla.js "s3://${R2_BUCKET}/js/landmap-${VERSION}.js" \
    --endpoint-url "$ENDPOINT_URL" \
    --content-type "application/javascript" \
    --cache-control "public, max-age=31536000, immutable" \
    --metadata "version=${VERSION},build-date=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Upload latest version (short cache for updates)
echo -e "${YELLOW}📤 Uploading latest file...${NC}"
aws s3 cp dist/landmap-vanilla.js "s3://${R2_BUCKET}/js/landmap-latest.js" \
    --endpoint-url "$ENDPOINT_URL" \
    --content-type "application/javascript" \
    --cache-control "public, max-age=3600" \
    --metadata "version=${VERSION},build-date=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Upload source map (versioned only)
echo -e "${YELLOW}📤 Uploading source map...${NC}"
aws s3 cp dist/landmap-vanilla.js.map "s3://${R2_BUCKET}/js/landmap-${VERSION}.js.map" \
    --endpoint-url "$ENDPOINT_URL" \
    --content-type "application/json" \
    --cache-control "public, max-age=31536000, immutable"

# Upload a minified version without source map for production use
echo -e "${YELLOW}📤 Creating production version (no source map)...${NC}"
# Remove source map reference from the JS file
sed 's|//# sourceMappingURL=.*||g' dist/landmap-vanilla.js > dist/landmap-vanilla.prod.js

aws s3 cp dist/landmap-vanilla.prod.js "s3://${R2_BUCKET}/js/landmap-${VERSION}.min.js" \
    --endpoint-url "$ENDPOINT_URL" \
    --content-type "application/javascript" \
    --cache-control "public, max-age=31536000, immutable" \
    --metadata "version=${VERSION},build-date=$(date -u +%Y-%m-%dT%H:%M:%SZ),type=production"

aws s3 cp dist/landmap-vanilla.prod.js "s3://${R2_BUCKET}/js/landmap-latest.min.js" \
    --endpoint-url "$ENDPOINT_URL" \
    --content-type "application/javascript" \
    --cache-control "public, max-age=3600" \
    --metadata "version=${VERSION},build-date=$(date -u +%Y-%m-%dT%H:%M:%SZ),type=production"

# Clean up temp file
rm -f dist/landmap-vanilla.prod.js

# Determine public URL
if [ -n "$R2_PUBLIC_BASEURL" ]; then
    PUBLIC_BASE=$R2_PUBLIC_BASEURL
else
    PUBLIC_BASE="https://pub-$(echo $R2_ACCOUNT_ID | tr '[:upper:]' '[:lower:]').r2.dev"
fi

echo ""
echo -e "${GREEN}✅ Deployed successfully!${NC}"
echo ""
echo -e "${BLUE}📍 CDN URLs:${NC}"
echo "   Latest (dev):     ${PUBLIC_BASE}/js/landmap-latest.js"
echo "   Latest (prod):    ${PUBLIC_BASE}/js/landmap-latest.min.js"
echo "   Version (dev):    ${PUBLIC_BASE}/js/landmap-${VERSION}.js"
echo "   Version (prod):   ${PUBLIC_BASE}/js/landmap-${VERSION}.min.js"
echo "   Source Map:       ${PUBLIC_BASE}/js/landmap-${VERSION}.js.map"
echo ""
echo -e "${BLUE}📖 Usage Example:${NC}"
echo '<script src="'${PUBLIC_BASE}'/js/landmap-latest.min.js"></script>'
echo '<script>'
echo '  LandMapMagic.createMap("map", {'
echo '    apiKey: "your-api-key",'
echo '    initialVisibleLayers: ["ssurgo"]'
echo '  });'
echo '</script>'
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
