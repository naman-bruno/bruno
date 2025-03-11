"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBruFile = parseBruFile;
exports.parseBruFileFromPath = parseBruFileFromPath;
const fs = __importStar(require("fs"));
/**
 * Parse a Bruno .bru file to extract HTTP method and other metadata
 *
 * @param content The content of the .bru file
 * @returns Parsed Bruno request data or undefined if parsing fails
 */
function parseBruFile(content) {
    try {
        // Extract HTTP method by looking for HTTP method blocks (get, post, put, etc.)
        const httpMethodRegex = /(get|post|put|delete|patch|options|head|connect|trace)\s*{/i;
        const httpMethodMatch = content.match(httpMethodRegex);
        if (httpMethodMatch && httpMethodMatch[1]) {
            const method = httpMethodMatch[1].toLowerCase();
            // Extract basic metadata
            const result = {
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
        return undefined;
    }
    catch (error) {
        console.error('Error parsing .bru file:', error);
        return undefined;
    }
}
/**
 * Parse a Bruno .bru file from filesystem
 *
 * @param filePath Path to the .bru file
 * @returns Parsed Bruno request data or undefined if parsing fails
 */
function parseBruFileFromPath(filePath) {
    try {
        if (!fs.existsSync(filePath) || !filePath.endsWith('.bru')) {
            return undefined;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return parseBruFile(content);
    }
    catch (error) {
        console.error(`Error parsing .bru file at ${filePath}:`, error);
        return undefined;
    }
}
//# sourceMappingURL=brunoParser.js.map