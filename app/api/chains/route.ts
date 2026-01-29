import { createRoute } from '@/lib/routes/factory';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export const GET = createRoute({
  requiredParams: [],
  cacheConfig: {
    ttl: 300000, // 5 minutes
    staleWhileRevalidate: 600000 // 10 minutes
  },
  handler: async () => {
    const chainsDir = path.join(process.cwd(), 'Chains');
    
    // Read all JSON files from Chains directory
    const files = fs.readdirSync(chainsDir).filter(file => file.endsWith('.json'));
    
    const chains = files.map(file => {
      const filePath = path.join(chainsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    });
    
    // Sort by chain_name
    chains.sort((a, b) => a.chain_name.localeCompare(b.chain_name));
    
    return chains;
  }
});
