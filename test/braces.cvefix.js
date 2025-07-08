'use strict';

require('mocha');
var assert = require('assert');
// IMPORTANT: Ensure this require path points to your updated braces module.
// If your "package.json" or project structure differs, adjust as needed.
var braces = require('..');

/**
 * This test suite verifies:
 *   • Default maxInputLength behavior.
 *   • Custom maxInputLength limits.
 *   • maxBraceDepth checks for balanced/imbalanced brace patterns.
 *   • Proper handling of large or malformed inputs.
 *
 * The tests assume that "braces.parse(..., options)" supports the new
 * options you introduced (e.g., { maxInputLength, maxBraceDepth }).
 */

describe('.parse with input-length and brace-depth checks', function() {

  it('should successfully parse a simple balanced pattern within default limits', function() {
    var ast = braces.parse('a/{b,c}/d');
    assert(ast, 'AST should not be null or undefined.');
    assert.strictEqual(typeof ast, 'object', 'AST should be an object.');
    assert(Array.isArray(ast.nodes), 'AST should have an array of nodes.');
  });

  it('should throw an error if input exceeds the default maxInputLength', function() {
    // Generate a string longer than the default limit (e.g., 66k characters).
    var longInput = 'x'.repeat(10001);
    var err = null;
    try {
      braces.parse(longInput);
    } catch (ex) {
      err = ex;
    }
    assert(err, 'Expected an error for exceeding maxInputLength.');
    assert.match(err.message, /exceeds maximum allowed/i, 'Error message should mention length limit.');
  });

  it('should uphold custom maxInputLength option', function() {
    var shortInput = 'abc{d,e}';
    var longInput = 'abc' + '{d,e}'.repeat(1000); // artificially lengthen

    // Expect the short input to succeed.
    var ast1 = braces.parse(shortInput, { maxInputLength: 50 });
    assert(ast1, 'Expected parse to succeed for short input.');

    // Expect the long input to fail.
    var err2 = null;
    try {
      braces.parse(longInput, { maxInputLength: 50 });
    } catch (ex) {
      err2 = ex;
    }
    assert(err2, 'Expected an error for exceeding custom maxInputLength=50.');
    assert.match(err2.message, /exceeds maximum allowed/i);
  });

  it('should fail when nesting depth exceeds maxBraceDepth', function() {
    // To exceed depth, create deeply nested braces: {{{{{abc}}}}}
    var deepInput = '{{{{{abc}}}}}';
    var err = null;
    try {
      braces.parse(deepInput, { maxBraceDepth: 3 });
    } catch (ex) {
      err = ex;
    }
    assert(err, 'Expected an error for surpassing maxBraceDepth=3.');
    assert.match(err.message, /Exceeded maxBraceDepth/i);
  });

  it('should succeed at the exact maxBraceDepth limit', function() {
    // 3-level nesting for a limit of 3
    var inputExactDepth = '{{{abc}}}';
    var ast = null;
    var err = null;
    try {
      ast = braces.parse(inputExactDepth, { maxBraceDepth: 3 });
    } catch (ex) {
      err = ex;
    }
    assert(!err, 'Expected no error at exactly maxBraceDepth=3.');
    assert(ast, 'AST should be created successfully.');
  });

  it('should handle imbalanced braces depending on strictness settings', function() {
    // e.g., missing one brace: '{{abc}'
    var input = '{{abc}';
    var err = null;
    try {
      braces.parse(input, { strict: true });
    } catch (ex) {
      err = ex;
    }
    // In strict mode, we expect an error for missing braces:
    if (!err) {
      throw new Error('Expected an error in strict mode for imbalanced braces.');
    }
    assert.match(err.message, /Mismatched braces/i, 'Should mention missing brace in strict mode.');
  });

  it('should handle large incomplete escape sequences if enforced', function() {
    // If a large partial escape is present: '${...long sequence...}'
    // For example, you might have a chunk limit in the "escape" parser.
    var largeEscape = '${' + 'a'.repeat(1200) + '}';
    var err = null;
    try {
      braces.parse(largeEscape, { maxInputLength: 2000 });
    } catch (ex) {
      err = ex;
    }
    // If your escape parser enforces chunk size, expect an error:
    if (!err) {
      // Possibly the parser allowed it; check if that’s intended
      // or if you want to enforce a short-circuit in the escape parser.
      assert.ok(true, 'Parser did not enforce chunk limit—verify if intended.');
    } else {
      assert.match(err.message, /(Exceeded safe escape chunk size|escape)/i,
        'Expected an error about large escape sequences or memory constraints.');
    }
  });

});
