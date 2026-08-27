import fs from 'fs';
import path from 'path';

interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

export let firebaseConfig: FirebaseConfig = {
  projectId: 'financialfree-c171e',
  appId: '1:696948243469:web:35b8aef4e4612c92002944',
  apiKey: 'AIzaSyDL-B5oHnSA3WixMdnwLgGA2_Q1wRDencQ',
  authDomain: 'financialfree-c171e.firebaseapp.com',
  storageBucket: 'financialfree-c171e.firebasestorage.app',
  messagingSenderId: '696948243469'
};

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    firebaseConfig = { ...firebaseConfig, ...JSON.parse(raw) };
  }
} catch (e) {
  // Use defaults
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return null;
}

function getBaseUrl(): string {
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents`;
}

export const firestoreRest = {
  async getCollection(collectionName: string): Promise<any[]> {
    try {
      const url = `${getBaseUrl()}/${collectionName}?key=${firebaseConfig.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      if (!json.documents || !Array.isArray(json.documents)) return [];
      return json.documents.map((doc: any) => {
        const fields: Record<string, any> = {};
        for (const [k, v] of Object.entries(doc.fields || {})) {
          fields[k] = fromFirestoreValue(v);
        }
        return fields;
      });
    } catch {
      return [];
    }
  },

  async setDoc(collectionName: string, docId: string, data: Record<string, any>): Promise<boolean> {
    try {
      const url = `${getBaseUrl()}/${collectionName}/${docId}?key=${firebaseConfig.apiKey}`;
      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) fields[k] = toFirestoreValue(v);
      }
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteDoc(collectionName: string, docId: string): Promise<boolean> {
    try {
      const url = `${getBaseUrl()}/${collectionName}/${docId}?key=${firebaseConfig.apiKey}`;
      const res = await fetch(url, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }
};
