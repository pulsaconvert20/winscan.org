const fs = require('fs');
const path = require('path');

// Read chains data
const chainsDir = path.join(__dirname, '..', 'Chains');
const templatePath = path.join(__dirname, '..', 'public', 'docs', 'cheatsheet', 'template.md');
const outputDir = path.join(__dirname, '..', 'public', 'docs', 'cheatsheet');

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
    
    // Determine binary name
    const baseName = chainName.replace(/-mainnet$|-testnet$|-test$/i, '');
    const binary = `${baseName}d`;
    
    // Determine chain directory
    const chainDir = baseName;
    
    // Get gas price info
    const feeToken = chainData.fees?.fee_tokens?.[0];
    const denom = feeToken?.denom || chainData.assets?.[0]?.base || 'utoken';
    
    let gasPrice = '0.001';
    if (feeToken) {
      if (feeToken.low_gas_price !== undefined && feeToken.low_gas_price !== null) {
        gasPrice = feeToken.low_gas_price.toString();
      } else if (feeToken.fixed_min_gas_price !== undefined && feeToken.fixed_min_gas_price !== null) {
        gasPrice = feeToken.fixed_min_gas_price.toString();
      } else if (feeToken.average_gas_price !== undefined && feeToken.average_gas_price !== null) {
        gasPrice = (feeToken.average_gas_price * 0.8).toString();
      }
    }
    
    // Get RPC URL
    const rpcUrl = chainData.rpc?.[0]?.address?.replace('https://', '').replace('http://', '') || 'rpc.example.com';
    
    // Get repo name from github
    const repoName = chainData.github ? chainData.github.split('/').pop() : chainName;
    
    // Default port
    const port = '26';
    
    // Replace placeholders
    let content = template
      .replace(/{CHAIN_NAME}/g, prettyName.replace(/\s+(Mainnet|Testnet)$/i, ''))
      .replace(/{BINARY}d/g, binary)
      .replace(/{BINARY}/g, binary.replace('d', ''))
      .replace(/{CHAIN_ID}/g, chainId)
      .replace(/{DENOM}/g, denom)
      .replace(/{GAS_PRICE}/g, gasPrice)
      .replace(/{CHAIN_DIR}/g, chainDir)
      .replace(/{RPC_URL}/g, rpcUrl)
      .replace(/{REPO_NAME}/g, repoName)
      .replace(/{PORT}/g, port);
    
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

console.log(`\nDone! Generated ${count} cheatsheet files.`);
