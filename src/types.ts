export interface Position {
  unvan: string;
  seviye: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  companyName: string;
  role: 'admin' | 'officer' | 'auditor';
  password?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  loginTime: string;
}

export interface UnitDefinition {
  key: string;
  unvan: string;
  birim: string;
}

export interface RACIRow {
  id: string;
  task: string;
}

export type RACIValue = 'R' | 'A' | 'C' | 'I' | '';

export interface WorkspaceSummary {
  companyName: string;
  recordCount: number;
  users: string[];
  lastUpdated: string;
}

export interface InventoryRecord {
  id: string;
  title: string;
  projectCode: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'review' | 'finalized' | 'active';
  companyName?: string;
  ownerUsername?: string;
  ownerUid?: string;
  
  // Section 1: Firma ve Genel Bilgiler (Steps 1-9)
  unvan: string;              // 1
  adres: string;              // 2
  vergiNo: string;            // 3
  vergiDairesi: string;       // 4
  mersisNo: string;           // 5
  telefon: string;            // 6
  eposta: string;             // 7
  faaliyet: string;           // 8
  departmanlar: string;       // 9
  
  // Section 2: Organizasyon Şeması ve KVK Komitesi (Steps 10-14)
  selectedPositions: string[]; // 10
  komiteBaskani: string;      // 11 (Başkan)
  komiteUyeleri: string[];    // 11 (Üyeler)
  yetkili: string;            // 12
  veriSorumlusu: string;      // 13
  irtibat: string;            // 14
  
  // Section 3: Birim Sorumlulukları ve Görev Dağılımı (Steps 15-19)
  birimSecilenGorevler: Record<string, string[]>;
  yetkiGenelMudur?: string;   // 15
  yetkiIKMudur?: string;      // 16
  yetkiTeknik?: string;       // 17
  yetkiFinans?: string;       // 18
  yetkiHukuk?: string;        // 19
  
  // Section 4: Veri Kayıt Ortamları (Steps 20-24)
  donanim: string;            // 20
  yazilim: string;            // 21
  guvenlik: string;           // 22
  elektronikOlmayan: string;  // 23
  bulutSistemleri: string;    // 24
  
  // Section 5: Veri Güvenliği ve Alınan Tedbirler (Steps 25-27)
  idariTedbirler: string;     // 25
  teknikTedbirler: string;    // 26
  veriGuvenligi: string;      // 27
  
  // Section 6: Kişisel Veri Kategorileri ve İşleme Amaçları (Steps 28-33)
  kisiselVeriKategorileri: string; // 28
  ozelNitelikliVeriler: string;    // 29
  veriToplamaYontemleri: string;   // 30
  saklamaAmaclari: string;         // 31
  hukukiSebepler: string;          // 32
  aliciGruplari: string;           // 33
  
  // Section 7: İmha, Süreler ve Periyodik Denetim (Steps 34-37)
  imhaSebep: string;              // 34
  imhaYontem: string;             // 35
  saklamaSureleri: string;         // 36
  periyodikImhaSuresi: string;    // 37
  
  // RACI Matrix
  raciTasks: string[];
  raciValues: Record<string, RACIValue>;
  
  // Notes
  infoNote?: string;
  customNotes?: string;
}

export interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  stepLabel?: string;
  stepId?: number;
  timestamp: string;
  interactiveType?: 'orgSelection' | 'committeeSelection' | 'taskSelection' | 'multiSelect' | 'completed';
  interactiveData?: any;
  categoryHeader?: string;
}

export interface StepConfig {
  id: number;
  label: string;
  key: keyof InventoryRecord | string;
  customType?: 'orgSelection' | 'committeeSelection' | 'taskSelection' | 'multiSelect';
  list?: string[];
  category: string;
  categorySectionNumber: number;
  description?: string;
}
