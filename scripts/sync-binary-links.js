const fs = require('fs');
const path = require('path');

const installDir = path.join(__dirname, '..', 'public', 'docs', 'install');
const updateDir = path.join(__dirname, '..', 'public', 'docs', 'update-binary');

// Read all install docs
const installFiles = fs.readdirSync(installDir).filter(f => f.endsWith('.md'));

let count = 0;

installFiles.forEach(file => {
  const installPath = path.join(installDir, file);
  const updatePath = path.join(updateDir, file);
  
  // Check if update-binary file exists
  if (!fs.existsSync(updatePath)) {
    console.log(`⊘ Skipped ${file} - No update-binary file found`);
    return;
  }
  
  // Read install doc
  const installContent = fs.readFileSync(installPath, 'utf8');
  
  // Extract binary download section from install doc
  const binaryPattern = /### 2\. Download and Install Binary\s*```bash\s*([\s\S]*?)```/;
  const match = installContent.match(binaryPattern);
  
  if (!match) {
    console.log(`⊘ Skipped ${file} - No binary section found in install doc`);
    return;
  }
  
  const binaryCommands = match[1].trim();
  
  // Read update-binary doc
  let updateContent = fs.readFileSync(updatePath, 'utf8');
  
  // Replace "Option B: Build from Source" section
  const optionBPattern = /(#### Option B: Build from Source\s*```bash\s*)([\s\S]*?)(```)/;
  
  if (optionBPattern.test(updateContent)) {
    updateContent = updateContent.replace(optionBPattern, (match, prefix, oldCode, suffix) => {
      return prefix + binaryCommands + '\n' + suffix;
    });
    
    fs.writeFileSync(updatePath, updateContent, 'utf8');
    console.log(`✓ Updated ${file}`);
    count++;
  } else {
    console.log(`⊘ Skipped ${file} - Pattern not found in update-binary doc`);
  }
});

console.log(`\nDone! Updated ${count} update-binary files.`);
