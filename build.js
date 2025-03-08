const { execSync } = require('child_process');

// Update browserslist database
console.log('Updating browserslist database...');
execSync('npx browserslist@latest --update-db', { stdio: 'inherit' });

// Generate Prisma client
console.log('Generating Prisma client...');
execSync('npx prisma generate', { stdio: 'inherit' });

// Run Next.js build
console.log('Running Next.js build...');
execSync('npx next build', { stdio: 'inherit' }); 