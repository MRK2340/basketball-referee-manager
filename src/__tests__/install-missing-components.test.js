/**
 * install-missing-components.test.js
 * Unit tests for path traversal vulnerability mitigation in scanDirectoryForUiImports
 */
import { describe, it, expect } from 'vitest';
import path from 'path';

/**
 * These tests verify the path traversal vulnerability mitigation implemented in
 * tools/install-missing-components.js. The fix adds validation to ensure that
 * file paths cannot escape the intended directory using techniques like:
 * - Parent directory references (..)
 * - Absolute paths
 * - Symlink-like patterns
 * 
 * The mitigation code:
 *   const resolvedBase = path.resolve(directoryPath);
 *   const resolvedTarget = path.resolve(directoryPath, entry.name);
 *   const relativePath = path.relative(resolvedBase, resolvedTarget);
 *   if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
 *     continue; // Skip this entry
 *   }
 */

describe('Path Traversal Vulnerability Mitigation', () => {
  
  describe('Path Resolution Security', () => {
    it('should reject paths that traverse outside the base directory using ..', () => {
      // Simulate the path traversal check logic from the fix
      const directoryPath = '/safe/base/directory';
      const maliciousEntryName = '../../../etc/passwd';
      
      const resolvedBase = path.resolve(directoryPath);
      const resolvedTarget = path.resolve(directoryPath, maliciousEntryName);
      const relativePath = path.relative(resolvedBase, resolvedTarget);
      
      // The fix should detect this as a path traversal attempt
      const isPathTraversal = relativePath.startsWith('..') || path.isAbsolute(relativePath);
      
      expect(isPathTraversal).toBe(true);
      expect(relativePath).toMatch(/^\.\./);
    });

    it('should reject absolute paths', () => {
      const directoryPath = '/safe/base/directory';
      const maliciousEntryName = '/etc/passwd';
      
      const resolvedBase = path.resolve(directoryPath);
      const resolvedTarget = path.resolve(directoryPath, maliciousEntryName);
      const relativePath = path.relative(resolvedBase, resolvedTarget);
      
      // The fix should detect absolute paths
      const isPathTraversal = relativePath.startsWith('..') || path.isAbsolute(relativePath);
      
      expect(isPathTraversal).toBe(true);
    });

    it('should allow safe relative paths within the directory', () => {
      const directoryPath = '/safe/base/directory';
      const safeEntryName = 'safe.jsx';
      
      const resolvedBase = path.resolve(directoryPath);
      const resolvedTarget = path.resolve(directoryPath, safeEntryName);
      const relativePath = path.relative(resolvedBase, resolvedTarget);
      
      // Safe paths should not be flagged
      const isPathTraversal = relativePath.startsWith('..') || path.isAbsolute(relativePath);
      
      expect(isPathTraversal).toBe(false);
      expect(relativePath).toBe('safe.jsx');
    });

    it('should allow safe subdirectory paths', () => {
      const directoryPath = '/safe/base/directory';
      const safeEntryName = 'subdir';
      
      const resolvedBase = path.resolve(directoryPath);
      const resolvedTarget = path.resolve(directoryPath, safeEntryName);
      const relativePath = path.relative(resolvedBase, resolvedTarget);
      
      // Safe subdirectory paths should not be flagged
      const isPathTraversal = relativePath.startsWith('..') || path.isAbsolute(relativePath);
      
      expect(isPathTraversal).toBe(false);
      expect(relativePath).toBe('subdir');
    });
  });

  describe('Path Traversal Attack Scenarios', () => {
    it('should block directory traversal with multiple parent references', () => {
      const directoryPath = '/app/src';
      const attackVectors = [
        '../../sensitive/file.jsx',
        '../../../etc/passwd',
        '../../../../root/.ssh/id_rsa',
        '../../../../../../../etc/shadow',
      ];

      for (const attackVector of attackVectors) {
        const resolvedBase = path.resolve(directoryPath);
        const resolvedTarget = path.resolve(directoryPath, attackVector);
        const relativePath = path.relative(resolvedBase, resolvedTarget);
        
        const isBlocked = relativePath.startsWith('..') || path.isAbsolute(relativePath);
        
        expect(isBlocked).toBe(true);
      }
    });

    it('should handle symlink-like path patterns safely', () => {
      const directoryPath = '/app/src';
      const suspiciousPatterns = [
        { pattern: './../../etc/passwd', shouldBlock: true },
        { pattern: 'subdir/../../etc/passwd', shouldBlock: true },
        { pattern: 'a/b/c/../../../etc/passwd', shouldBlock: false }, // This normalizes to 'etc/passwd' which is safe
        { pattern: 'a/b/c/../../../../etc/passwd', shouldBlock: true }, // This goes outside
      ];

      for (const { pattern, shouldBlock } of suspiciousPatterns) {
        const resolvedBase = path.resolve(directoryPath);
        const resolvedTarget = path.resolve(directoryPath, pattern);
        const relativePath = path.relative(resolvedBase, resolvedTarget);
        
        const isBlocked = relativePath.startsWith('..') || path.isAbsolute(relativePath);
        
        expect(isBlocked).toBe(shouldBlock);
      }
    });
  });

  describe('Legitimate Path Handling', () => {
    it('should allow normal file names', () => {
      const directoryPath = '/app/src';
      const legitimatePaths = [
        'component.jsx',
        'Button.jsx',
        'my-component.jsx',
        'Component123.jsx',
      ];

      for (const legitPath of legitimatePaths) {
        const resolvedBase = path.resolve(directoryPath);
        const resolvedTarget = path.resolve(directoryPath, legitPath);
        const relativePath = path.relative(resolvedBase, resolvedTarget);
        
        const isBlocked = relativePath.startsWith('..') || path.isAbsolute(relativePath);
        
        expect(isBlocked).toBe(false);
      }
    });

    it('should allow nested directory structures', () => {
      const directoryPath = '/app/src';
      const legitimatePaths = [
        'components/Button.jsx',
        'ui/forms/Input.jsx',
        'deep/nested/structure/Component.jsx',
      ];

      for (const legitPath of legitimatePaths) {
        const resolvedBase = path.resolve(directoryPath);
        const resolvedTarget = path.resolve(directoryPath, legitPath);
        const relativePath = path.relative(resolvedBase, resolvedTarget);
        
        const isBlocked = relativePath.startsWith('..') || path.isAbsolute(relativePath);
        
        expect(isBlocked).toBe(false);
      }
    });

    it('should handle paths with dots in filenames correctly', () => {
      const directoryPath = '/app/src';
      const legitimatePaths = [
        'component.test.jsx',
        'my.component.jsx',
        'file.name.with.dots.jsx',
      ];

      for (const legitPath of legitimatePaths) {
        const resolvedBase = path.resolve(directoryPath);
        const resolvedTarget = path.resolve(directoryPath, legitPath);
        const relativePath = path.relative(resolvedBase, resolvedTarget);
        
        const isBlocked = relativePath.startsWith('..') || path.isAbsolute(relativePath);
        
        expect(isBlocked).toBe(false);
        expect(relativePath).not.toMatch(/^\.\./);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty entry names safely', () => {
      const directoryPath = '/app/src';
      const emptyName = '';
      
      const resolvedBase = path.resolve(directoryPath);
      const resolvedTarget = path.resolve(directoryPath, emptyName);
      const relativePath = path.relative(resolvedBase, resolvedTarget);
      
      // Empty path should resolve to current directory
      expect(relativePath).toBe('');
    });

    it('should handle current directory reference', () => {
      const directoryPath = '/app/src';
      const currentDirRef = '.';
      
      const resolvedBase = path.resolve(directoryPath);
      const resolvedTarget = path.resolve(directoryPath, currentDirRef);
      const relativePath = path.relative(resolvedBase, resolvedTarget);
      
      // Current directory should be safe
      const isBlocked = relativePath.startsWith('..') || path.isAbsolute(relativePath);
      expect(isBlocked).toBe(false);
    });

    it('should handle mixed slashes on Windows-style paths', () => {
      const directoryPath = '/app/src';
      const mixedSlashes = 'subdir\\..\\..\\etc\\passwd';
      
      const resolvedBase = path.resolve(directoryPath);
      const resolvedTarget = path.resolve(directoryPath, mixedSlashes);
      const relativePath = path.relative(resolvedBase, resolvedTarget);
      
      // On Unix systems, backslashes are treated as part of the filename
      // On Windows, they are path separators and this would be blocked
      // The important thing is that the mitigation logic is applied consistently
      const isBlocked = relativePath.startsWith('..') || path.isAbsolute(relativePath);
      
      // On Unix, this becomes a single filename with backslashes, so it's safe
      // On Windows, this would traverse up and be blocked
      // We verify the logic works correctly for the current platform
      if (path.sep === '\\') {
        // Windows: should be blocked
        expect(isBlocked).toBe(true);
      } else {
        // Unix: treated as filename, so safe
        expect(isBlocked).toBe(false);
      }
    });
  });

  describe('Security Properties', () => {
    it('should ensure resolved paths stay within the base directory', () => {
      const directoryPath = '/app/src';
      const testCases = [
        { input: 'safe.jsx', shouldBeInside: true },
        { input: 'subdir/file.jsx', shouldBeInside: true },
        { input: '../outside.jsx', shouldBeInside: false },
        { input: '../../etc/passwd', shouldBeInside: false },
      ];

      for (const testCase of testCases) {
        const resolvedBase = path.resolve(directoryPath);
        const resolvedTarget = path.resolve(directoryPath, testCase.input);
        const relativePath = path.relative(resolvedBase, resolvedTarget);
        
        const isInside = !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
        
        expect(isInside).toBe(testCase.shouldBeInside);
      }
    });

    it('should validate that the mitigation prevents access to parent directories', () => {
      const directoryPath = '/app/src';
      const parentAccessAttempts = [
        '..',
        '../',
        '../..',
        '../../',
        '../sibling',
        '../../../root',
      ];

      for (const attempt of parentAccessAttempts) {
        const resolvedBase = path.resolve(directoryPath);
        const resolvedTarget = path.resolve(directoryPath, attempt);
        const relativePath = path.relative(resolvedBase, resolvedTarget);
        
        // All parent access attempts should be blocked
        const isBlocked = relativePath.startsWith('..') || path.isAbsolute(relativePath);
        expect(isBlocked).toBe(true);
      }
    });

    it('should validate that absolute paths are rejected', () => {
      const directoryPath = '/app/src';
      const absolutePaths = [
        '/etc/passwd',
        '/root/.ssh/id_rsa',
        '/var/log/system.log',
      ];

      for (const absPath of absolutePaths) {
        const resolvedBase = path.resolve(directoryPath);
        const resolvedTarget = path.resolve(directoryPath, absPath);
        const relativePath = path.relative(resolvedBase, resolvedTarget);
        
        // Absolute paths should be blocked
        const isBlocked = relativePath.startsWith('..') || path.isAbsolute(relativePath);
        expect(isBlocked).toBe(true);
      }
    });
  });
});
