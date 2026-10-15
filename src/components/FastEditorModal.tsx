import { useState } from 'react';
import { InventoryRecord } from '../types';
import { 
  POZISYON_HAVUZU, SABIT_BIRIMLER, BIRIM_TASK_LIST, DEPARTMAN_TUR_LISTESI,
  VERI_KAYIT_LISTELERI, BULUT_SISTEMLERI,
  IDARI_TEDBIRLER_LISTESI, TEKNIK_TEDBIRLER_LISTESI, VERI_GUVENLIGI_LISTESI, 
  KISISEL_VERI_KATEGORILERI, OZEL_NITELIKLI_VERILER, VERI_TOPLAMA_YONTEMLERI,
  SAKLAMA_AMACLARI, HUKUKI_SEBEPLER, ALICI_GRUPLARI,
  IMHA_SEBEPLER, IMHA_YONTEMLER, SAKLAMA_SURELERI, PERIYODIK_IMHA_SURELERI 
} from '../data/initialData';
import { 
  Building2, Users, Shield, HardDrive, Lock, Save, X, Plus, Trash2, Database, FileCheck, Check
} from 'lucide-react';

interface FastEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: InventoryRecord;
  onSave: (updatedRecord: InventoryRecord) => void;
}

const ensurePeriod = (text: string): string => {
  const t = text ? text.trim() : '';
  if (!t) return '';
  if (['.', '!', '?', ':', ';'].some(char => t.endsWith(char))) {
    return t;
  }
  return `${t}.`;
};

