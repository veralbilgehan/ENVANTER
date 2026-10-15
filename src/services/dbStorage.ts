import { InventoryRecord, WorkspaceSummary } from '../types';
import { SAMPLE_DATABASE_RECORDS, BIRIM_TASK_LIST, DEFAULT_RACI_TASKS } from '../data/initialData';
import { 
  db, auth, doc, getDoc, setDoc, deleteDoc, collection, query, where, 
  getDocs, serverTimestamp, handleFirestoreError, OperationType 
} from '../firebase';

const DB_KEY = 'kvkk_inventory_database_records_v1';
const ACTIVE_RECORD_ID_KEY = 'kvkk_active_record_id';

function clampStr(val: string | undefined, max: number): string {
  return (val || '').substring(0, max);
}

function sanitizeId(id: string): string {
  const cleaned = (id || '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 120);
  return cleaned || `rec_${Date.now()}`;
}

export function createNewEmptyRecord(companyName?: string, ownerUsername?: string): InventoryRecord {
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const defaultUnvan = companyName || '';
  return {
    id: `rec_${Date.now()}_${randomSuffix.toLowerCase()}`,
    title: defaultUnvan ? `${defaultUnvan} Envanteri` : 'Yeni Firma Görev & Envanter Kaydı',
    projectCode: `PRJ-${randomSuffix}`,
    companyName: defaultUnvan,
    ownerUsername: ownerUsername || '',
    ownerUid: auth.currentUser?.uid || '',
    version: 'v1.0',
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'draft',
    
    // Section 1 (1-9)
    unvan: defaultUnvan,
    adres: '',
    vergiNo: '',
    vergiDairesi: '',
    mersisNo: '',
    telefon: '',
    eposta: '',
    faaliyet: '',
    departmanlar: '',
    
    // Section 2 (10-14)
    selectedPositions: [],
    komiteBaskani: '',
    komiteUyeleri: [],
    yetkili: '',
    veriSorumlusu: defaultUnvan || '',
    irtibat: '',
    
    // Section 3 (15-19)
    birimSecilenGorevler: {
      yetkiGenelMudur: [...(BIRIM_TASK_LIST.yetkiGenelMudur || [])],
      yetkiIKMudur: [...(BIRIM_TASK_LIST.yetkiIKMudur || [])],
      yetkiTeknik: [...(BIRIM_TASK_LIST.yetkiTeknik || [])],
      yetkiFinans: [...(BIRIM_TASK_LIST.yetkiFinans || [])],
      yetkiHukuk: [...(BIRIM_TASK_LIST.yetkiHukuk || [])]
    },
    
    // Section 4 (20-24)
    donanim: '',
    yazilim: '',
    guvenlik: '',
    elektronikOlmayan: '',
    bulutSistemleri: '',
    
    // Section 5 (25-27)
    idariTedbirler: '',
    teknikTedbirler: '',
    veriGuvenligi: '',
    
    // Section 6 (28-33)
    kisiselVeriKategorileri: '',
    ozelNitelikliVeriler: '',
    veriToplamaYontemleri: '',
    saklamaAmaclari: '',
    hukukiSebepler: '',
    aliciGruplari: '',
    
    // Section 7 (34-37)
    imhaSebep: '',
    imhaYontem: '',
    saklamaSureleri: '',
    periyodikImhaSuresi: '6 Ayda Bir (Her Yıl Haziran Sonu ve Aralık Sonu İtibarıyla - Standart)',
    
    raciTasks: [...DEFAULT_RACI_TASKS],
    raciValues: {},
    infoNote: 'Rapor, veri sorumlusu kayıt sürecinde toplanan bilgiler doğrultusunda oluşturulmuştur.'
  };
}

// ---------------------------------------------------------------------------
// Cloud Firestore + Express Backend Sync Helpers
// ---------------------------------------------------------------------------
export async function syncRecordToCloudAndBackend(record: InventoryRecord): Promise<void> {
  // 1. Sync to Express Backend (/api/records)
  try {
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  } catch (err) {
    console.warn('Backend API sync skipped or offline:', err);
  }

  // 2. Sync to Cloud Firestore (/inventories/{recordId}) if Firebase user is authenticated
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.emailVerified) {
    const docId = sanitizeId(record.id);
    const docRef = doc(db, 'inventories', docId);
    const path = `inventories/${docId}`;

    const sanitizedPayload = {
      id: docId,
      ownerUid: currentUser.uid,
      ownerUsername: clampStr(record.ownerUsername || currentUser.email || 'user', 150),
      companyName: clampStr(record.companyName || record.unvan || 'Genel Şirket Alanı', 250) || 'Genel Şirket Alanı',
      title: clampStr(record.unvan || record.title || 'Envanter Kaydı', 300) || 'Envanter Kaydı',
      projectCode: clampStr(record.projectCode || 'PRJ-KVK', 60) || 'PRJ-KVK',
      version: clampStr(record.version || 'v1.0', 30) || 'v1.0',
      status: ['draft', 'review', 'finalized', 'active'].includes(record.status) ? record.status : 'draft',
      unvan: clampStr(record.unvan, 500),
      adres: clampStr(record.adres, 1000),
      vergiNo: clampStr(record.vergiNo, 100),
      vergiDairesi: clampStr(record.vergiDairesi, 200),
      mersisNo: clampStr(record.mersisNo, 100),
      telefon: clampStr(record.telefon, 200),
      eposta: clampStr(record.eposta, 300),
      faaliyet: clampStr(record.faaliyet, 2000),
      departmanlar: clampStr(record.departmanlar, 2000),
      selectedPositions: Array.isArray(record.selectedPositions) ? record.selectedPositions.slice(0, 50).map(s => String(s).substring(0, 500)) : [],
      komiteBaskani: clampStr(record.komiteBaskani, 200),
      komiteUyeleri: Array.isArray(record.komiteUyeleri) ? record.komiteUyeleri.slice(0, 50).map(s => String(s).substring(0, 500)) : [],
      yetkili: clampStr(record.yetkili, 300),
      veriSorumlusu: clampStr(record.veriSorumlusu, 500),
      irtibat: clampStr(record.irtibat, 300),
      birimSecilenGorevler: record.birimSecilenGorevler || {},
      donanim: clampStr(record.donanim, 3000),
      yazilim: clampStr(record.yazilim, 3000),
      guvenlik: clampStr(record.guvenlik, 3000),
      elektronikOlmayan: clampStr(record.elektronikOlmayan, 3000),
      bulutSistemleri: clampStr(record.bulutSistemleri, 3000),
      idariTedbirler: clampStr(record.idariTedbirler, 4000),
      teknikTedbirler: clampStr(record.teknikTedbirler, 4000),
      veriGuvenligi: clampStr(record.veriGuvenligi, 4000),
      kisiselVeriKategorileri: clampStr(record.kisiselVeriKategorileri, 3000),
      ozelNitelikliVeriler: clampStr(record.ozelNitelikliVeriler, 3000),
      veriToplamaYontemleri: clampStr(record.veriToplamaYontemleri, 3000),
      saklamaAmaclari: clampStr(record.saklamaAmaclari, 3000),
      hukukiSebepler: clampStr(record.hukukiSebepler, 3000),
      aliciGruplari: clampStr(record.aliciGruplari, 3000),
      imhaSebep: clampStr(record.imhaSebep, 3000),
      imhaYontem: clampStr(record.imhaYontem, 3000),
      saklamaSureleri: clampStr(record.saklamaSureleri, 3000),
      periyodikImhaSuresi: clampStr(record.periyodikImhaSuresi, 500),
      raciTasks: Array.isArray(record.raciTasks) ? record.raciTasks.slice(0, 100).map(s => String(s).substring(0, 500)) : [],
      raciValues: record.raciValues || {},
      infoNote: clampStr(record.infoNote, 2000),
      updatedAt: serverTimestamp()
    };

    try {
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        const existingData = existingSnap.data();
        await setDoc(docRef, {
          ...sanitizedPayload,
          createdAt: existingData.createdAt || serverTimestamp()
        });
      } else {
        await setDoc(docRef, {
          ...sanitizedPayload,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function fetchAllRecordsFromBackendAndCloud(filterCompanyName?: string): Promise<InventoryRecord[]> {
  const mergedMap = new Map<string, InventoryRecord>();

  // 1. Seed with local storage first
  const localRecords = getAllRecords();
  localRecords.forEach(r => mergedMap.set(r.id, r));

  // 2. Fetch from Express Backend API
  try {
    const resp = await fetch('/api/records');
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data.records)) {
        data.records.forEach((r: InventoryRecord) => {
          mergedMap.set(r.id, r);
        });
      }
    }
  } catch (err) {
    console.warn('Could not fetch from backend /api/records:', err);
  }

  // 3. Fetch from Cloud Firestore if authenticated
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.emailVerified) {
    const q = query(collection(db, 'inventories'), where('ownerUid', '==', currentUser.uid));
    try {
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        const d = docSnap.data();
        const rec: InventoryRecord = {
          ...(d as any),
          id: d.id || docSnap.id,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || new Date().toISOString()),
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : (d.updatedAt || new Date().toISOString())
        };
        mergedMap.set(rec.id, rec);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'inventories');
    }
  }

  const allMerged = Array.from(mergedMap.values()).sort((a, b) => {
    const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tB - tA;
  });

  // Update local cache
  localStorage.setItem(DB_KEY, JSON.stringify(allMerged));

  if (filterCompanyName && filterCompanyName.trim()) {
    const filterClean = filterCompanyName.trim().toLowerCase();
    return allMerged.filter(r => {
      const comp = (r.companyName || r.unvan || '').trim().toLowerCase();
      return comp.includes(filterClean) || filterClean.includes(comp);
    });
  }

  return allMerged;
}

