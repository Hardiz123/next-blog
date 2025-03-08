#!/bin/bash

# Fix hardcoded URLs
echo "Fixing hardcoded URLs..."
find src -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|http://localhost:3000/api/|/api/|g' 2>/dev/null || find src -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|http://localhost:3000/api/|/api/|g'

# Ensure environment variables are set
echo "Checking environment variables..."
if [ ! -f .env.local ]; then
  echo "Creating .env.local file with default values..."
  echo "NEXT_PUBLIC_BASE_URL=http://localhost:3000" > .env.local
  echo "Warning: Make sure to set up environment variables in Vercel."
fi

# Build the application
echo "Building the application..."
npm run build

# Deploy to Vercel
echo "Deploying to Vercel..."
npx vercel deploy --prod

echo "Deployment complete!" 