export function FastEditorModal({ isOpen, onClose, record, onSave }: FastEditorModalProps) {
  const [formData, setFormData] = useState<InventoryRecord>({ ...record });
  const [activeTab, setActiveTab] = useState<'genel' | 'org' | 'birim' | 'raci' | 'kayit' | 'guvenlik' | 'kategori' | 'imha'>('genel');
  const [customTaskInput, setCustomTaskInput] = useState('');

  if (!isOpen) return null;

  const handleTextChange = (field: keyof InventoryRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMultiSelect = (field: keyof InventoryRecord, item: string) => {
    const current = ((formData[field] as string) || '').split('; ').filter(Boolean);
    let updated: string[];
    if (current.includes(item)) {
      updated = current.filter(x => x !== item);
    } else {
      updated = [...current, item];
    }
    setFormData(prev => ({ ...prev, [field]: updated.join('; ') }));
  };

  const togglePosition = (posTitle: string) => {
    const list = formData.selectedPositions || [];
    let updated: string[];
    if (list.includes(posTitle)) {
      updated = list.filter(p => p !== posTitle);
    } else {
      updated = [...list, posTitle];
    }
    setFormData(prev => ({ ...prev, selectedPositions: updated }));
  };

  const toggleCommitteeMember = (posTitle: string) => {
    const list = formData.komiteUyeleri || [];
    let updated: string[];
    if (list.includes(posTitle)) {
      updated = list.filter(p => p !== posTitle);
    } else {
      updated = [...list, posTitle];
    }
    setFormData(prev => ({ ...prev, komiteUyeleri: updated }));
  };

  const addCustomRaciTask = () => {
    if (!customTaskInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      raciTasks: [...(prev.raciTasks || []), ensurePeriod(customTaskInput.trim())]
    }));
    setCustomTaskInput('');
  };

  const removeRaciTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      raciTasks: prev.raciTasks.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    // Ensure all simple text fields end with a period if populated
    const cleanData: InventoryRecord = {
      ...formData,
      unvan: ensurePeriod(formData.unvan),
      adres: ensurePeriod(formData.adres),
      vergiNo: formData.vergiNo ? formData.vergiNo.trim() : '',
      vergiDairesi: ensurePeriod(formData.vergiDairesi),
      mersisNo: formData.mersisNo ? formData.mersisNo.trim() : '',
      telefon: formData.telefon ? formData.telefon.trim() : '',
      eposta: formData.eposta ? formData.eposta.trim() : '',
      faaliyet: ensurePeriod(formData.faaliyet),
      departmanlar: ensurePeriod(formData.departmanlar),
      yetkili: ensurePeriod(formData.yetkili),
      veriSorumlusu: ensurePeriod(formData.veriSorumlusu),
      irtibat: ensurePeriod(formData.irtibat),
    };
    onSave(cleanData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Hızlı Kayıt & Envanter Düzenleyici (1-37 Madde)</h2>
              <p className="text-xs text-emerald-100">
                Tüm 37 KVKK adımını tek ekrandan hızlıca düzenleyin ve veritabanına işleyin
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 gap-2 overflow-x-auto">
          {[
            { id: 'genel', label: 'Bölüm 1: Firma & Bilgiler (1-9)', icon: <Building2 className="w-4 h-4" /> },
            { id: 'org', label: 'Bölüm 2: Org & Komite (10-14)', icon: <Users className="w-4 h-4" /> },
            { id: 'birim', label: 'Bölüm 3: Birim Görevleri (15-19)', icon: <Shield className="w-4 h-4" /> },
            { id: 'raci', label: 'Ters Şemsiye RACI Matrisi', icon: <Users className="w-4 h-4" /> },
            { id: 'kayit', label: 'Bölüm 4: Kayıt Ortamları (20-24)', icon: <HardDrive className="w-4 h-4" /> },
            { id: 'guvenlik', label: 'Bölüm 5: Veri Güvenliği (25-27)', icon: <Lock className="w-4 h-4" /> },
            { id: 'kategori', label: 'Bölüm 6: Veri Kategorileri (28-33)', icon: <Database className="w-4 h-4" /> },
            { id: 'imha', label: 'Bölüm 7: İmha & Süreler (34-37)', icon: <FileCheck className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-900 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* TAB 1: Genel (1-9) */}
          {activeTab === 'genel' && (
            <div className="space-y-4 max-w-3xl mx-auto bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-emerald-900 border-b pb-2">Bölüm 1: Firma ve İletişim Bilgileri (Sorular 1-9)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">1. Şirket Tam Unvanı</label>
                  <input
                    type="text"
                    value={formData.unvan}
                    onChange={e => handleTextChange('unvan', e.target.value)}
                    placeholder="Örn: Nova Bilişim ve Yazılım A.Ş."
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">2. Şirket Adresi</label>
                  <input
                    type="text"
                    value={formData.adres}
                    onChange={e => handleTextChange('adres', e.target.value)}
                    placeholder="Merkez adresi..."
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">3. Vergi Kimlik Numarası (VKN)</label>
                  <input
                    type="text"
                    value={formData.vergiNo}
                    onChange={e => handleTextChange('vergiNo', e.target.value)}
                    placeholder="10 Haneli Vergi No"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">4. Vergi Dairesi</label>
                  <input
                    type="text"
                    value={formData.vergiDairesi}
                    onChange={e => handleTextChange('vergiDairesi', e.target.value)}
                    placeholder="Vergi Dairesi"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">5. MERSİS / Ticaret Sicil No</label>
                  <input
                    type="text"
                    value={formData.mersisNo || ''}
                    onChange={e => handleTextChange('mersisNo', e.target.value)}
                    placeholder="MERSİS veya Sicil No"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">6. Kurumsal Telefon & Santral</label>
                  <input
                    type="text"
                    value={formData.telefon || ''}
                    onChange={e => handleTextChange('telefon', e.target.value)}
                    placeholder="0212 345 67 89"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">7. Kurumsal E-Posta & KEP Adresi</label>
                  <input
                    type="text"
                    value={formData.eposta || ''}
                    onChange={e => handleTextChange('eposta', e.target.value)}
                    placeholder="kvkk@sirketiniz.com / sirket@hs01.kep.tr"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">8. Faaliyet Konusu ve Sektör</label>
                  <input
                    type="text"
                    value={formData.faaliyet}
                    onChange={e => handleTextChange('faaliyet', e.target.value)}
                    placeholder="Ana faaliyet alanı..."
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700">9. Departmanlar ve Birimler (Tür Seçimi & Düzenleme)</label>
                    <span className="text-[11px] text-slate-500">Tıklayarak ekleyin veya kaldırın</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                    {DEPARTMAN_TUR_LISTESI.map(dep => {
                      const currentList = (formData.departmanlar || '').split(/[;,]/).map(s => s.trim().replace(/\.$/, '')).filter(Boolean);
                      const isSelected = currentList.includes(dep) || currentList.includes(ensurePeriod(dep));
                      return (
                        <button
                          key={dep}
                          type="button"
                          onClick={() => {
                            let updated: string[];
                            if (isSelected) {
                              updated = currentList.filter(d => d !== dep && d !== ensurePeriod(dep));
                            } else {
                              updated = [...currentList, dep];
                            }
                            handleTextChange('departmanlar', updated.map(d => ensurePeriod(d)).join('; '));
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                            isSelected 
                              ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold shadow-xs' 
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{dep}</span>
                          {isSelected ? <Check className="w-3 h-3 text-emerald-300" /> : <Plus className="w-3 h-3 text-slate-400" />}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={formData.departmanlar}
                    onChange={e => handleTextChange('departmanlar', e.target.value)}
                    placeholder="Departmanlar (noktalı virgül ile ayrılarak)..."
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-600 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Organizasyon & Komite (10-14) */}
          {activeTab === 'org' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">10. Madde: Şemsiye Modeli Pozisyon Seçimi</h3>
                    <p className="text-xs text-slate-500">Kurumunuzda bulunan unvanları seçin (Seçilen: {(formData.selectedPositions || []).length}):</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const standardList = [
                          'Genel Müdür / CEO', 'Direktör', 'Teknik / IT Müdürü', 
                          'İnsan Kaynakları Müdürü', 'Finans ve Muhasebe Müdürü', 
                          'Hukuk Müşaviri / Uyum Yöneticisi', 'KVK Sorumlusu / DPO', 
                          'Bilgi Güvenliği Uzmanı', 'Sistem ve Ağ Uzmanı', 'Operasyon / Ofis Personeli'
                        ];
                        setFormData(prev => ({ ...prev, selectedPositions: standardList }));
                      }}
                      className="text-[10px] font-semibold px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded"
                    >
                      ⭐ Standart (10)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const kobiList = [
                          'Genel Müdür / CEO', 'İnsan Kaynakları Müdürü', 
                          'Muhasebe Uzmanı', 'Sistem ve Ağ Uzmanı', 'Operasyon / Ofis Personeli'
                        ];
                        setFormData(prev => ({ ...prev, selectedPositions: kobiList }));
                      }}
                      className="text-[10px] font-semibold px-2 py-1 bg-teal-100 hover:bg-teal-200 text-teal-900 rounded"
                    >
                      🏢 KOBİ (5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, selectedPositions: POZISYON_HAVUZU.map(p => p.unvan) }))}
                      className="text-[10px] font-semibold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, selectedPositions: [] }))}
                      className="text-[10px] font-semibold px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded"
                    >
                      Temizle
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                  {POZISYON_HAVUZU.map(p => {
                    const isSelected = formData.selectedPositions?.includes(p.unvan);
                    return (
                      <button
                        key={p.unvan}
                        onClick={() => togglePosition(p.unvan)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`text-[9px] px-1 py-0.5 rounded font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          K{p.seviye}
                        </span>
                        <span>{p.unvan}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">11. Madde: KVK Komite Yapısı</h3>
                    <p className="text-xs text-slate-500">Komite başkanı ve üyelerini belirleyin:</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          komiteBaskani: 'Genel Müdür / CEO',
                          komiteUyeleri: [
                            'Hukuk Müşaviri / Uyum Yöneticisi',
                            'Teknik / IT Müdürü',
                            'İnsan Kaynakları Müdürü',
                            'KVK Sorumlusu / DPO'
                          ]
                        }));
                      }}
                      className="text-[10px] font-semibold px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded"
                    >
                      ⭐ Standart Komite
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          komiteBaskani: 'Genel Müdür / CEO',
                          komiteUyeleri: [
                            'İnsan Kaynakları Müdürü',
                            'Muhasebe Uzmanı',
                            'Sistem ve Ağ Uzmanı'
                          ]
                        }));
                      }}
                      className="text-[10px] font-semibold px-2 py-1 bg-teal-100 hover:bg-teal-200 text-teal-900 rounded"
                    >
                      🏢 KOBİ Komitesi
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Komite Başkanı</label>
                    <select
                      value={formData.komiteBaskani}
                      onChange={e => handleTextChange('komiteBaskani', e.target.value)}
                      className="w-full p-2.5 border rounded-lg bg-white"
                    >
                      <option value="">Seçiniz...</option>
                      {(formData.selectedPositions?.length ? formData.selectedPositions : POZISYON_HAVUZU.map(p => p.unvan)).map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Komite Üyeleri</label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                      {(formData.selectedPositions?.length ? formData.selectedPositions : POZISYON_HAVUZU.map(p => p.unvan)).map(pos => {
                        const isMember = formData.komiteUyeleri?.includes(pos);
                        return (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => toggleCommitteeMember(pos)}
                            className={`text-[11px] px-2.5 py-1 rounded-md border ${
                              isMember
                                ? 'bg-blue-600 text-white border-blue-700'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            {pos}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-emerald-900 mb-2">Yetkili & Sorumlular (12-14)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">12. İmza Yetkilisi / Temsilci</label>
                    <input
                      type="text"
                      value={formData.yetkili}
                      onChange={e => handleTextChange('yetkili', e.target.value)}
                      placeholder="Şirket Müdürü / Temsilci"
                      className="w-full p-2.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">13. Veri Sorumlusu Unvanı</label>
                    <input
                      type="text"
                      value={formData.veriSorumlusu}
                      onChange={e => handleTextChange('veriSorumlusu', e.target.value)}
                      placeholder="Tüzel Kişilik Unvanı"
                      className="w-full p-2.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">14. İrtibat Kişisi (VERBİS)</label>
                    <input
                      type="text"
                      value={formData.irtibat}
                      onChange={e => handleTextChange('irtibat', e.target.value)}
                      placeholder="VERBİS İrtibat Görevlisi"
                      className="w-full p-2.5 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Birim Görevleri (15-19) */}
          {activeTab === 'birim' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {SABIT_BIRIMLER.map((birim, bIdx) => {
                const stepNum = 15 + bIdx;
                const standardTasks = BIRIM_TASK_LIST[birim.key] || [];
                const currentTasks = formData.birimSecilenGorevler?.[birim.key] || [];

                return (
                  <div key={birim.key} className="bg-white p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-emerald-900 mb-1">
                      {stepNum}. {birim.unvan} ({birim.birim})
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {standardTasks.map(t => {
                        const isSelected = currentTasks.includes(t);
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              const updated = isSelected 
                                ? currentTasks.filter(x => x !== t)
                                : [...currentTasks, t];
                              setFormData(prev => ({
                                ...prev,
                                birimSecilenGorevler: {
                                  ...prev.birimSecilenGorevler,
                                  [birim.key]: updated
                                }
                              }));
                            }}
                            className={`text-xs px-3 py-1.5 rounded-lg border text-left ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-medium'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: RACI Matrisi */}
          {activeTab === 'raci' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">Ters Şemsiye RACI Görev Dağılım Listesi</h3>
                  <p className="text-xs text-slate-500">Matriste yer alacak alt görevleri ekleyin veya silin:</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTaskInput}
                    onChange={e => setCustomTaskInput(e.target.value)}
                    placeholder="Yeni alt görev tanımı..."
                    className="p-2 text-xs border rounded-lg w-64"
                  />
                  <button
                    onClick={addCustomRaciTask}
                    className="flex items-center gap-1 px-3 py-2 bg-[#2D6A4F] text-white text-xs font-semibold rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ekle
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {(formData.raciTasks || []).map((task, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-slate-700">{idx + 1}. {task}</span>
                    <button
                      onClick={() => removeRaciTask(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Kayıt Ortamları (20-24) */}
          {activeTab === 'kayit' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {[
                { field: 'donanim', label: '20. Donanım Kayıt Ortamları', list: VERI_KAYIT_LISTELERI.donanim },
                { field: 'yazilim', label: '21. Yazılım & Veritabanı Kayıt Ortamları', list: VERI_KAYIT_LISTELERI.yazilim },
                { field: 'guvenlik', label: '22. Güvenlik Altyapısı', list: VERI_KAYIT_LISTELERI.guvenlik },
                { field: 'elektronikOlmayan', label: '23. Fiziksel / Elektronik Olmayan Ortamlar', list: VERI_KAYIT_LISTELERI.elektronikOlmayan },
                { field: 'bulutSistemleri', label: '24. Bulut Depolama ve Uzak Sunucu Sistemleri', list: BULUT_SISTEMLERI }
              ].map(group => (
                <div key={group.field} className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-emerald-900 mb-2">{group.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.list.map(item => {
                      const isSelected = ((formData[group.field as keyof InventoryRecord] as string) || '').includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleMultiSelect(group.field as any, item)}
                          className={`text-xs px-3 py-1.5 rounded-full border ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-800'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: Veri Güvenliği (25-27) */}
          {activeTab === 'guvenlik' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {[
                { field: 'idariTedbirler', label: '25. Veri Güvenliği – İdari Tedbirler', list: IDARI_TEDBIRLER_LISTESI },
                { field: 'teknikTedbirler', label: '26. Veri Güvenliği – Teknik Tedbirler', list: TEKNIK_TEDBIRLER_LISTESI },
                { field: 'veriGuvenligi', label: '27. Genel Veri Güvenliği Önlemleri', list: VERI_GUVENLIGI_LISTESI }
              ].map(group => (
                <div key={group.field} className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-emerald-900 mb-2">{group.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.list.map(item => {
                      const isSelected = ((formData[group.field as keyof InventoryRecord] as string) || '').includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleMultiSelect(group.field as any, item)}
                          className={`text-xs px-3 py-1.5 rounded-full border ${
                            isSelected
                              ? 'bg-[#2D6A4F] text-white border-[#1B4332]'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: Kişisel Veri Kategorileri ve Amaçlar (28-33) */}
          {activeTab === 'kategori' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {[
                { field: 'kisiselVeriKategorileri', label: '28. Kişisel Veri Kategorileri (Genel)', list: KISISEL_VERI_KATEGORILERI },
                { field: 'ozelNitelikliVeriler', label: '29. Özel Nitelikli Kişisel Veri Kategorileri', list: OZEL_NITELIKLI_VERILER },
                { field: 'veriToplamaYontemleri', label: '30. Kişisel Veri Elde Etme Yöntemleri', list: VERI_TOPLAMA_YONTEMLERI },
                { field: 'saklamaAmaclari', label: '31. Saklamayı Gerektiren İşleme Amaçları', list: SAKLAMA_AMACLARI },
                { field: 'hukukiSebepler', label: '32. Saklamayı Gerektiren Hukuki Sebepler', list: HUKUKI_SEBEPLER },
                { field: 'aliciGruplari', label: '33. Veri Aktarılan Alıcı Grupları', list: ALICI_GRUPLARI }
              ].map(group => (
                <div key={group.field} className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-emerald-900 mb-2">{group.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.list.map(item => {
                      const isSelected = ((formData[group.field as keyof InventoryRecord] as string) || '').includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleMultiSelect(group.field as any, item)}
                          className={`text-xs px-3 py-1.5 rounded-full border ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-800'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 8: İmha ve Süreler (34-37) */}
          {activeTab === 'imha' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {[
                { field: 'imhaSebep', label: '34. İmhayı Gerektiren Sebepler', list: IMHA_SEBEPLER },
                { field: 'imhaYontem', label: '35. İmha Yöntemleri (Silme, Yok Etme, Anonimleştirme)', list: IMHA_YONTEMLER },
                { field: 'saklamaSureleri', label: '36. Saklama ve İmha Süreleri', list: SAKLAMA_SURELERI },
                { field: 'periyodikImhaSuresi', label: '37. Periyodik İmha Süresi ve Güncelleme Takvimi', list: PERIYODIK_IMHA_SURELERI }
              ].map(group => (
                <div key={group.field} className="bg-white p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-emerald-900 mb-2">{group.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.list.map(item => {
                      const isSelected = ((formData[group.field as keyof InventoryRecord] as string) || '').includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleMultiSelect(group.field as any, item)}
                          className={`text-xs px-3 py-1.5 rounded-full border ${
                            isSelected
                              ? 'bg-[#1B4332] text-white border-black'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Değişiklikleri kaydetmek için aşağıdaki butona basın.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Save className="w-4 h-4" /> Değişiklikleri Rapor ve Veritabanına Kaydet
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
