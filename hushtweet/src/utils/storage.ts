import { Plugins } from '@capacitor/core';
const { Storage } = Plugins;

export default {
  async setItem(keyName: string, keyValue: string | null | undefined) {
    await Storage.set({
      key: keyName,
      value: String(keyValue)
    });
  },
  async getItem(keyName: string): Promise<string | null> {
    return (await Storage.get({
      key: keyName
    })).value;
  },
  async removeItem(keyName: string) {
    await Storage.remove({
      key: keyName
    });
  },
  async clear() {
    await Storage.clear()
  }
}