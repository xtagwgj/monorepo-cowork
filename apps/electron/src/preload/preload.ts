import { contextBridge, ipcRenderer } from "electron";

const api = {
  getAppInfo: async (): Promise<{ name: string; version: string; platform: string }> =>
    ipcRenderer.invoke("cowork:get-app-info"),
  pickDirectory: async (): Promise<string | null> => ipcRenderer.invoke("cowork:pick-directory"),
  openExternal: async (url: string): Promise<boolean> => ipcRenderer.invoke("cowork:open-external", url)
};

contextBridge.exposeInMainWorld("cowork", api);
