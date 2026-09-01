import { SceneSnapshot, UploadedAsset } from '../types';

export const api = {
  async listScenes() {
    const res = await fetch('/api/scenes');
    const json = await res.json();
    return json.data;
  },

  async createScene(data?: { name?: string; environmentPreset?: string }) {
    const res = await fetch('/api/scenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    const json = await res.json();
    return json.data as SceneSnapshot;
  },

  async getScene(id: string): Promise<SceneSnapshot> {
    const res = await fetch(`/api/scenes/${id}`);
    const json = await res.json();
    return json.data as SceneSnapshot;
  },

  async saveScene(id: string, snapshot: Partial<SceneSnapshot>) {
    const res = await fetch(`/api/scenes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    const json = await res.json();
    return json.data as SceneSnapshot;
  },

  async uploadAsset(file: File): Promise<UploadedAsset> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/assets/upload', {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Upload failed');
    }
    return json.data as UploadedAsset;
  },

  async listAssets(): Promise<UploadedAsset[]> {
    const res = await fetch('/api/assets');
    const json = await res.json();
    return json.data as UploadedAsset[];
  },

  async deleteAsset(id: string) {
    const res = await fetch(`/api/assets/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};
