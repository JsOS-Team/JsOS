'use strict';

const PathUtils = require('.');

const path = new PathUtils({});

describe('System path tests', () => {
  describe('isSystemPath tests', () => {
    /* test('isSystemPath should throw an error if path isn\'t a String', () => {
      expect(path.isSystemPath(null)).toTrow('path must be a String');
    }); */

    test('isSystemPath should return false for /hd0/p0/test.txt', () => {
      expect(path.isSystemPath('/hd0/p0/test.txt')).toBe(false);
    });
    test('isSystemPath should return true for /system/map.md', () => {
      expect(path.isSystemPath('/system/map.md')).toBe(true);
    });
  });

  describe('extractSystemPath test', () => {
    test('should transform /system/js/index.js => /js/index.js', () => {
      expect(path.extractSystemPath('/system/js/index.js')).toBe('/js/index.js');
    });
  });
});
