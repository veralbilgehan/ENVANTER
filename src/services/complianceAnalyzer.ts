import { InventoryRecord } from '../types';
import {
  SAKLAMA_SURELERI,
  IMHA_SEBEPLER,
  IMHA_YONTEMLER,
  HUKUKI_SEBEPLER,
  SAKLAMA_AMACLARI,
  IDARI_TEDBIRLER_LISTESI,
  TEKNIK_TEDBIRLER_LISTESI
} from '../data/initialData';

export type AuditSeverity = 'critical' | 'warning' | 'info' | 'compliant';

export interface StatutoryRetentionRule {
  id: string;
  categoryName: string;
  shortLabel: string;
  isSpecialCategory: boolean;
  categoryKeywords: string[];
  retentionKeywords: string[];
  statutoryPeriodText: string;
  minMonths: number;
  maxMonths: number;
  recommendedEntry: string;
  legalBasis: string;
  legislationArticles: string[];
  destructionPolicyNote: string;
}

export interface RetentionAuditItem {
  rule: StatutoryRetentionRule;
  isProcessedInInventory: boolean;
  isDeclaredInRetention: boolean;
  matchedRetentionLine: string | null;
  detectedDurationMonths: number | null;
  status: 'compliant' | 'missing_period' | 'duration_mismatch' | 'unprocessed_declared' | 'not_applicable';
  severity: AuditSeverity;
  findingMessage: string;
  recommendationMessage: string;
}

export interface ComplianceFinding {
  id: string;
  category: 'saklama_suresi' | 'periyodik_imha' | 'ozel_nitelikli' | 'hukuki_sebep' | 'veri_guvenligi' | 'organizasyon';
  title: string;
  severity: AuditSeverity;
  stepNumbers: number[];
  legalReference: string;
  currentValueSummary: string;
  description: string;
  recommendation: string;
  autoFixAvailable: boolean;
  autoFixLabel?: string;
  autoFixPatch?: Partial<InventoryRecord>;
}

export interface ComplianceReportResult {
  overallScore: number; // 0 - 100
  retentionScore: number; // 0 - 100
  legislationScore: number; // 0 - 100
  riskLevel: 'Düşük Risk (Uyumlu)' | 'Orta Risk (Kısmi Eksiklik)' | 'Yüksek Risk (Mevzuat Uyumsuzluğu)';
  totalProcessedCategories: number;
  compliantRetentionCount: number;
  missingRetentionCount: number;
  mismatchRetentionCount: number;
  criticalCount: number;
  warningCount: number;
  compliantFindingCount: number;
  retentionAudits: RetentionAuditItem[];
  findings: ComplianceFinding[];
  analyzedAt: string;
}