export async function fetchWorkspacesSummary(): Promise<WorkspaceSummary[]> {
  try {
    const resp = await fetch('/api/workspaces');
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data.workspaces)) {
        return data.workspaces;
      }
    }
  } catch {
    // Fallback to computing from local records
  }

  const all = getAllRecords();
  const map: Record<string, WorkspaceSummary> = {};
  all.forEach(r => {
    const comp = (r.companyName || r.unvan || 'Genel Çalışma Alanı').trim();
    if (!map[comp]) {
      map[comp] = {
        companyName: comp,
        recordCount: 0,
        users: r.ownerUsername ? [r.ownerUsername] : [],
        lastUpdated: r.updatedAt || r.createdAt
      };
    }
    map[comp].recordCount += 1;
  });
  return Object.values(map);
}

export function getAllRecords(filterCompanyName?: string): InventoryRecord[] {
  try {
    const raw = localStorage.getItem(DB_KEY);
    let allRecords: InventoryRecord[] = [];
    if (!raw) {
      localStorage.setItem(DB_KEY, JSON.stringify(SAMPLE_DATABASE_RECORDS));
      allRecords = SAMPLE_DATABASE_RECORDS;
    } else {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allRecords = parsed;
      } else {
        allRecords = SAMPLE_DATABASE_RECORDS;
      }
    }

    if (filterCompanyName && filterCompanyName.trim()) {
      const filterClean = filterCompanyName.trim().toLowerCase();
      const filtered = allRecords.filter(r => {
        const comp = (r.companyName || r.unvan || '').trim().toLowerCase();
        return comp.includes(filterClean) || filterClean.includes(comp);
      });
      return filtered;
    }

    return allRecords;
  } catch (err) {
    console.error('Failed to read records from database storage:', err);
    return SAMPLE_DATABASE_RECORDS;
  }
}

