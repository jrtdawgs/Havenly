import { BudgetState } from '@/types/budget';

const STORAGE_KEY = 'budget-master-state';

// Check if running in Tauri
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Save data - uses Tauri file storage if available, otherwise localStorage
export const saveData = async (state: BudgetState): Promise<void> => {
  const data = JSON.stringify(state);

  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_budget_data', { data });
    } catch (error) {
      console.error('Tauri save failed, falling back to localStorage:', error);
      localStorage.setItem(STORAGE_KEY, data);
    }
  } else {
    localStorage.setItem(STORAGE_KEY, data);
  }
};

// Load data - uses Tauri file storage if available, otherwise localStorage
export const loadData = async (): Promise<BudgetState | null> => {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const data = await invoke<string>('load_budget_data');
      if (data && data !== 'null') {
        return JSON.parse(data);
      }
      // Check if there's data in localStorage to migrate
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        // Migrate to Tauri storage
        await invoke('save_budget_data', { data: localData });
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Tauri load failed, falling back to localStorage:', error);
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    }
  } else {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }
};

// Get the data file path (Tauri only)
export const getDataFilePath = async (): Promise<string | null> => {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('get_data_file_path');
    } catch {
      return null;
    }
  }
  return null;
};

// Clear all data
export const clearData = async (): Promise<void> => {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_budget_data', { data: 'null' });
    } catch (error) {
      console.error('Tauri clear failed:', error);
    }
  }
  localStorage.removeItem(STORAGE_KEY);
};
