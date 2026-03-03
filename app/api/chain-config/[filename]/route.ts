import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Security: only allow .json files and prevent directory traversal
    if (!filename.endsWith('.json') || filename.includes('..')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'Chains', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Chain config not found' }, { status: 404 });
    }

    // Read and parse the JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const chainData = JSON.parse(fileContent);

    return NextResponse.json(chainData);
  } catch (error) {
    console.error('Error reading chain config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