export function getRecordById(id: string): InventoryRecord | null {
  const records = getAllRecords();
  return records.find(r => r.id === id) || null;
}

export function saveRecord(record: InventoryRecord, syncCloud = false): InventoryRecord {
  const records = getAllRecords();
  const existingIndex = records.findIndex(r => r.id === record.id);
  const updatedRecord: InventoryRecord = {
    ...record,
    title: record.unvan ? record.unvan : (record.title || 'İsimsiz Envanter Kaydı'),
    projectCode: record.projectCode || (record.unvan ? `PRJ-${record.unvan.substring(0, 4).toUpperCase()}` : 'PRJ-KVK'),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    records[existingIndex] = updatedRecord;
  } else {
    records.unshift(updatedRecord);
  }

  localStorage.setItem(DB_KEY, JSON.stringify(records));
  setActiveRecordId(updatedRecord.id);

  // Always sync quietly to Express backend; sync to Cloud Firestore when requested or on explicit save
  if (syncCloud) {
    syncRecordToCloudAndBackend(updatedRecord).catch(e => console.warn('Cloud sync error:', e));
  } else {
    fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRecord)
    }).catch(() => {});
  }

  return updatedRecord;
}

export function deleteRecord(id: string): boolean {
  const records = getAllRecords();
  const filtered = records.filter(r => r.id !== id);
  if (filtered.length === records.length) return false;
  
  localStorage.setItem(DB_KEY, JSON.stringify(filtered));

  // Delete from backend API
  fetch(`/api/records/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});

  // Delete from Cloud Firestore if authenticated
  if (auth.currentUser && auth.currentUser.emailVerified) {
    const docId = sanitizeId(id);
    deleteDoc(doc(db, 'inventories', docId)).catch(err => {
      console.warn('Firestore delete warning:', err);
    });
  }
  
  const currentActive = getActiveRecordId();
  if (currentActive === id) {
    if (filtered.length > 0) {
      setActiveRecordId(filtered[0].id);
    } else {
      const fresh = createNewEmptyRecord();
      saveRecord(fresh);
    }
  }
  return true;
}

export function duplicateRecord(id: string): InventoryRecord | null {
  const original = getRecordById(id);
  if (!original) return null;

  const timestamp = new Date().toISOString();
  const cloned: InventoryRecord = {
    ...JSON.parse(JSON.stringify(original)),
    id: `rec_${Date.now()}_copy`,
    title: `${original.title} (Kopya)`,
    unvan: original.unvan ? `${original.unvan} (Kopya)` : '',
    version: 'v1.0',
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'draft'
  };

  return saveRecord(cloned, true);
}

export function getActiveRecordId(): string | null {
  return localStorage.getItem(ACTIVE_RECORD_ID_KEY);
}

export function setActiveRecordId(id: string): void {
  localStorage.setItem(ACTIVE_RECORD_ID_KEY, id);
}

export function exportSingleRecordJSON(record: InventoryRecord): void {
  const safeName = (record.unvan || record.title || 'Sirket_Kaydi')
    .trim()
    .replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ_-]/g, '_')
    .substring(0, 40);
  const payload = {
    exportDate: new Date().toISOString(),
    version: record.version || '1.0',
    type: 'KVKK_SINGLE_FORM_RECORD',
    companyName: record.companyName || record.unvan,
    ownerUsername: record.ownerUsername,
    record
  };
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KVKK_Form_Kaydi_${safeName}_${record.projectCode || 'PRJ'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDatabaseJSON(recordsSubset?: InventoryRecord[]): string {
  const records = recordsSubset || getAllRecords();
  const data = {
    exportDate: new Date().toISOString(),
    version: '2.0',
    totalRecords: records.length,
    databaseName: 'KVKK Görev Tanımı ve Envanter Veritabanı',
    records
  };
  return JSON.stringify(data, null, 2);
}

export function importDatabaseJSON(jsonStr: string, assignCompanyName?: string, assignUsername?: string): { success: boolean; count: number; importedRecords?: InventoryRecord[]; error?: string } {
  try {
    const data = JSON.parse(jsonStr);
    let recordsToImport: InventoryRecord[] = [];

    if (Array.isArray(data)) {
      recordsToImport = data;
    } else if (data && Array.isArray(data.records)) {
      recordsToImport = data.records;
    } else if (data && data.record && data.record.id) {
      recordsToImport = [data.record];
    } else if (data && data.id && (data.unvan !== undefined || data.title !== undefined)) {
      recordsToImport = [data];
    } else {
      return { success: false, count: 0, error: 'Geçersiz veri tabanı veya form JSON formatı.' };
    }

    if (recordsToImport.length === 0) {
      return { success: false, count: 0, error: 'İçe aktarılacak geçerli kayıt bulunamadı.' };
    }

    const currentRecords = getAllRecords();
    const currentMap = new Map(currentRecords.map(r => [r.id, r]));

    recordsToImport.forEach(rec => {
      if (!rec.id) {
        rec.id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      }
      if (assignCompanyName && !rec.companyName) {
        rec.companyName = assignCompanyName;
      }
      if (assignUsername && !rec.ownerUsername) {
        rec.ownerUsername = assignUsername;
      }
      currentMap.set(rec.id, rec);
    });

    const merged = Array.from(currentMap.values());
    localStorage.setItem(DB_KEY, JSON.stringify(merged));
    if (recordsToImport[0]) {
      setActiveRecordId(recordsToImport[0].id);
    }

    // Sync imported records to backend and Cloud Firestore
    fetch('/api/records/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: recordsToImport })
    }).catch(() => {});

    recordsToImport.forEach(r => {
      syncRecordToCloudAndBackend(r).catch(() => {});
    });

    return { success: true, count: recordsToImport.length, importedRecords: recordsToImport };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'JSON dosyası ayrıştırılamadı.' };
  }
}
