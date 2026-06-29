import { APP_SETTINGS_STORE_KEY, useStorage } from "../context/StorageContext";
import { AppSettings, DEFAULT_APP_SETTINGS } from "../models/AppSettings";

export const useAppSettings = () => {
  const { storage } = useStorage();

  const getSettings = async (): Promise<AppSettings> => {
    const settings = (await storage.get(APP_SETTINGS_STORE_KEY)) as
      | Partial<AppSettings>
      | undefined;

    return {
      ...DEFAULT_APP_SETTINGS,
      ...(settings ?? {}),
    };
  };

  const updateSettings = async (
    nextSettings: Partial<AppSettings>,
  ): Promise<AppSettings> => {
    const current = await getSettings();
    const updated = {
      ...current,
      ...nextSettings,
    };

    await storage.set(APP_SETTINGS_STORE_KEY, updated);
    return updated;
  };

  return {
    getSettings,
    updateSettings,
  };
};