export const STATUTORY_RETENTION_RULES: StatutoryRetentionRule[] = [
  {
    id: 'kimlik',
    categoryName: 'Kimlik Verileri (Ad-Soyad, TCKN, Doğum Tarihi, İmza)',
    shortLabel: 'Kimlik Verisi',
    isSpecialCategory: false,
    categoryKeywords: ['kimlik', 'tc kimlik', 'ad soyad'],
    retentionKeywords: ['kimlik'],
    statutoryPeriodText: '10 - 15 Yıl (Hukuki İlişkinin Sona Ermesinden İtibaren)',
    minMonths: 120,
    maxMonths: 180,
    recommendedEntry: SAKLAMA_SURELERI[0],
    legalBasis: '6102 Sayılı TTK Md. 82 (10 Yıl), 6098 Sayılı TBK Md. 146 (10 Yıl Genel Zamanaşımı), 4857 Sayılı İş Kanunu',
    legislationArticles: ['KVKK Md. 4/2-ç', '6102 s. TTK Md. 82', '6098 s. TBK Md. 146'],
    destructionPolicyNote: 'Sözleşme ve zamanaşımı süresi dolduktan sonraki ilk periyodik imha döneminde imha edilir.'
  },
  {
    id: 'iletisim',
    categoryName: 'İletişim Verileri (Telefon, E-Posta, Adres, KEP)',
    shortLabel: 'İletişim Verisi',
    isSpecialCategory: false,
    categoryKeywords: ['iletişim', 'iletisim', 'telefon', 'e-posta', 'tebligat'],
    retentionKeywords: ['iletişim', 'iletisim'],
    statutoryPeriodText: '10 - 15 Yıl (Hukuki İlişkinin Sona Ermesinden İtibaren)',
    minMonths: 120,
    maxMonths: 180,
    recommendedEntry: SAKLAMA_SURELERI[1],
    legalBasis: '6098 Sayılı TBK Md. 146, 6102 Sayılı TTK Md. 82, 7201 Sayılı Tebligat Kanunu',
    legislationArticles: ['KVKK Md. 4/2-ç', '6098 s. TBK Md. 146'],
    destructionPolicyNote: 'İspat ve tebligat zamanaşımı süresi sonunda periyodik imha ile silinir.'
  },
  {
    id: 'lokasyon',
    categoryName: 'Lokasyon Verileri (GPS, Taşıt Takip, Konum Bilgisi)',
    shortLabel: 'Lokasyon Verisi',
    isSpecialCategory: false,
    categoryKeywords: ['lokasyon', 'gps', 'konum', 'taşıt takip'],
    retentionKeywords: ['lokasyon', 'konum', 'gps'],
    statutoryPeriodText: '1 - 10 Yıl (İş ve Operasyon İlişkisinin Sona Ermesinden İtibaren)',
    minMonths: 12,
    maxMonths: 120,
    recommendedEntry: SAKLAMA_SURELERI[2],
    legalBasis: '6098 Sayılı TBK Md. 146, 4857 Sayılı İş Kanunu (İş Güvenliği ve Saha Denetimi Meşru Menfaati)',
    legislationArticles: ['KVKK Md. 5/2-f', '6098 s. TBK Md. 146'],
    destructionPolicyNote: 'Operasyonel denetim ve zamanaşımı süresi sonunda anonim hale getirilir veya silinir.'
  },
  {
    id: 'ozluk',
    categoryName: 'Özlük Verileri (Bordro, İş Sözleşmesi, İzin, Performans)',
    shortLabel: 'Özlük Verisi',
    isSpecialCategory: false,
    categoryKeywords: ['özlük', 'ozluk', 'bordro', 'işe giriş', 'disiplin'],
    retentionKeywords: ['özlük', 'ozluk', 'iş sözleşmesi'],
    statutoryPeriodText: '10 - 15 Yıl (İş Akdinin Sona Ermesinden İtibaren)',
    minMonths: 120,
    maxMonths: 180,
    recommendedEntry: SAKLAMA_SURELERI[3],
    legalBasis: '4857 Sayılı İş Kanunu Md. 75, 5510 Sayılı SSGSS Kanunu Md. 86 (10 Yıl), 6098 Sayılı TBK',
    legislationArticles: ['4857 s. İşK Md. 75', '5510 s. SSGSSK Md. 86', 'KVKK Md. 5/2-ç'],
    destructionPolicyNote: 'İşten ayrılış tarihinden itibaren 10-15 yıllık yasal zamanaşımı sonunda imha edilir.'
  },
  {
    id: 'hukuki_islem',
    categoryName: 'Hukuki İşlem Verileri (Dava, İcra Dosyası, Noter İhtarnameleri)',
    shortLabel: 'Hukuki İşlem',
    isSpecialCategory: false,
    categoryKeywords: ['hukuki işlem', 'dava dosyası', 'icra takip', 'adli yazışma'],
    retentionKeywords: ['hukuki işlem', 'dava ve icra'],
    statutoryPeriodText: '10 - 15 Yıl (Dava/İcra Kesinleşmesinden İtibaren)',
    minMonths: 120,
    maxMonths: 240,
    recommendedEntry: SAKLAMA_SURELERI[4],
    legalBasis: '6098 Sayılı TBK Md. 146, 2004 Sayılı İcra ve İflas Kanunu, 1136 Sayılı Avukatlık Kanunu Md. 39',
    legislationArticles: ['KVKK Md. 5/2-e', '6098 s. TBK Md. 146', '2004 s. İİK'],
    destructionPolicyNote: 'Yargı kararının kesinleşmesi ve zamanaşımı dolması akabinde imha edilir.'
  },
  {
    id: 'musteri_islem',
    categoryName: 'Müşteri İşlem Verileri (Sipariş, Fatura, Talep/Şikayet, Çağrı)',
    shortLabel: 'Müşteri İşlem',
    isSpecialCategory: false,
    categoryKeywords: ['müşteri işlem', 'musteri islem', 'sipariş', 'fatura', 'çağrı merkezi'],
    retentionKeywords: ['müşteri işlem', 'musteri islem', 'ticari ilişkinin'],
    statutoryPeriodText: '10 Yıl (6102 s. TTK Md. 82 & 213 s. VUK Md. 253)',
    minMonths: 60,
    maxMonths: 180,
    recommendedEntry: SAKLAMA_SURELERI[5],
    legalBasis: '6102 Sayılı TTK Md. 82 (10 Yıl), 213 Sayılı Vergi Usul Kanunu Md. 253 (5 Yıl), 6502 Sayılı TKHK',
    legislationArticles: ['6102 s. TTK Md. 82', '213 s. VUK Md. 253', '6502 s. TKHK'],
    destructionPolicyNote: 'Ticari defter ve fatura saklama süresi olan 10 yıl sonunda imha edilir.'
  },
  {
    id: 'fiziksel_mekan',
    categoryName: 'Fiziksel Mekan Güvenliği (CCTV Kamera & Ziyaretçi Kayıtları)',
    shortLabel: 'Fiziksel Mekan (Kamera)',
    isSpecialCategory: false,
    categoryKeywords: ['fiziksel mekan', 'kamera kayıt', 'ziyaretçi', 'cctv'],
    retentionKeywords: ['fiziksel mekan', 'kamera kayıt', '30 gün', 'ziyaretçi'],
    statutoryPeriodText: '30 Gün ile 3 Ay (Azami 2 Yıl - Veri Minimizasyonu İlkesi)',
    minMonths: 1,
    maxMonths: 24,
    recommendedEntry: SAKLAMA_SURELERI[6],
    legalBasis: '6698 Sayılı KVKK Md. 4/2-ç (İşlendikleri Amaçla Bağlantılı, Sınırlı ve Ölçülü Olma), KVK Kurulu İlke Kararları',
    legislationArticles: ['KVKK Md. 4/2-ç', 'KVKK Md. 5/2-f'],
    destructionPolicyNote: 'Kamera kayıtları üzerine yazma (FIFO) yöntemiyle 30-90 gün içinde otomatik yok edilir.'
  },
  {
    id: 'islem_guvenligi',
    categoryName: 'İşlem Güvenliği (IP, Log Kayıtları, Trafik Bilgisi, Parola/Erişim)',
    shortLabel: 'İşlem Güvenliği (5651 Log)',
    isSpecialCategory: false,
    categoryKeywords: ['işlem güvenliği', 'islem guvenligi', 'ip adresi', 'log kayıt', 'mac adresi'],
    retentionKeywords: ['işlem güvenliği', '5651', 'log / trafik', 'log kayıt'],
    statutoryPeriodText: '2 Yıl (5651 Sayılı Kanun Zorunlu Saklama Süresi)',
    minMonths: 24,
    maxMonths: 60,
    recommendedEntry: SAKLAMA_SURELERI[7],
    legalBasis: '5651 Sayılı İnternet Ortamında Yapılan Yayınların Düzenlenmesi Kanunu Md. 5 & Yönetmelik',
    legislationArticles: ['5651 s. Kanun Md. 5', 'KVKK Md. 5/2-a', 'KVKK Md. 12'],
    destructionPolicyNote: 'Zaman damgalı (Time-Stamp) log kayıtları 2 yıl sonunda kriptografik olarak silinir.'
  },
  {
    id: 'finans',
    categoryName: 'Finans ve Muhasebe Verileri (IBAN, Bilanço, Vergi Levhası, Ödeme)',
    shortLabel: 'Finans & Muhasebe',
    isSpecialCategory: false,
    categoryKeywords: ['finans', 'bilanço', 'iban', 'banka hesap', 'vergi levhası'],
    retentionKeywords: ['finans', 'muhasebe', 'ttk / vuk'],
    statutoryPeriodText: '10 - 15 Yıl (İlgili Takvim Yılını Takip Eden Süre)',
    minMonths: 120,
    maxMonths: 180,
    recommendedEntry: SAKLAMA_SURELERI[8],
    legalBasis: '6102 Sayılı Türk Ticaret Kanunu Md. 82 (10 Yıl), 213 Sayılı VUK Md. 253 (5 Yıl)',
    legislationArticles: ['6102 s. TTK Md. 82', '213 s. VUK Md. 253'],
    destructionPolicyNote: 'Yasal vergi ve ticaret zamanaşımı süresi sonunda hem fiziki hem dijital ortamdan imha edilir.'
  },
  {
    id: 'mesleki_deneyim',
    categoryName: 'Mesleki Deneyim & CV Verileri (Diploma, Sertifika, Özgeçmiş)',
    shortLabel: 'Mesleki Deneyim & CV',
    isSpecialCategory: false,
    categoryKeywords: ['mesleki deneyim', 'diploma', 'sertifika', 'referans', 'cv'],
    retentionKeywords: ['mesleki deneyim', 'cv verileri', 'çalışan adayı'],
    statutoryPeriodText: 'Personel: 10-15 Yıl / Çalışan Adayı CV: En Fazla 2 Yıl',
    minMonths: 6,
    maxMonths: 180,
    recommendedEntry: SAKLAMA_SURELERI[9],
    legalBasis: '4857 Sayılı İş Kanunu, 6098 Sayılı TBK ve KVK Kurulu Çalışan Adayı CV Saklama Kararları',
    legislationArticles: ['KVKK Md. 4/2-ç', '4857 s. İşK'],
    destructionPolicyNote: 'İşe kabul edilmeyen aday CV’leri en geç 2 yıl içinde, personel belgeleri ayrılıştan 15 yıl sonra imha edilir.'
  },
  {
    id: 'pazarlama',
    categoryName: 'Pazarlama & Çerez (Cookie) Verileri (Kampanya, Alışveriş Geçmişi)',
    shortLabel: 'Pazarlama & Çerez',
    isSpecialCategory: false,
    categoryKeywords: ['pazarlama', 'çerez', 'cookie', 'kampanya onay', 'alışveriş geçmişi'],
    retentionKeywords: ['pazarlama', 'çerez', 'cookie', 'onay geri alınana'],
    statutoryPeriodText: 'En Fazla 2 Yıl veya Açık Rıza / İYS Onayı Geri Alınana Kadar',
    minMonths: 1,
    maxMonths: 36,
    recommendedEntry: SAKLAMA_SURELERI[10],
    legalBasis: '6563 Sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun, Ticari İletişim Yönetmeliği (İYS), KVKK Md. 5/1',
    legislationArticles: ['6563 s. ETK', 'KVKK Md. 5/1 (Açık Rıza)', 'KVKK Çerez Rehberi'],
    destructionPolicyNote: 'Açık rıza geri alındığında derhal veya onay tarihinden itibaren 2 yıl sonunda imha edilir.'
  },
  {
    id: 'gorsel_isitsel',
    categoryName: 'Görsel ve İşitsel Kayıtlar (Fotoğraf, Ses Kaydı, Video)',
    shortLabel: 'Görsel & İşitsel Kayıt',
    isSpecialCategory: false,
    categoryKeywords: ['görsel ve işitsel', 'gorsel ve isitsel', 'fotoğraf', 'ses kaydı', 'video kamera'],
    retentionKeywords: ['görsel ve işitsel', 'gorsel ve isitsel'],
    statutoryPeriodText: '3 Yıl - 10 Yıl (Çağrı Merkezi 3 Yıl / Hukuki İlişki 10 Yıl)',
    minMonths: 1,
    maxMonths: 120,
    recommendedEntry: SAKLAMA_SURELERI[11],
    legalBasis: '6502 Sayılı TKHK (Çağrı Kayıtları 3 Yıl), 6098 Sayılı TBK Md. 146 (10 Yıl)',
    legislationArticles: ['6502 s. TKHK', '6098 s. TBK Md. 146'],
    destructionPolicyNote: 'İspat yükümlülüğü süresi dolduğunda dijital ses ve görüntü dosyaları kalıcı olarak silinir.'
  },
  {
    id: 'saglik_verisi',
    categoryName: 'Sağlık Bilgileri (Özel Nitelikli - İşe Giriş Muayene, Rapor, Kan Grubu)',
    shortLabel: 'Sağlık Verisi (Özel Nitelikli)',
    isSpecialCategory: true,
    categoryKeywords: ['sağlık bilgileri', 'saglik bilgileri', 'sağlık raporu', 'kan grubu', 'engellilik'],
    retentionKeywords: ['sağlık bilgileri', 'saglik bilgileri', 'isg kanunu', 'işyeri hekimliği'],
    statutoryPeriodText: '15 Yıl (6331 Sayılı İSG Kanunu Gereği İşten Ayrılıştan İtibaren)',
    minMonths: 120,
    maxMonths: 240,
    recommendedEntry: SAKLAMA_SURELERI[12],
    legalBasis: '6331 Sayılı İş Sağlığı ve Güvenliği Kanunu Md. 15, İşyeri Hekimi ve Diğer Sağlık Personelinin Görevleri Yönetmeliği (15 Yıl)',
    legislationArticles: ['KVKK Md. 6/3', '6331 s. İSGK Md. 15', 'Kurul 2018/10 Kararı'],
    destructionPolicyNote: 'İşyeri hekimi nezdinde kilitli/şifreli saklanır; işten ayrılıştan 15 yıl sonra imha edilir.'
  },
  {
    id: 'biyometrik_veri',
    categoryName: 'Biyometrik Veri (Özel Nitelikli - Parmak İzi, Yüz Tanıma, Retina)',
    shortLabel: 'Biyometrik Veri (Özel Nitelikli)',
    isSpecialCategory: true,
    categoryKeywords: ['biyometrik', 'parmak izi', 'yüz tanıma', 'pdks'],
    retentionKeywords: ['biyometrik'],
    statutoryPeriodText: 'İş Akdinin Sonlanmasıyla Derhal veya İlk Periyodik İmha Döneminde',
    minMonths: 0,
    maxMonths: 6,
    recommendedEntry: SAKLAMA_SURELERI[13],
    legalBasis: '6698 Sayılı KVKK Md. 6, Md. 4/2-ç (Ölçülülük İlkesi) ve KVK Kurulunun Biyometrik Veri İlke Kararları',
    legislationArticles: ['KVKK Md. 6', 'KVKK Md. 4/2-ç (Ölçülülük)'],
    destructionPolicyNote: 'İlgili kişinin iş akdi bittiği veya açık rızasını geri aldığı anda derhal kriptografik olarak silinir.'
  },
  {
    id: 'ceza_mahkumiyeti',
    categoryName: 'Ceza Mahkûmiyeti ve Güvenlik Tedbirleri (Özel Nitelikli - Adli Sicil)',
    shortLabel: 'Adli Sicil (Özel Nitelikli)',
    isSpecialCategory: true,
    categoryKeywords: ['ceza mahkûmiyeti', 'ceza mahkumiyeti', 'adli sicil'],
    retentionKeywords: ['ceza mahkûmiyeti', 'adli sicil', 'özlük kişisel veri'],
    statutoryPeriodText: 'İş İlişkisi Süresince / Özlük Dosyası Saklama Süresi (10-15 Yıl)',
    minMonths: 12,
    maxMonths: 180,
    recommendedEntry: SAKLAMA_SURELERI[3],
    legalBasis: '6698 Sayılı KVKK Md. 6/3, 4857 Sayılı İş Kanunu Md. 75, 5352 Sayılı Adli Sicil Kanunu',
    legislationArticles: ['KVKK Md. 6/3', '4857 s. İşK Md. 75'],
    destructionPolicyNote: 'Özlük dosyası saklama süresi sonunda DIN 66399 standardında kırpılarak/silinerek imha edilir.'
  },
  {
    id: 'sendika_uyeligi',
    categoryName: 'Sendika Üyeliği Bilgisi (Özel Nitelikli - Sendika Aidat Kesintisi)',
    shortLabel: 'Sendika Üyeliği (Özel Nitelikli)',
    isSpecialCategory: true,
    categoryKeywords: ['sendika üyeliği', 'sendika uyeligi', 'sendika aidat'],
    retentionKeywords: ['sendika', 'özlük kişisel veri'],
    statutoryPeriodText: '10 - 15 Yıl (İş Sözleşmesinin Sona Ermesinden İtibaren)',
    minMonths: 120,
    maxMonths: 180,
    recommendedEntry: SAKLAMA_SURELERI[3],
    legalBasis: '6356 Sayılı Sendikalar ve Toplu İş Sözleşmesi Kanunu, 4857 Sayılı İş Kanunu, KVKK Md. 6/3',
    legislationArticles: ['6356 s. STİSK', 'KVKK Md. 6/3'],
    destructionPolicyNote: 'Sendikal aidat ve bordro zamanaşımı süresi sonunda periyodik imha döneminde imha edilir.'
  }
];

