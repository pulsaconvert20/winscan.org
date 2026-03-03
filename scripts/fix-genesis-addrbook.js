const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'public', 'docs', 'install');

// Read all markdown files
const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));

let count = 0;

files.forEach(file => {
  const filePath = path.join(docsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern: Genesis inside Initialize code block (curl)
  const pattern1 = /# Initialize node\n([^\n]+)d init \$MONIKER --chain-id \$CHAIN_ID\n\n# Download genesis file\ncurl -Ls ([^\s]+) > (\$HOME\/[^\n]+)\n\n# Verify genesis\n([^\n]+)d validate-genesis/g;
  
  if (pattern1.test(content)) {
    content = content.replace(pattern1, (match, binaryPrefix, url, filepath, binaryPrefix2) => {
      modified = true;
      const dir = filepath.replace('/config/genesis.json', '');
      const addrbookUrl = url.replace('/genesis', '/addrbook');
      
      return `# Initialize node
${binaryPrefix}d init $MONIKER --chain-id $CHAIN_ID
\`\`\`

# Download genesis file

\`\`\`bash
curl -Ls ${url} > ${filepath}

# Verify genesis
${binaryPrefix2}d validate-genesis
\`\`\`

# Download addrbook

\`\`\`bash
curl -Ls ${addrbookUrl} > ${dir}/config/addrbook.json`;
    });
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${file}`);
    count++;
  }
});

console.log(`\nDone! Updated ${count} files.`);


