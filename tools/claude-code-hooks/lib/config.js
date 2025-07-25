/**
 * Configuration management for BMAD hooks
 * Uses only Node.js built-in modules
 */

const fs = require('fs').promises;
const path = require('path');
const { homedir } = require('os');

class Config {
  constructor() {
    this.defaults = {
      enabled: true,
      hooks: {
        contextLoader: true,
        writeValidator: true,
        progressTracker: true,
        sessionSummary: true
      },
      quality: {
        strictMode: true,
        allowMocksInTests: true,
        minQualityScore: 'B'
      },
      performance: {
        cacheEnabled: true,
        cacheTTL: 300000, // 5 minutes
        maxContextLength: 2000,
        maxExecutionTime: 500
      },
      modes: {
        current: 'balanced' // strict, balanced, relaxed
      }
    };
    
    this.presets = {
      strict: {
        quality: {
          strictMode: true,
          allowMocksInTests: false,
          minQualityScore: 'A'
        }
      },
      balanced: {
        quality: {
          strictMode: true,
          allowMocksInTests: true,
          minQualityScore: 'B'
        }
      },
      relaxed: {
        quality: {
          strictMode: false,
          allowMocksInTests: true,
          minQualityScore: 'C'
        }
      }
    };
  }
  
  async load() {
    try {
      // Check for local project config
      const localConfig = await this.loadFile('.bmad-hooks.json');
      if (localConfig) return localConfig;
      
      // Check Claude Code settings
      const settingsPath = path.join(homedir(), '.claude', 'settings.json');
      const settings = await this.loadFile(settingsPath);
      
      if (settings && settings.bmad) {
        return this.mergeWithDefaults(settings.bmad);
      }
      
      return this.defaults;
    } catch (error) {
      return this.defaults;
    }
  }
  
  async loadFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }
  
  mergeWithDefaults(config) {
    // Apply preset if specified
    if (config.modes && config.modes.current && this.presets[config.modes.current]) {
      config = this.deepMerge(config, this.presets[config.modes.current]);
    }
    
    return this.deepMerge(this.defaults, config);
  }
  
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  // Runtime control commands support
  static async handleCommand(command) {
    if (command === '*hooks-disable') {
      process.env.BMAD_HOOKS_DISABLED = 'true';
      return true;
    }
    if (command === '*hooks-enable') {
      delete process.env.BMAD_HOOKS_DISABLED;
      return true;
    }
    return false;
  }
  
  static isDisabled() {
    return process.env.BMAD_HOOKS_DISABLED === 'true';
  }
}

module.exports = Config;