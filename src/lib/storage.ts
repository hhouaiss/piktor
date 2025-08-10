import { ProductConfiguration, STORAGE_KEYS, generateSlug } from "@/components/image-generator/types";

// localStorage utilities for Piktor v3 configurations

export class ConfigurationStorage {
  static save(config: ProductConfiguration): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `${STORAGE_KEYS.CONFIG_PREFIX}${config.slug}`;
      localStorage.setItem(key, JSON.stringify(config));
      
      // Update the config list
      this.updateConfigList(config);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw new Error('Failed to save configuration to localStorage');
    }
  }

  static load(slug: string): ProductConfiguration | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = `${STORAGE_KEYS.CONFIG_PREFIX}${slug}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      return JSON.parse(stored) as ProductConfiguration;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return null;
    }
  }

  static delete(slug: string): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const key = `${STORAGE_KEYS.CONFIG_PREFIX}${slug}`;
      localStorage.removeItem(key);
      
      // Update the config list
      this.removeFromConfigList(slug);
      return true;
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      return false;
    }
  }

  static list(): Array<{ slug: string; name: string; createdAt: string; updatedAt: string }> {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG_LIST);
      if (!stored) return [];
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to list configurations:', error);
      return [];
    }
  }

  static duplicate(originalSlug: string, newName: string): ProductConfiguration | null {
    const original = this.load(originalSlug);
    if (!original) return null;
    
    const newSlug = generateSlug(newName);
    const duplicated: ProductConfiguration = {
      ...original,
      id: crypto.randomUUID(),
      name: newName,
      slug: newSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.save(duplicated);
    return duplicated;
  }

  static exists(slug: string): boolean {
    if (typeof window === 'undefined') return false;
    
    const key = `${STORAGE_KEYS.CONFIG_PREFIX}${slug}`;
    return localStorage.getItem(key) !== null;
  }

  static generateUniqueSlug(baseName: string): string {
    const baseSlug = generateSlug(baseName);
    let counter = 1;
    let slug = baseSlug;
    
    while (this.exists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  private static updateConfigList(config: ProductConfiguration): void {
    try {
      const list = this.list();
      const existingIndex = list.findIndex(item => item.slug === config.slug);
      
      const configSummary = {
        slug: config.slug,
        name: config.name,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
      
      if (existingIndex >= 0) {
        list[existingIndex] = configSummary;
      } else {
        list.push(configSummary);
      }
      
      // Sort by updatedAt descending (most recent first)
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      localStorage.setItem(STORAGE_KEYS.CONFIG_LIST, JSON.stringify(list));
    } catch (error) {
      console.error('Failed to update config list:', error);
    }
  }

  private static removeFromConfigList(slug: string): void {
    try {
      const list = this.list();
      const filteredList = list.filter(item => item.slug !== slug);
      localStorage.setItem(STORAGE_KEYS.CONFIG_LIST, JSON.stringify(filteredList));
    } catch (error) {
      console.error('Failed to remove from config list:', error);
    }
  }

  // Utility to clean up old configurations (optional)
  static cleanup(maxConfigs: number = 50): number {
    if (typeof window === 'undefined') return 0;
    
    try {
      const list = this.list();
      if (list.length <= maxConfigs) return 0;
      
      // Sort by updatedAt and keep only the most recent ones
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      const toDelete = list.slice(maxConfigs);
      
      let deletedCount = 0;
      toDelete.forEach(config => {
        if (this.delete(config.slug)) {
          deletedCount++;
        }
      });
      
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old configurations:', error);
      return 0;
    }
  }

  // Export configuration as JSON
  static exportConfig(slug: string): string | null {
    const config = this.load(slug);
    if (!config) return null;
    
    return JSON.stringify(config, null, 2);
  }

  // Import configuration from JSON
  static importConfig(jsonString: string, newName?: string): ProductConfiguration | null {
    try {
      const config = JSON.parse(jsonString) as ProductConfiguration;
      
      // Generate new IDs and timestamps
      const imported: ProductConfiguration = {
        ...config,
        id: crypto.randomUUID(),
        name: newName || `${config.name} (Imported)`,
        slug: this.generateUniqueSlug(newName || config.name),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.save(imported);
      return imported;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return null;
    }
  }
}

// React hooks for using configuration storage
export function useConfigurationStorage() {
  const saveConfig = (config: ProductConfiguration) => {
    ConfigurationStorage.save(config);
  };

  const loadConfig = (slug: string) => {
    return ConfigurationStorage.load(slug);
  };

  const deleteConfig = (slug: string) => {
    return ConfigurationStorage.delete(slug);
  };

  const listConfigs = () => {
    return ConfigurationStorage.list();
  };

  const duplicateConfig = (originalSlug: string, newName: string) => {
    return ConfigurationStorage.duplicate(originalSlug, newName);
  };

  const generateUniqueSlug = (baseName: string) => {
    return ConfigurationStorage.generateUniqueSlug(baseName);
  };

  return {
    saveConfig,
    loadConfig,
    deleteConfig,
    listConfigs,
    duplicateConfig,
    generateUniqueSlug,
  };
}