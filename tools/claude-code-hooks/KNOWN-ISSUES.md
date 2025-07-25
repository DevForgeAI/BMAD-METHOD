# Known Issues

## Claude Code PreToolUse Hook Bug

**Issue**: PreToolUse hooks cannot actually block tool execution in Claude Code CLI.

**Status**: Reported to Anthropic - [GitHub Issue #4362](https://github.com/anthropics/claude-code/issues/4362)

**Description**: 
When a PreToolUse hook returns `{"approve": false}`, Claude Code ignores the rejection and proceeds with the tool operation anyway. This makes it impossible to prevent writes based on validation criteria.

**Impact**:
- Quality enforcement cannot prevent bad code from being written
- Hooks can only log/warn but not block operations
- The primary purpose of PreToolUse validation is defeated

**Debug Evidence**:
```
[DEBUG] Hook stdout: {"approve":false,"message":"BMAD Reality Guard: Detected simulation pattern..."}
[DEBUG] Successfully parsed and validated hook JSON output
[DEBUG] Parsed JSON output from hook: {}  // Should contain the rejection!
[DEBUG] Processed hook result: {}         // Empty instead of rejection
[DEBUG] Writing to temp file...           // Proceeds anyway!
```

**Workaround**: 
Currently, PreToolUse hooks serve only as logging/warning mechanisms. Full functionality awaits a fix from the Claude Code team.

## Custom Configuration Keys

**Issue**: Claude Code rejects custom keys in settings.json

**Status**: Resolved with workaround

**Description**:
Claude Code's settings validation rejects unknown keys like `bmad-hooks`, causing validation errors:
```
[DEBUG] Invalid settings in projectSettings source - key: bmad-hooks, error: [
  {
    "code": "unrecognized_keys",
    "keys": ["bmad-hooks"],
    "message": "Unrecognized key(s) in object: 'bmad-hooks'"
  }
]
```

**Solution**:
The installer now creates a separate `.claude/bmad-config.json` file for BMAD-specific configuration. This avoids validation errors while keeping hook configurations easily accessible and modifiable.

## Installation Notes

**Critical**: Hooks receive input via stdin, not environment variables. This was discovered through debugging and is now correctly implemented in all hooks.