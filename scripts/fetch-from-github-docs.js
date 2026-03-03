const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/winsnip-official/Docs/main/install/';
const LOCAL_DIR = path.join(__dirname, '..', 'public', 'docs', 'install');

// Get list of files from local directory
const localFiles = fs.readdirSync(LOCAL_DIR).filter(f => f.endsWith('.md'));

let count = 0;
let skipped = 0;
let errors = 0;

async function fetchFile(filename) {
  return new Promise((resolve, reject) => {
    const url = GITHUB_RAW_URL + filename;
    
    https.get(url, (res) => {
      if (res.statusCode === 404) {
        resolve(null); // File not found on GitHub
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function processFiles() {
  console.log(`🔍 Checking ${localFiles.length} files...\n`);
  
  for (const file of localFiles) {
    try {
      const content = await fetchFile(file);
      
      if (content === null) {
        console.log(`⊘ Skipped ${file} - Not found on GitHub`);
        skipped++;
        continue;
      }
      
      // Write to local file
      const localPath = path.join(LOCAL_DIR, file);
      fs.writeFileSync(localPath, content, 'utf8');
      console.log(`✓ Updated ${file}`);
      count++;
      
    } catch (error) {
      console.log(`✗ Error ${file} - ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n✨ Done!`);
  console.log(`   Updated: ${count} files`);
  console.log(`   Skipped: ${skipped} files`);
  console.log(`   Errors: ${errors} files`);
}

processFiles();
