import React, { useState, useRef, useEffect } from 'react';
import { InventoryRecord, WorkspaceSummary } from '../types';
import { 
  Database, Plus, Search, Trash2, Copy, ArrowRight, Download, Upload, 
  Calendar, Building2, Tag, ShieldCheck, X, FileText, CheckCircle2,
  FileSpreadsheet, FileCode, Cloud, HardDrive, Users, FolderPlus, Check, RefreshCw
} from 'lucide-react';
import { 
  exportDatabaseJSON, importDatabaseJSON, exportSingleRecordJSON, 
  fetchWorkspacesSummary, fetchAllRecordsFromBackendAndCloud 
} from '../services/dbStorage';
import { 
  exportDatabaseToWord, exportDatabaseToExcel, 
  exportDatabaseToCSV, exportDatabaseToText,
  exportWordDocument, exportExcelSpreadsheet,
  exportCSVDocument, exportTextDocument
} from '../services/exportService';
import { registerUser } from '../services/authService';
import { auth } from '../firebase';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: InventoryRecord[];
  activeRecordId: string;
  currentCompanyName?: string;
  onSelectRecord: (record: InventoryRecord) => void;
  onCreateNewRecord: (customCompanyName?: string, customOwnerName?: string) => void;
  onDeleteRecord: (id: string) => void;
  onDuplicateRecord: (id: string) => void;
  onRefreshRecords: (companyFilter?: string) => void;
  onSwitchWorkspace?: (companyName: string, ownerName?: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function DatabaseModal({
  isOpen,
  onClose,
  records,
  activeRecordId,
  currentCompanyName,
  onSelectRecord,
  onCreateNewRecord,
  onDeleteRecord,
  onDuplicateRecord,
  onRefreshRecords,
  onSwitchWorkspace,
  showToast
}: DatabaseModalProps) {
  const [activeTab, setActiveTab] = useState<'records' | 'workspaces' | 'newWorkspace'>('records');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyScope, setCompanyScope] = useState<'current' | 'all'>('all');
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [allBackendRecords, setAllBackendRecords] = useState<InventoryRecord[]>(records);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Person / Company Workspace form states
  const [newWsCompany, setNewWsCompany] = useState('');
  const [newWsPersonName, setNewWsPersonName] = useState('');
  const [newWsUsername, setNewWsUsername] = useState('');
  const [newWsEmail, setNewWsEmail] = useState('');
  const [newWsPassword, setNewWsPassword] = useState('123456');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBackendAndCloudData = async () => {
    setIsSyncing(true);
    try {
      const [wsList, fullRecs] = await Promise.all([
        fetchWorkspacesSummary(),
        fetchAllRecordsFromBackendAndCloud()
      ]);
      setWorkspaces(wsList);
      setAllBackendRecords(fullRecs);
    } catch (e) {
      console.warn('Error syncing database modal:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAllBackendRecords(records);
      loadBackendAndCloudData();
    }
  }, [isOpen, records]);

  if (!isOpen) return null;

  const sourceRecords = companyScope === 'current' && currentCompanyName
    ? allBackendRecords.filter(r => {
        const c = (r.companyName || r.unvan || '').toLowerCase();
        const target = currentCompanyName.toLowerCase();
        return c.includes(target) || target.includes(c);
      })
    : allBackendRecords;

  const filteredRecords = sourceRecords.filter(rec => {
    const matchesSearch = 
      (rec.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.unvan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.ownerUsername || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.projectCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.faaliyet || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportDB = () => {
    const jsonStr = exportDatabaseJSON(filteredRecords);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KVKK_Envanter_Veritabani_Yedek_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'Lokal Bilgisayara İndirildi', `${filteredRecords.length} adet envanter kaydı JSON veritabanı paketi olarak bilgisayarınıza kaydedildi.`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;
      const res = importDatabaseJSON(content, currentCompanyName);
      if (res.success) {
        await loadBackendAndCloudData();
        onRefreshRecords();
        if (res.importedRecords && res.importedRecords[0]) {
          onSelectRecord(res.importedRecords[0]);
        }
        showToast('success', 'Lokal Dosya Veritabanına Yüklendi', `${res.count} adet form kaydı veritabanına ve buluta başarıyla aktarıldı.`);
      } else {
        showToast('error', 'İçe Aktarma Başarısız', res.error || 'Dosya okunamadı.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateWorkspaceAndForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsCompany.trim()) {
      showToast('error', 'Eksik Bilgi', 'Lütfen yeni açılacak şirket veya çalışma alanı adını giriniz.');
      return;
    }
    const cleanCompany = newWsCompany.trim();
    const cleanPerson = newWsPersonName.trim() || 'KVKK Yetkilisi';
    const cleanUser = (newWsUsername.trim() || cleanPerson.toLowerCase().replace(/[^a-z0-9]/g, '') || `user_${Date.now().toString().slice(-4)}`);

    // Register user/workspace in auth & backend
    registerUser({
      fullName: cleanPerson,
      username: cleanUser,
      email: newWsEmail.trim() || `${cleanUser}@sirket.com`,
      password: newWsPassword || '123456',
      companyName: cleanCompany
    });

    // Switch workspace and create empty form record
    if (onSwitchWorkspace) {
      onSwitchWorkspace(cleanCompany, cleanPerson);
    } else {
      onCreateNewRecord(cleanCompany, cleanUser);
    }

    setNewWsCompany('');
    setNewWsPersonName('');
    setNewWsUsername('');
    setNewWsEmail('');
    showToast('success', 'Yeni Kişi & Şirket Alanı Açıldı', `"${cleanCompany}" (${cleanPerson}) için veritabanında özel alan açıldı ve yeni form başlatıldı.`);
    onClose();
  };

  const statusBadges: Record<string, { label: string; bg: string; text: string }> = {
    draft: { label: 'Taslak', bg: 'bg-amber-100', text: 'text-amber-800' },
    review: { label: 'İnceleniyor', bg: 'bg-blue-100', text: 'text-blue-800' },
    finalized: { label: 'Tamamlandı', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    active: { label: 'Aktif / Yürürlükte', bg: 'bg-emerald-100', text: 'text-emerald-800' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#143427] via-[#1B4332] to-[#2D6A4F] text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <Database className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold">KVKK Bulut & Lokal Veritabanı Yönetim Merkezi</h2>
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-semibold">
                  <Cloud className="w-3 h-3" /> {auth.currentUser ? 'Firebase Cloud + Sunucu Aktif' : 'Express Sunucu + Lokal Depolama Aktif'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Farklı kişi ve şirketlere özel alan açın, doldurulan formları veritabanında saklayın veya kendi bilgisayarınıza (lokale) indirin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadBackendAndCloudData}
              title="Veritabanını Yenile & Senkronize Et"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Senkronize Et</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
                activeTab === 'records'
                  ? 'bg-slate-50 text-[#1B4332] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Kayıtlı Formlar & İndirme Merkezi ({allBackendRecords.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('workspaces')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
                activeTab === 'workspaces'
                  ? 'bg-slate-50 text-[#1B4332] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Kişi & Şirket Alanları ({workspaces.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('newWorkspace')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${
                activeTab === 'newWorkspace'
                  ? 'bg-emerald-500 text-[#143427] shadow-sm'
                  : 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-800/60'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Yeni Kişi / Şirket Alanı Aç</span>
            </button>
          </div>

          {activeTab === 'records' && (
            <div className="flex items-center gap-1.5 pb-2">
              <button
                onClick={() => setCompanyScope('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  companyScope === 'all' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-300 hover:text-white'
                }`}
              >
                Tüm Şirketler ({allBackendRecords.length})
              </button>
              {currentCompanyName && (
                <button
                  onClick={() => setCompanyScope('current')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all truncate max-w-[220px] ${
                    companyScope === 'current' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  Sadece: {currentCompanyName}
                </button>
              )}
            </div>
          )}
        </div>

        {/* TAB 1: RECORDS & LOCAL DOWNLOADS */}
        {activeTab === 'records' && (
          <>
            {/* Toolbar & Search */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Şirket unvanı, kişi adı, proje kodu veya faaliyet ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-2 px-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="draft">Taslak</option>
                  <option value="review">İnceleniyor</option>
                  <option value="finalized">Tamamlandı</option>
                  <option value="active">Aktif</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    onCreateNewRecord();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Form Başlat
                </button>

                {/* Veritabanını Toplu Lokale İndirme Butonları */}
                <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-sm">
                  <button
                    onClick={() => {
                      if (filteredRecords.length === 0) return;
                      exportDatabaseToWord(filteredRecords);
                      showToast('success', 'Word (.doc) Lokale İndirildi', `${filteredRecords.length} kayıt Word formatında bilgisayarınıza kaydedildi.`);
                    }}
                    title="Tüm Kayıtları Word (.doc) Olarak Bilgisayara İndir"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#2b5797] hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> Word
                  </button>

                  <button
                    onClick={() => {
                      if (filteredRecords.length === 0) return;
                      exportDatabaseToExcel(filteredRecords);
                      showToast('success', 'Excel (.xls) Lokale İndirildi', `${filteredRecords.length} kayıt Excel tablosu olarak bilgisayarınıza kaydedildi.`);
                    }}
                    title="Tüm Kayıtları Excel (.xls) Olarak Bilgisayara İndir"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#217346] hover:bg-emerald-50 rounded-lg transition-colors border-l border-slate-200"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                  </button>

                  <button
                    onClick={() => {
                      if (filteredRecords.length === 0) return;
                      exportDatabaseToText(filteredRecords);
                      showToast('success', 'Text (.txt) Lokale İndirildi', `${filteredRecords.length} kayıt metin dosyası olarak bilgisayarınıza kaydedildi.`);
                    }}
                    title="Tüm Kayıtları Text (.txt) Olarak Bilgisayara İndir"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-l border-slate-200"
                  >
                    <FileCode className="w-3.5 h-3.5" /> TXT
                  </button>

                  <button
                    onClick={() => {
                      if (filteredRecords.length === 0) return;
                      exportDatabaseToCSV(filteredRecords);
                      showToast('success', 'CSV Lokale İndirildi', `${filteredRecords.length} kayıt CSV formatında bilgisayarınıza kaydedildi.`);
                    }}
                    title="Tüm Kayıtları CSV Olarak Bilgisayara İndir"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border-l border-slate-200"
                  >
                    CSV
                  </button>
                </div>

                <button
                  onClick={handleExportDB}
                  title="Tüm veritabanını JSON paketi olarak kendi bilgisayarınıza (lokale) indirin"
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl transition-colors"
                >
                  <HardDrive className="w-4 h-4 text-emerald-700" />
                  Lokale JSON Yedek İndir
                </button>

                <label
                  title="Bilgisayarınızdaki (lokaldeki) JSON yedeğini veya formu sisteme geri yükleyin"
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-900 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-blue-700" />
                  Lokalden Dosya Yükle
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Records List Container */}
            <div className="flex-1 overflow-y-auto p-5 bg-slate-100/70">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-14 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Database className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-base font-semibold text-slate-700">Eşleşen Form Kaydı Bulunamadı</p>
                  <p className="text-sm text-slate-500 mt-1">Yeni bir kişi/şirket alanı açabilir veya yeni bir envanter formu başlatabilirsiniz.</p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('newWorkspace')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                    >
                      <FolderPlus className="w-4 h-4" /> Yeni Kişi / Şirket Alanı Aç
                    </button>
                    <button
                      onClick={() => {
                        onCreateNewRecord();
                        onClose();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white text-xs font-bold rounded-xl"
                    >
                      <Plus className="w-4 h-4" /> Yeni Form Başlat
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRecords.map((rec) => {
                    const isActive = rec.id === activeRecordId;
                    const statusInfo = statusBadges[rec.status] || statusBadges.draft;

                    return (
                      <div
                        key={rec.id}
                        className={`bg-white rounded-xl p-5 border transition-all relative flex flex-col justify-between ${
                          isActive 
                            ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                                {statusInfo.label}
                              </span>
                              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {rec.projectCode || 'PRJ-KVK'}
                              </span>
                              {rec.ownerUsername && (
                                <span className="text-[11px] font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  👤 {rec.ownerUsername}
                                </span>
                              )}
                            </div>
                            {isActive && (
                              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Açık Form
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-slate-800 text-base line-clamp-1 mb-0.5" title={rec.unvan || rec.title}>
                            {rec.unvan || rec.title || 'İsimsiz Şirket Kaydı'}
                          </h3>
                          {rec.companyName && rec.companyName !== rec.unvan && (
                            <p className="text-[11px] font-semibold text-emerald-800 mb-1">
                              🏢 Çalışma Alanı: {rec.companyName}
                            </p>
                          )}

                          <p className="text-xs text-slate-500 line-clamp-2 mb-3 min-h-[32px]">
                            {rec.faaliyet || rec.adres || 'Henüz faaliyet ve adres detayı girilmemiş.'}
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg mb-3">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">Pozisyon: {rec.selectedPositions?.length || 0} adet</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">Başkan: {rec.komiteBaskani || 'Belirtilmedi'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">RACI Görev: {rec.raciTasks?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">{new Date(rec.updatedAt || rec.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>

                          {/* Direct Single-Record Local Machine Download Bar */}
                          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2 mb-3 flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-[#1B4332] flex items-center gap-1">
                              <Download className="w-3.5 h-3.5 text-emerald-700" />
                              Lokale İndir:
                            </span>
                            <div className="flex items-center gap-1 flex-wrap">
                              <button
                                onClick={() => {
                                  exportWordDocument(rec);
                                  showToast('success', 'Word (.doc) İndirildi', `"${rec.unvan || rec.title}" formu bilgisayarınıza kaydedildi.`);
                                }}
                                className="px-2 py-1 bg-[#2b5797] hover:bg-[#1e3f6f] text-white text-[10px] font-bold rounded transition-colors"
                              >
                                Word (.doc)
                              </button>
                              <button
                                onClick={() => {
                                  exportExcelSpreadsheet(rec);
                                  showToast('success', 'Excel (.xls) İndirildi', `"${rec.unvan || rec.title}" tablosu bilgisayarınıza kaydedildi.`);
                                }}
                                className="px-2 py-1 bg-[#217346] hover:bg-[#165131] text-white text-[10px] font-bold rounded transition-colors"
                              >
                                Excel (.xls)
                              </button>
                              <button
                                onClick={() => {
                                  exportTextDocument(rec);
                                  showToast('success', 'TXT İndirildi', `"${rec.unvan || rec.title}" metin raporu bilgisayarınıza kaydedildi.`);
                                }}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-bold rounded transition-colors"
                              >
                                TXT
                              </button>
                              <button
                                onClick={() => {
                                  exportCSVDocument(rec);
                                  showToast('success', 'CSV İndirildi', `"${rec.unvan || rec.title}" CSV dosyası bilgisayarınıza kaydedildi.`);
                                }}
                                className="px-2 py-1 bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold rounded transition-colors"
                              >
                                CSV
                              </button>
                              <button
                                onClick={() => {
                                  exportSingleRecordJSON(rec);
                                  showToast('success', 'Lokal Veri Paketi (.json) İndirildi', `"${rec.unvan || rec.title}" form verisi daha sonra geri yüklenebilmek üzere bilgisayarınıza indirildi.`);
                                }}
                                title="Bu formu daha sonra sisteme geri yükleyebilmek için JSON veri dosyası olarak bilgisayarınıza indirin"
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded transition-colors"
                              >
                                JSON Paketi
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                onDuplicateRecord(rec.id);
                                loadBackendAndCloudData();
                                showToast('success', 'Kayıt Çoğaltıldı', `"${rec.unvan || rec.title}" kopyası oluşturuldu.`);
                              }}
                              title="Bu formu çoğalt (Kopya oluştur)"
                              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs"
                            >
                              <Copy className="w-3.5 h-3.5" /> Kopyala
                            </button>
                            <button
                              onClick={() => {
                                onDeleteRecord(rec.id);
                                setAllBackendRecords(prev => prev.filter(item => item.id !== rec.id));
                                showToast('info', 'Kayıt Silindi', 'Envanter kaydı veritabanından kaldırıldı.');
                              }}
                              title="Kaydı veritabanından sil"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Sil
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              onSelectRecord(rec);
                              onClose();
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-[#1B4332] hover:bg-[#2D6A4F] text-white'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {isActive ? 'Şu An Düzenleniyor' : 'Formu Aç & Düzenle'}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: WORKSPACES (COMPANIES & PEOPLE) */}
        {activeTab === 'workspaces' && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  Veritabanındaki Kişi ve Şirket Çalışma Alanları
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Her şirket veya kişi kendi izole alanında birden fazla form doldurabilir, saklayabilir ve indirebilir.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('newWorkspace')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                <FolderPlus className="w-4 h-4" />
                Yeni Kişi / Şirket Alanı Aç
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workspaces.map((ws, idx) => {
                const isCurrent = currentCompanyName && ws.companyName.toLowerCase() === currentCompanyName.toLowerCase();
                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-xl p-5 border flex flex-col justify-between transition-all ${
                      isCurrent ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' : 'border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                            Aktif Çalışma Alanı
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm mb-1">{ws.companyName}</h4>
                      <div className="text-xs text-slate-500 space-y-1 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Yetkililer: {ws.users.length > 0 ? ws.users.join(', ') : 'Genel Yetkili'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Kayıtlı Form Sayısı: <strong>{ws.recordCount} adet</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          if (onSwitchWorkspace) {
                            onSwitchWorkspace(ws.companyName, ws.users[0]);
                            onClose();
                          } else {
                            setCompanyScope('all');
                            setSearchTerm(ws.companyName);
                            setActiveTab('records');
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Bu Alana Geç</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          onCreateNewRecord(ws.companyName, ws.users[0]);
                          onClose();
                        }}
                        title="Bu şirket için yeni boş form aç"
                        className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors"
                      >
                        + Yeni Form
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CREATE NEW PERSON / COMPANY WORKSPACE */}
        {activeTab === 'newWorkspace' && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70">
            <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-5">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-[#1B4332] flex items-center justify-center">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Yeni Kişi ve Şirket Çalışma Alanı Aç</h3>
                  <p className="text-xs text-slate-500">
                    Farklı bir şirket, kurum veya kişi için veritabanında bağımsız bir kayıt alanı ve 37 maddelik yeni envanter formu başlatır.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateWorkspaceAndForm} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Şirket Unvanı veya Çalışma Alanı Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWsCompany}
                    onChange={(e) => setNewWsCompany(e.target.value)}
                    placeholder="Örn: Anadolu Sağlık Grubu A.Ş. veya Av. Mehmet Özkan Danışmanlık"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      İlgili Kişi / Yetkili Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      required
                      value={newWsPersonName}
                      onChange={(e) => setNewWsPersonName(e.target.value)}
                      placeholder="Örn: Ayşe Demir"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kullanıcı Kodu (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={newWsUsername}
                      onChange={(e) => setNewWsUsername(e.target.value)}
                      placeholder="Örn: aysedemir"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-Posta Adresi (Opsiyonel)
                    </label>
                    <input
                      type="email"
                      value={newWsEmail}
                      onChange={(e) => setNewWsEmail(e.target.value)}
                      placeholder="kvkk@sirketiniz.com"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Erişim Şifresi
                    </label>
                    <input
                      type="text"
                      value={newWsPassword}
                      onChange={(e) => setNewWsPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('records')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    <Check className="w-4 h-4 text-emerald-300" />
                    Veritabanında Alan Aç & Yeni Form Başlat
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>Toplam <strong>{allBackendRecords.length}</strong> kayıtlı form</span>
            <span>•</span>
            <span><strong>{workspaces.length}</strong> ayrı şirket/kişi çalışma alanı</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
}
