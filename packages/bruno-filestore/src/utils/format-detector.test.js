const {
  detectFormatFromContent,
  detectFormatFromFilename,
  getExtensionForFormat,
  getFormatFromCollectionConfig
} = require('./format-detector');

describe('Format Detection Utilities', () => {
  describe('detectFormatFromContent', () => {
    it('should detect YAML format from content', () => {
      const yamlContent1 = `
meta:
  name: Test Request
  seq: 1
http:
  method: GET
  url: https://api.example.com
`;
      const yamlContent2 = `---
name: My Environment
variables:
  - name: baseUrl
    value: https://dev.example.com
`;

      expect(detectFormatFromContent(yamlContent1)).toBe('yaml');
      expect(detectFormatFromContent(yamlContent2)).toBe('yaml');
    });

    it('should detect BRU format from content', () => {
      const bruContent = `
meta {
  name: Test Request
  type: http
}
http-request {
  method: GET
  url: https://example.com
}
`;

      expect(detectFormatFromContent(bruContent)).toBe('bru');
    });

    it('should default to BRU format when content is undefined or empty', () => {
      expect(detectFormatFromContent()).toBe('bru');
      expect(detectFormatFromContent('')).toBe('bru');
      expect(detectFormatFromContent(null)).toBe('bru');
    });
  });

  describe('detectFormatFromFilename', () => {
    it('should detect YAML format from filename', () => {
      expect(detectFormatFromFilename('request.yml')).toBe('yaml');
      expect(detectFormatFromFilename('env.yaml')).toBe('yaml');
      expect(detectFormatFromFilename('/path/to/collection.yaml')).toBe('yaml');
      expect(detectFormatFromFilename('C:\\users\\test\\request.YML')).toBe('yaml');
    });

    it('should detect BRU format from filename', () => {
      expect(detectFormatFromFilename('request.bru')).toBe('bru');
      expect(detectFormatFromFilename('/path/to/env.bru')).toBe('bru');
      expect(detectFormatFromFilename('C:\\users\\test\\collection.BRU')).toBe('bru');
    });

    it('should default to BRU format for unknown extensions', () => {
      expect(detectFormatFromFilename('request.txt')).toBe('bru');
      expect(detectFormatFromFilename('test.json')).toBe('bru');
    });

    it('should default to BRU format when filename is undefined or empty', () => {
      expect(detectFormatFromFilename()).toBe('bru');
      expect(detectFormatFromFilename('')).toBe('bru');
      expect(detectFormatFromFilename(null)).toBe('bru');
    });
  });

  describe('getExtensionForFormat', () => {
    it('should return .yml for YAML format', () => {
      expect(getExtensionForFormat('yaml')).toBe('.yml');
    });

    it('should return .bru for BRU format', () => {
      expect(getExtensionForFormat('bru')).toBe('.bru');
    });

    it('should default to .bru for unknown formats', () => {
      expect(getExtensionForFormat('unknown')).toBe('.bru');
      expect(getExtensionForFormat()).toBe('.bru');
    });
  });

  describe('getFormatFromCollectionConfig', () => {
    it('should get YAML format from collection config', () => {
      const config = { fileFormat: 'yaml', name: 'Test Collection' };
      expect(getFormatFromCollectionConfig(config)).toBe('yaml');
    });

    it('should get BRU format from collection config without fileFormat', () => {
      const config = { name: 'Test Collection' };
      expect(getFormatFromCollectionConfig(config)).toBe('bru');
    });

    it('should default to BRU format when config is undefined', () => {
      expect(getFormatFromCollectionConfig()).toBe('bru');
      expect(getFormatFromCollectionConfig(null)).toBe('bru');
    });
  });
}); 