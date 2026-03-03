const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'public', 'docs', 'install');
const chainsDir = path.join(__dirname, '..', 'Chains');

// Read all markdown files
const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));

let count = 0;

files.forEach(file => {
  const filePath = path.join(docsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Try to find corresponding chain data
  const chainName = file.replace('.md', '');
  const chainFiles = fs.readdirSync(chainsDir).filter(f => f.endsWith('.json'));
  
  let chainData = null;
  for (const chainFile of chainFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(chainsDir, chainFile), 'utf8'));
    const dataChainName = data.chain_name.toLowerCase().replace(/\s+/g, '-');
    if (dataChainName === chainName) {
      chainData = data;
      break;
    }
  }
  
  if (!chainData) {
    console.log(`⊘ Skipped ${file} - No chain data found`);
    return;
  }
  
  const baseName = chainName.replace(/-mainnet$|-testnet$|-test$/i, '');
  const binary = `${baseName}d`;
  
  // Pattern to find "### 2. Download and Install Binary" section with git clone
  const pattern = /(### 2\. Download and Install Binary\s*```bash\s*)# Clone repository\s*cd \$HOME\s*git clone [^\n]+\s*cd [^\n]+\s*# Checkout recommended version\s*git checkout [^\n]+\s*# Build binary\s*make install\s*# Verify installation\s*[^\n]+d version(\s*```)/;
  
  if (pattern.test(content)) {
    content = content.replace(pattern, (match, prefix, suffix) => {
      modified = true;
      
      // Restore to original bash substitution format
      const githubUrl = chainData.github || 'https://github.com/example/repo';
      const version = chainData.codebase?.recommended_version || 'latest';
      
      const newCode = `# Clone repository
cd $HOME
git clone ${githubUrl}
cd $(basename ${githubUrl} .git)

# Checkout recommended version
git checkout ${version}

# Build binary
make install

# Verify installation
$(basename ${githubUrl} .git)d version`;
      
      return prefix + newCode + suffix;
    });
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Restored ${file}`);
    count++;
  } else {
    console.log(`⊘ Skipped ${file} - Pattern not found or already in correct format`);
  }
});

console.log(`\nDone! Restored ${count} files.`);
