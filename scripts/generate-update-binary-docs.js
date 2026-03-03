const fs = require('fs');
const path = require('path');

// Read chains data
const chainsDir = path.join(__dirname, '..', 'Chains');
const templatePath = path.join(__dirname, '..', 'public', 'docs', 'update-binary', 'template.md');
const outputDir = path.join(__dirname, '..', 'public', 'docs', 'update-binary');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read template
const template = fs.readFileSync(templatePath, 'utf8');

// Read all chain files
const chainFiles = fs.readdirSync(chainsDir).filter(f => f.endsWith('.json'));

let count = 0;

chainFiles.forEach(file => {
  try {
    const chainData = JSON.parse(fs.readFileSync(path.join(chainsDir, file), 'utf8'));
    
    // Extract chain info
    const chainName = chainData.chain_name || '';
    const chainId = chainData.chain_id || '';
    const prettyName = chainData.pretty_name || chainName;
    const github = chainData.github || '';
    
    // Determine binary name
    const baseName = chainName.replace(/-mainnet$|-testnet$|-test$/i, '');
    const binary = `${baseName}d`;
    
    // Determine chain directory
    const chainDir = baseName;
    
    // Get repo info from github
    const githubRepo = github ? github.replace('https://github.com/', '') : '';
    const repoName = github ? github.split('/').pop() : chainName;
    
    // Get version info
    const version = chainData.codebase?.recommended_version || 'latest';
    const previousVersion = 'v1.0.0'; // Default, should be updated manually
    const upgradeName = 'upgrade-' + version.replace('v', '');
    
    // Replace placeholders
    let content = template
      .replace(/{CHAIN_NAME}/g, prettyName.replace(/\s+(Mainnet|Testnet)$/i, ''))
      .replace(/{BINARY}d/g, binary)
      .replace(/{BINARY}/g, binary.replace('d', ''))
      .replace(/{CHAIN_ID}/g, chainId)
      .replace(/{CHAIN_DIR}/g, chainDir)
      .replace(/{GITHUB_URL}/g, github)
      .replace(/{GITHUB_REPO}/g, githubRepo)
      .replace(/{REPO_NAME}/g, repoName)
      .replace(/{VERSION}/g, version)
      .replace(/{PREVIOUS_VERSION}/g, previousVersion)
      .replace(/{UPGRADE_NAME}/g, upgradeName);
    
    // Generate filename
    const filename = chainName.toLowerCase().replace(/\s+/g, '-') + '.md';
    const outputPath = path.join(outputDir, filename);
    
    // Write file
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`✓ Generated ${filename}`);
    count++;
    
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log(`\nDone! Generated ${count} update binary documentation files.`);
