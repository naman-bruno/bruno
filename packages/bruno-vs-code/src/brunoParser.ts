import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface representing parsed Bruno request file content
 */
export interface BrunoRequestFile {
  method: string;
  url?: string;
  type?: string;
  name?: string;
}

/**
 * Parse a Bruno .bru file to extract HTTP method and other metadata
 * 
 * @param content The content of the .bru file
 * @returns Parsed Bruno request data or undefined if parsing fails
 */
export function parseBruFile(content: string): BrunoRequestFile | undefined {
  try {
    // Extract HTTP method by looking for HTTP method blocks (get, post, put, etc.)
    const httpMethodRegex = /(get|post|put|delete|patch|options|head|connect|trace)\s*{/i;
    const httpMethodMatch = content.match(httpMethodRegex);
    
    if (httpMethodMatch && httpMethodMatch[1]) {
      const method = httpMethodMatch[1].toLowerCase();
      
      // Extract basic metadata
      const result: BrunoRequestFile = {
        method
      };
      
      // Extract URL if present
      const urlRegex = /url:\s*([^\n]+)/i;
      const urlMatch = content.match(urlRegex);
      if (urlMatch && urlMatch[1]) {
        result.url = urlMatch[1].trim();
      }
      
      // Extract name from meta block if present
      const metaNameRegex = /meta\s*{[^}]*name:\s*([^\n,]+)/i;
      const metaNameMatch = content.match(metaNameRegex);
      if (metaNameMatch && metaNameMatch[1]) {
        result.name = metaNameMatch[1].trim();
      }
      
      // Extract type from meta block if present
      const metaTypeRegex = /meta\s*{[^}]*type:\s*([^\n,]+)/i;
      const metaTypeMatch = content.match(metaTypeRegex);
      if (metaTypeMatch && metaTypeMatch[1]) {
        result.type = metaTypeMatch[1].trim();
      }
      
      return result;
    }

    // Check if this is a GraphQL request, which may not have a standard HTTP method block
    const graphqlTypeRegex = /meta\s*{[^}]*type:\s*graphql/i;
    if (content.match(graphqlTypeRegex)) {
      return {
        method: 'post', // GraphQL requests typically use POST
        name: extractMetaName(content),
        type: 'graphql'
      };
    }
    
    return undefined;
  } catch (error) {
    console.error('Error parsing .bru file:', error);
    return undefined;
  }
}

/**
 * Extract the name from a meta block
 */
function extractMetaName(content: string): string {
  const metaNameRegex = /meta\s*{[^}]*name:\s*([^\n,]+)/i;
  const metaNameMatch = content.match(metaNameRegex);
  return metaNameMatch && metaNameMatch[1] ? metaNameMatch[1].trim() : 'Unnamed Request';
}

/**
 * Parse a Bruno .bru file from filesystem
 * 
 * @param filePath Path to the .bru file
 * @returns Parsed Bruno request data or undefined if parsing fails
 */
export function parseBruFileFromPath(filePath: string): BrunoRequestFile | undefined {
  try {
    if (!fs.existsSync(filePath) || !filePath.endsWith('.bru')) {
      return undefined;
    }

    // Skip folder.bru files which define collection structure, not requests
    if (path.basename(filePath) === 'folder.bru') {
      return undefined;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseBruFile(content);
  } catch (error) {
    console.error(`Error parsing .bru file at ${filePath}:`, error);
    return undefined;
  }
}

/**
 * Check if a directory contains a Bruno collection
 * A Bruno collection contains either a bruno.json file or .bru files
 * 
 * @param directoryPath Path to check
 * @returns true if directory is a Bruno collection
 */
export function isBrunoCollection(directoryPath: string): boolean {
  try {
    if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
      return false;
    }
    
    // Check for bruno.json
    if (fs.existsSync(path.join(directoryPath, 'bruno.json'))) {
      return true;
    }
    
    // Check for .bru files
    const files = fs.readdirSync(directoryPath);
    return files.some(file => file.endsWith('.bru'));
  } catch (error) {
    console.error(`Error checking for Bruno collection at ${directoryPath}:`, error);
    return false;
  }
} 