/**
 * Helper to parse duration in months from a Turkish retention text line
 */
export function parseDurationMonthsFromText(line: string): number | null {
  const lower = line.toLowerCase();

  if (lower.includes('derhal') || lower.includes('ilk periyodik imha')) {
    return 3; // 0-6 months immediate/first periodic cycle
  }
  if (lower.includes('süresiz')) {
    return 840; // 70 years
  }

  // Match "X yıl"
  const yearMatch = lower.match(/(\d+)\s*yıl/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10) * 12;
  }

  // Match "X ay"
  const monthMatch = lower.match(/(\d+)\s*ay/);
  if (monthMatch) {
    return parseInt(monthMatch[1], 10);
  }

  // Match "X gün"
  const dayMatch = lower.match(/(\d+)\s*gün/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    return Math.max(1, Math.round(days / 30));
  }

  return null;
}

/**
 * Run comprehensive KVKK Compliance & Retention Period Analysis on an InventoryRecord
 */
export function analyzeKVKKCompliance(record: InventoryRecord): ComplianceReportResult {
  const generalCategoriesText = (record.kisiselVeriKategorileri || '').toLowerCase();
  const specialCategoriesText = (record.ozelNitelikliVeriler || '').toLowerCase();
  const collectionMethodsText = (record.veriToplamaYontemleri || '').toLowerCase();
  const retentionText = record.saklamaSureleri || '';
  const retentionLines = retentionText
    .split(/[,;\n]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const retentionAudits: RetentionAuditItem[] = [];
  const findings: ComplianceFinding[] = [];

  let totalProcessedCategories = 0;
  let compliantRetentionCount = 0;
  let missingRetentionCount = 0;
  let mismatchRetentionCount = 0;

  // 1. Audit each Statutory Retention Rule against the Inventory Record
  for (const rule of STATUTORY_RETENTION_RULES) {
    const isProcessedInInventory = rule.categoryKeywords.some(
      kw =>
        generalCategoriesText.includes(kw) ||
        specialCategoriesText.includes(kw) ||
        (rule.id === 'fiziksel_mekan' && collectionMethodsText.includes('kamera'))
    );

    const matchedLine =
      retentionLines.find(line =>
        rule.retentionKeywords.some(rkw => line.toLowerCase().includes(rkw))
      ) ||
      (rule.retentionKeywords.some(rkw => retentionText.toLowerCase().includes(rkw))
        ? retentionText
        : null);

    const isDeclaredInRetention = Boolean(matchedLine);
    const detectedMonths = matchedLine ? parseDurationMonthsFromText(matchedLine) : null;

    if (isProcessedInInventory) {
      totalProcessedCategories++;

      if (!isDeclaredInRetention) {
        missingRetentionCount++;
        retentionAudits.push({
          rule,
          isProcessedInInventory: true,
          isDeclaredInRetention: false,
          matchedRetentionLine: null,
          detectedDurationMonths: null,
          status: 'missing_period',
          severity: 'critical',
          findingMessage: `"${rule.shortLabel}" envanterde işleniyor olarak seçilmiş (Madde 28/29), ancak Madde 36'da yasal saklama süresi tanımlanmamış!`,
          recommendationMessage: `${rule.legalBasis} uyarınca "${rule.recommendedEntry}" ibaresi saklama sürelerine eklenmelidir.`
        });
      } else if (
        detectedMonths !== null &&
        (detectedMonths < rule.minMonths || detectedMonths > rule.maxMonths)
      ) {
        mismatchRetentionCount++;
        const isTooShort = detectedMonths < rule.minMonths;
        retentionAudits.push({
          rule,
          isProcessedInInventory: true,
          isDeclaredInRetention: true,
          matchedRetentionLine: matchedLine,
          detectedDurationMonths: detectedMonths,
          status: 'duration_mismatch',
          severity: 'warning',
          findingMessage: isTooShort
            ? `"${rule.shortLabel}" için belirtilen süre (${Math.round(detectedMonths / 12) || detectedMonths + ' Ay'}), yasal asgari saklama süresinin (${rule.statutoryPeriodText}) altındadır.`
            : `"${rule.shortLabel}" için belirtilen süre, KVKK Md. 4/2-ç "Amaçla Bağlantılı, Sınırlı ve Ölçülü Olma (Veri Minimizasyonu)" ilkesindeki azami süreyi (${rule.statutoryPeriodText}) aşmaktadır.`,
          recommendationMessage: `Mevzuata uyum için süreyi "${rule.recommendedEntry}" olarak güncelleyin.`
        });
      } else {
        compliantRetentionCount++;
        retentionAudits.push({
          rule,
          isProcessedInInventory: true,
          isDeclaredInRetention: true,
          matchedRetentionLine: matchedLine,
          detectedDurationMonths: detectedMonths,
          status: 'compliant',
          severity: 'compliant',
          findingMessage: `"${rule.shortLabel}" saklama periyodu ${rule.legalBasis} hükümlerine tam uyumludur.`,
          recommendationMessage: rule.destructionPolicyNote
        });
      }
    } else if (isDeclaredInRetention) {
      retentionAudits.push({
        rule,
        isProcessedInInventory: false,
        isDeclaredInRetention: true,
        matchedRetentionLine: matchedLine,
        detectedDurationMonths: detectedMonths,
        status: 'unprocessed_declared',
        severity: 'info',
        findingMessage: `"${rule.shortLabel}" için saklama süresi tanımlanmış ancak Madde 28/29'da işlenen veri kategorileri arasında işaretlenmemiş.`,
        recommendationMessage: `Bu veri kategorisi fiilen işleniyorsa Madde 28/29'a ekleyin; işlenmiyorsa envanter sadeleştirmesi yapabilirsiniz.`
      });
    } else {
      retentionAudits.push({
        rule,
        isProcessedInInventory: false,
        isDeclaredInRetention: false,
        matchedRetentionLine: null,
        detectedDurationMonths: null,
        status: 'not_applicable',
        severity: 'info',
        findingMessage: 'Envanter kapsamında bu veri kategorisi işlenmemektedir.',
        recommendationMessage: 'İşlenmeye başlanması halinde yasal saklama süresi tanımlanmalıdır.'
      });
    }
  }

  // Generate Aggregated Retention Findings for Missing Categories
  const missingAuditItems = retentionAudits.filter(a => a.status === 'missing_period');
  if (missingAuditItems.length > 0) {
    const existingEntries = (record.saklamaSureleri || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const mergedEntries = Array.from(
      new Set([...existingEntries, ...missingAuditItems.map(m => m.rule.recommendedEntry)])
    );

    findings.push({
      id: 'missing_retention_periods',
      category: 'saklama_suresi',
      title: `${missingAuditItems.length} Veri Kategorisi İçin Yasal Saklama Süresi Eksik`,
      severity: 'critical',
      stepNumbers: [28, 29, 36],
      legalReference: '6698 s. KVKK Md. 4/2-ç & Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Yönetmeliği Md. 5, 7',
      currentValueSummary: `İşlenen ${totalProcessedCategories} kategoriden ${missingAuditItems.length} tanesinin saklama süresi tanımlanmamış (${missingAuditItems.map(i => i.rule.shortLabel).join(', ')}).`,
      description:
        'Kişisel Veri İşleme Envanterinde (Madde 28 ve 29) işlendiği beyan edilen her bir kişisel veri kategorisi için ilgili mevzuatta öngörülen veya işlendikleri amaç için gerekli olan azami saklama süresinin (Madde 36) belirlenmesi VERBİS ve Yönetmelik gereği zorunludur.',
      recommendation: `Eksik olan (${missingAuditItems.map(i => i.rule.shortLabel).join(', ')}) kategorilerine ait TTK, TBK, İş Kanunu, İSG ve 5651 sayılı Kanun saklama sürelerini envantere ekleyin.`,
      autoFixAvailable: true,
      autoFixLabel: 'Eksik Saklama Sürelerini Mevzuata Göre Ekle',
      autoFixPatch: {
        saklamaSureleri: mergedEntries.join(', ')
      }
    });
  } else if (totalProcessedCategories > 0 && mismatchRetentionCount === 0) {
    findings.push({
      id: 'all_retention_periods_compliant',
      category: 'saklama_suresi',
      title: 'Tüm Veri Kategorilerinin Yasal Saklama Süreleri Mevzuata Uyumlu',
      severity: 'compliant',
      stepNumbers: [28, 29, 36],
      legalReference: '6698 s. KVKK Md. 4/2-ç, TTK Md. 82, TBK Md. 146, 5651 s. Kanun',
      currentValueSummary: `İşlenen ${totalProcessedCategories} veri kategorisinin tamamı için yasal saklama periyodu tanımlanmış.`,
      description:
        'Envanterde yer alan tüm genel ve özel nitelikli kişisel veri kategorileri için ilgili kanunlarda öngörülen saklama süreleri eksiksiz eşleştirilmiştir.',
      recommendation: 'Yıllık envanter revizyonlarında mevzuat değişikliklerini takip etmeye devam edin.',
      autoFixAvailable: false
    });
  }

  // Generate Findings for Mismatched Durations
  const mismatchItems = retentionAudits.filter(a => a.status === 'duration_mismatch');
  if (mismatchItems.length > 0) {
    const existingEntries = (record.saklamaSureleri || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const correctedEntries = Array.from(
      new Set([...existingEntries, ...mismatchItems.map(m => m.rule.recommendedEntry)])
    );

    findings.push({
      id: 'mismatch_retention_periods',
      category: 'saklama_suresi',
      title: `${mismatchItems.length} Veri Kategorisinde Yasal Süre Uyumsuzluğu Tespit Edildi`,
      severity: 'warning',
      stepNumbers: [36],
      legalReference: '6698 s. KVKK Md. 4/2-ç (Sınırlı ve Ölçülü Olma İlkesi) & İlgili Özel Kanunlar',
      currentValueSummary: mismatchItems.map(m => `${m.rule.shortLabel}: "${m.matchedRetentionLine}"`).join(' | '),
      description:
        mismatchItems.map(m => m.findingMessage).join(' '),
      recommendation:
        'Yasal asgari sürenin altındaki veya ölçülülük ilkesini aşan saklama sürelerini standart mevzuat periyotlarıyla güncelleyin.',
      autoFixAvailable: true,
      autoFixLabel: 'Süreleri Yasal Standartlara Güncelle',
      autoFixPatch: {
        saklamaSureleri: correctedEntries.join(', ')
      }
    });
  }

  // 2. Audit Periodic Destruction Period (Periyodik İmha Süresi - Yönetmelik Md. 11)
  const periodicText = (record.periyodikImhaSuresi || '').trim();
  const periodicLower = periodicText.toLowerCase();
  if (!periodicText) {
    findings.push({
      id: 'periodic_destruction_missing',
      category: 'periyodik_imha',
      title: 'Periyodik İmha Süresi Belirtilmemiş (Zorunlu Kriter)',
      severity: 'critical',
      stepNumbers: [37],
      legalReference: 'Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik Md. 11/1',
      currentValueSummary: 'Tanımlanmamış (Boş)',
      description:
        'Yönetmelik Md. 11 uyarınca Veri Sorumlusu, periyodik imha süresini Kişisel Veri Saklama ve İmha Politikasında belirlemek zorundadır ve bu süre her hâlükârda 6 ayı geçemez.',
      recommendation: 'Periyodik imha süresini "6 Ayda Bir (Her Yıl Haziran Sonu ve Aralık Sonu İtibarıyla - Standart)" olarak tanımlayın.',
      autoFixAvailable: true,
      autoFixLabel: '6 Ayda Bir (Standart) Olarak Ayarla',
      autoFixPatch: {
        periyodikImhaSuresi: '6 Ayda Bir (Her Yıl Haziran Sonu ve Aralık Sonu İtibarıyla - Standart)'
      }
    });
  } else if (
    (periodicLower.includes('yılda bir') || periodicLower.includes('1 yıl') || periodicLower.includes('12 ay')) &&
    !periodicLower.includes('6 ayda bir') &&
    !periodicLower.includes('3 ayda bir')
  ) {
    findings.push({
      id: 'periodic_destruction_exceeds_6_months',
      category: 'periyodik_imha',
      title: 'Periyodik İmha Süresi Yasal Sınır Olan 6 Ayı Aşıyor!',
      severity: 'critical',
      stepNumbers: [37],
      legalReference: 'Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik Md. 11/1',
      currentValueSummary: periodicText,
      description:
        'Yönetmelik Md. 11/1: "Periyodik imha süresi her hâlükârda altı ayı geçemez." Envanterde yalnızca "Yılda Bir Kez" seçilmesi KVKK denetimlerinde doğrudan mevzuata aykırılık bulgusudur.',
      recommendation: 'Periyodik imha periyodunu 6 Ayda Bir (Haziran ve Aralık sonu) veya 3 Ayda Bir olacak şekilde güncelleyin.',
      autoFixAvailable: true,
      autoFixLabel: 'Mevzuata Uygun "6 Ayda Bir" Olarak Düzelt',
      autoFixPatch: {
        periyodikImhaSuresi: '6 Ayda Bir (Her Yıl Haziran Sonu ve Aralık Sonu İtibarıyla - Standart), Kişisel Veri Saklama ve İmha Politikasının Yıllık Düzenli Revizyonu'
      }
    });
  } else {
    findings.push({
      id: 'periodic_destruction_compliant',
      category: 'periyodik_imha',
      title: 'Periyodik İmha Süresi Yönetmelik Md. 11 Sınırlarına Uygun (≤ 6 Ay)',
      severity: 'compliant',
      stepNumbers: [37],
      legalReference: 'Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik Md. 11',
      currentValueSummary: periodicText,
      description: 'Belirlenen periyodik imha aralığı yasal azami sınır olan 6 ayı aşmamaktadır.',
      recommendation: 'Gerçekleştirilen tüm periyodik imha işlemlerine ait tutanakları 3 yıl süreyle muhafaza edin (Yönetmelik Md. 7/3).',
      autoFixAvailable: false
    });
  }

  // 3. Audit Destruction Reasons & Methods (İmha Sebepleri ve Yöntemleri - Madde 34 & 35)
  const imhaSebepCount = (record.imhaSebep || '').split(',').map(s => s.trim()).filter(Boolean).length;
  const imhaYontemText = (record.imhaYontem || '').toLowerCase();
  const hasPaperMedia = Boolean((record.elektronikOlmayan || '').trim());
  const hasElectronicMedia = Boolean((record.donanim || '').trim() || (record.yazilim || '').trim());

  if (imhaSebepCount < 3 || !imhaYontemText) {
    findings.push({
      id: 'destruction_reasons_methods_incomplete',
      category: 'periyodik_imha',
      title: 'İmha Sebepleri veya İmha Teknik Yöntemleri Eksik Tanımlanmış',
      severity: 'warning',
      stepNumbers: [34, 35],
      legalReference: 'Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik Md. 8, 9, 10',
      currentValueSummary: `İmha Sebebi: ${imhaSebepCount} madde | İmha Yöntemi: ${imhaYontemText ? 'Kısmi' : 'Belirtilmemiş'}`,
      description:
        'Envanterde hem elektronik ortamdaki verilerin (komutla silme/yetki kaldırma) hem fiziksel kağıt ortamların (DIN 66399 kırpma) hem de anonimleştirme yöntemlerinin açıkça yer alması gerekir.',
      recommendation: 'Standart KVKK imha sebeplerini ve ortam bazlı imha yöntemlerini (Silme, Yok Etme, Anonimleştirme) envantere ekleyin.',
      autoFixAvailable: true,
      autoFixLabel: 'Tüm Yasal İmha Sebep ve Yöntemlerini Ekle',
      autoFixPatch: {
        imhaSebep: IMHA_SEBEPLER.join(', '),
        imhaYontem: IMHA_YONTEMLER.join(', ')
      }
    });
  } else if (hasPaperMedia && !imhaYontemText.includes('kağıt') && !imhaYontemText.includes('fiziksel')) {
    findings.push({
      id: 'paper_destruction_method_missing',
      category: 'periyodik_imha',
      title: 'Fiziksel Kağıt Ortamlar İçin Kırpma (Shredder) İmha Yöntemi Eksik',
      severity: 'warning',
      stepNumbers: [23, 35],
      legalReference: 'KVKK Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Rehberi',
      currentValueSummary: `Fiziksel Ortam: "${record.elektronikOlmayan}" var, ancak fiziksel kağıt imha yöntemi seçilmemiş.`,
      description:
        'Madde 23’te fiziksel/kağıt kayıt ortamları beyan edilmesine rağmen Madde 35’te kağıt imha (kırpma/shredder) yöntemi belirtilmemiştir.',
      recommendation: 'Fiziksel ortamdaki evraklar için DIN 66399 kağıt kırpma/imha yöntemini Madde 35’e dahil edin.',
      autoFixAvailable: true,
      autoFixLabel: 'Fiziksel Kağıt İmha Yöntemini Ekle',
      autoFixPatch: {
        imhaYontem: Array.from(new Set([...record.imhaYontem.split(',').map(s => s.trim()).filter(Boolean), IMHA_YONTEMLER[2]])).join(', ')
      }
    });
  } else if (hasElectronicMedia || hasPaperMedia) {
    findings.push({
      id: 'destruction_methods_compliant',
      category: 'periyodik_imha',
      title: 'İmha Sebepleri ve Ortam Bazlı İmha Yöntemleri Mevzuata Uygun',
      severity: 'compliant',
      stepNumbers: [34, 35],
      legalReference: 'Yönetmelik Md. 8, 9, 10 (Silme, Yok Etme ve Anonim Hale Getirme)',
      currentValueSummary: `${imhaSebepCount} İmha Sebebi ve Tam Kapsamlı İmha Yöntemleri tanımlı.`,
      description: 'Hem elektronik hem fiziksel veri kayıt ortamları için uygun imha prosedürleri tanımlanmıştır.',
      recommendation: 'İmha kayıtlarını en az 3 yıl süreyle denetime hazır şekilde saklayın.',
      autoFixAvailable: false
    });
  }

  // 4. Special Categories of Personal Data Security Audit (Özel Nitelikli Veri - KVKK Md. 6 & 2018/10 Kararı)
  const hasSpecialData =
    Boolean((record.ozelNitelikliVeriler || '').trim()) ||
    generalCategoriesText.includes('özel nitelikli') ||
    generalCategoriesText.includes('sağlık') ||
    generalCategoriesText.includes('biyometrik') ||
    generalCategoriesText.includes('ceza mahkûmiyeti');

  const idariText = (record.idariTedbirler || '').toLowerCase();
  const teknikText = (record.teknikTedbirler || '').toLowerCase();

  if (hasSpecialData) {
    const hasSpecialPolicy = idariText.includes('özel nitelikli') || idariText.includes('gizlilik');
    const hasEncryption = teknikText.includes('şifreleme') || teknikText.includes('kriptografik') || teknikText.includes('aes');
    const hasTwoFactor = teknikText.includes('çift faktörlü') || teknikText.includes('2fa') || teknikText.includes('mfa');

    if (!hasSpecialPolicy || !hasEncryption || !hasTwoFactor) {
      const currentIdari = (record.idariTedbirler || '').split(',').map(s => s.trim()).filter(Boolean);
      const currentTeknik = (record.teknikTedbirler || '').split(',').map(s => s.trim()).filter(Boolean);

      findings.push({
        id: 'special_data_measures_missing',
        category: 'ozel_nitelikli',
        title: 'Özel Nitelikli Veriler İçin Zorunlu Güvenlik Önlemleri Eksik (Kurul 2018/10 Kararı)',
        severity: 'critical',
        stepNumbers: [25, 26, 29],
        legalReference: '6698 s. KVKK Md. 6/4 & KVK Kurulunun 31/01/2018 Tarihli ve 2018/10 Sayılı Kararı',
        currentValueSummary: `Özel Nitelikli Politika: ${hasSpecialPolicy ? 'Var' : 'Eksik'} | Şifreleme: ${hasEncryption ? 'Var' : 'Eksik'} | 2FA/MFA: ${hasTwoFactor ? 'Var' : 'Eksik'}`,
        description:
          'Özel nitelikli kişisel veri (Sağlık, Biyometrik, Adli Sicil vb.) işleyen veri sorumluları; KVK Kurulunun 2018/10 sayılı kararı gereği ayrı güvenlik politikası belirlemek, verileri kriptografik şifrelemek ve uzaktan erişimlerde en az iki kademeli kimlik doğrulama (2FA/MFA) uygulamak zorundadır.',
        recommendation: 'Madde 25 ve 26’ya Özel Nitelikli Veri Güvenlik Prosedürü, Disk/Veri Şifreleme (AES-256) ve 2FA/MFA tedbirlerini ekleyin.',
        autoFixAvailable: true,
        autoFixLabel: '2018/10 Sayılı Kurul Kararı Tedbirlerini Ekle',
        autoFixPatch: {
          idariTedbirler: Array.from(new Set([...currentIdari, ...IDARI_TEDBIRLER_LISTESI])).join(', '),
          teknikTedbirler: Array.from(new Set([...currentTeknik, ...TEKNIK_TEDBIRLER_LISTESI])).join(', ')
        }
      });
    } else {
      findings.push({
        id: 'special_data_measures_compliant',
        category: 'ozel_nitelikli',
        title: 'Özel Nitelikli Kişisel Veri Güvenlik Tedbirleri (2018/10 Kararı) Uyumlu',
        severity: 'compliant',
        stepNumbers: [25, 26, 29],
        legalReference: '6698 s. KVKK Md. 6/4 & Kurulun 2018/10 Sayılı Kararı',
        currentValueSummary: 'Ayrı Politika, Kriptografik Şifreleme ve 2FA/MFA tedbirleri tanımlı.',
        description: 'Özel nitelikli kişisel verilerin işlenmesi ve saklanması için Kurul tarafından şart koşulan idari ve teknik tedbirler envanterde mevcuttur.',
        recommendation: 'Özel nitelikli verilere erişim yetkisi olan personelin gizlilik taahhütnamelerini yıllık kontrol edin.',
        autoFixAvailable: false
      });
    }
  }

  // 5. Legal Basis & Processing Purposes Audit (Hukuki Sebepler ve İşleme Amaçları - KVKK Md. 5 & 6)
  const hukukiCount = (record.hukukiSebepler || '').split(',').map(s => s.trim()).filter(Boolean).length;
  const amacCount = (record.saklamaAmaclari || '').split(',').map(s => s.trim()).filter(Boolean).length;

  if (hukukiCount < 2 || amacCount < 2) {
    findings.push({
      id: 'legal_basis_purposes_incomplete',
      category: 'hukuki_sebep',
      title: 'Kişisel Veri İşleme Amaçları veya Hukuki Sebepler Eksik (KVKK Md. 5)',
      severity: 'critical',
      stepNumbers: [31, 32],
      legalReference: '6698 Sayılı KVKK Md. 5/2 (a, c, ç, e, f bentleri) & VERBİS Yönetmeliği Md. 9',
      currentValueSummary: `İşleme Amacı: ${amacCount} adet | Hukuki Sebep: ${hukukiCount} adet`,
      description:
        'Kişisel veriler belirli, açık ve meşru amaçlar dışında işlenemez. Her veri işleme sürecinin KVKK Md. 5/2’deki hukuki sebeplerden (Kanunlarda öngörülme, Sözleşmenin ifası, Hukuki yükümlülük, Hakkın tesisi, Meşru menfaat) en az birine dayanması şarttır.',
      recommendation: 'Madde 31 ve Madde 32’de şirket faaliyetlerinize uygun işleme amaçlarını ve KVKK Md. 5 hukuki sebeplerini tanımlayın.',
      autoFixAvailable: true,
      autoFixLabel: 'Standart KVKK Md. 5 Hukuki Sebep ve Amaçları Ekle',
      autoFixPatch: {
        saklamaAmaclari: SAKLAMA_AMACLARI.slice(0, 8).join(', '),
        hukukiSebepler: HUKUKI_SEBEPLER.join(', ')
      }
    });
  } else {
    findings.push({
      id: 'legal_basis_purposes_compliant',
      category: 'hukuki_sebep',
      title: 'Veri İşleme Amaçları ve KVKK Md. 5 Hukuki Sebepleri Tanımlı',
      severity: 'compliant',
      stepNumbers: [31, 32],
      legalReference: '6698 Sayılı KVKK Md. 4, Md. 5 ve Md. 6',
      currentValueSummary: `${amacCount} İşleme Amacı ve ${hukukiCount} Hukuki Sebep eşleştirilmiş.`,
      description: 'Kişisel veri saklama süreçlerinin dayandığı hukuki sebepler ve kurumsal amaçlar mevzuata uygun şekilde belgelenmiştir.',
      recommendation: 'Açık rızaya dayalı süreçleri diğer hukuki sebeplerden (Md. 5/2) ayrı tutmaya özen gösterin.',
      autoFixAvailable: false
    });
  }

  // 6. Data Controller, Contact Person & KVK Committee Audit (Organizasyon & VERBİS - Madde 11-14)
  const hasController = Boolean((record.veriSorumlusu || '').trim() && (record.unvan || '').trim());
  const hasContactPerson = Boolean((record.irtibat || '').trim());
  const hasCommittee = Boolean((record.komiteBaskani || '').trim() && (record.komiteUyeleri || []).length >= 2);

  if (!hasController || !hasContactPerson || !hasCommittee) {
    findings.push({
      id: 'organization_committee_incomplete',
      category: 'organizasyon',
      title: 'Veri Sorumlusu, İrtibat Kişisi veya KVK Komitesi Ataması Eksik',
      severity: 'warning',
      stepNumbers: [1, 11, 13, 14],
      legalReference: '6698 s. KVKK Md. 16 (VERBİS) & Silme, Yok Etme Yönetmeliği Md. 6/1-a',
      currentValueSummary: `Veri Sorumlusu: ${hasController ? 'Tamam' : 'Eksik'} | İrtibat Kişisi: ${hasContactPerson ? 'Tamam' : 'Eksik'} | KVK Komitesi: ${hasCommittee ? 'Tamam' : 'Eksik'}`,
      description:
        'Saklama ve İmha Politikası Yönetmeliği Md. 6/1-a uyarınca, kişisel verilerin saklama ve imha süreçlerinin yönetiminde görevli personelin unvanları, birimleri ve görev tanımları (KVK Komitesi ve İrtibat Kişisi) envanterde yer almalıdır.',
      recommendation: 'Madde 11, 13 ve 14’te KVK Komitesi Başkan/Üyelerini, Veri Sorumlusunu ve VERBİS İrtibat Kişisini tanımlayın.',
      autoFixAvailable: true,
      autoFixLabel: 'Varsayılan Komite ve İrtibat Yapısını Ata',
      autoFixPatch: {
        komiteBaskani: record.komiteBaskani || 'Genel Müdür',
        komiteUyeleri:
          record.komiteUyeleri && record.komiteUyeleri.length >= 2
            ? record.komiteUyeleri
            : ['İnsan Kaynakları Müdürü', 'Bilgi İşlem (IT) Müdürü', 'Hukuk Müşaviri / Avukat', 'Muhasebe ve Finans Müdürü'],
        veriSorumlusu: record.veriSorumlusu || `${record.unvan || 'Şirket'} Tüzel Kişiliği`,
        irtibat: record.irtibat || 'İnsan Kaynakları ve Kurumsal İletişim Direktörü'
      }
    });
  } else {
    findings.push({
      id: 'organization_committee_compliant',
      category: 'organizasyon',
      title: 'KVK Komitesi, Veri Sorumlusu ve VERBİS İrtibat Kişisi Yapısı Tamamlanmış',
      severity: 'compliant',
      stepNumbers: [11, 12, 13, 14],
      legalReference: '6698 s. KVKK Md. 16 & Yönetmelik Md. 6/1-a',
      currentValueSummary: `Komite Başkanı: ${record.komiteBaskani} (${(record.komiteUyeleri || []).length} Üye) | İrtibat: ${record.irtibat}`,
      description: 'Saklama ve imha süreçlerini yürütecek kurumsal organizasyon ve sorumluluk atamaları eksiksizdir.',
      recommendation: 'Komite üyelerinde görev değişikliği olduğunda envanteri ve VERBİS kaydını 7 gün içinde güncelleyin.',
      autoFixAvailable: false
    });
  }

  // Calculate Scores
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;
  const compliantFindingCount = findings.filter(f => f.severity === 'compliant').length;

  const retentionScore =
    totalProcessedCategories > 0
      ? Math.max(
          0,
          Math.round(
            ((compliantRetentionCount + mismatchRetentionCount * 0.5) / totalProcessedCategories) * 100
          )
        )
      : 50;

  const totalFindingsWeight = findings.length * 20;
  const earnedFindingsWeight = findings.reduce((acc, f) => {
    if (f.severity === 'compliant') return acc + 20;
    if (f.severity === 'info') return acc + 16;
    if (f.severity === 'warning') return acc + 10;
    return acc + 2;
  }, 0);

  const legislationScore =
    totalFindingsWeight > 0 ? Math.min(100, Math.round((earnedFindingsWeight / totalFindingsWeight) * 100)) : 80;

  const overallScore = Math.round(retentionScore * 0.55 + legislationScore * 0.45);

  let riskLevel: ComplianceReportResult['riskLevel'] = 'Düşük Risk (Uyumlu)';
  if (overallScore < 65 || criticalCount >= 2) {
    riskLevel = 'Yüksek Risk (Mevzuat Uyumsuzluğu)';
  } else if (overallScore < 90 || criticalCount === 1 || warningCount >= 1) {
    riskLevel = 'Orta Risk (Kısmi Eksiklik)';
  }

  return {
    overallScore,
    retentionScore,
    legislationScore,
    riskLevel,
    totalProcessedCategories,
    compliantRetentionCount,
    missingRetentionCount,
    mismatchRetentionCount,
    criticalCount,
    warningCount,
    compliantFindingCount,
    retentionAudits,
    findings,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Generates a complete Partial<InventoryRecord> patch that resolves all detected retention & compliance gaps
 */
export function buildFullComplianceAutoFixPatch(record: InventoryRecord): Partial<InventoryRecord> {
  const analysis = analyzeKVKKCompliance(record);
  let combinedPatch: Partial<InventoryRecord> = {};

  for (const finding of analysis.findings) {
    if (finding.autoFixAvailable && finding.autoFixPatch) {
      combinedPatch = {
        ...combinedPatch,
        ...finding.autoFixPatch
      };
    }
  }

  // Ensure all processed categories have their statutory retention periods included
  const existingRetention = (combinedPatch.saklamaSureleri || record.saklamaSureleri || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const requiredRetentionEntries = analysis.retentionAudits
    .filter(a => a.isProcessedInInventory)
    .map(a => a.rule.recommendedEntry);

  const allMergedRetention = Array.from(new Set([...existingRetention, ...requiredRetentionEntries]));
  if (allMergedRetention.length > 0) {
    combinedPatch.saklamaSureleri = allMergedRetention.join(', ');
  }

  return combinedPatch;
}
