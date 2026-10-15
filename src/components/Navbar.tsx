import { 
  Database, Plus, Save, Sparkles, FileEdit, Building2, 
  CheckCircle, Clock, FileText, User as UserIcon, LogOut, LogIn, Shield,
  Eye, MessageSquare, Columns, Maximize2, Scale, BarChart3
} from 'lucide-react';
import { InventoryRecord, User } from '../types';
import { analyzeKVKKCompliance } from '../services/complianceAnalyzer';

interface NavbarProps {
  activeRecord: InventoryRecord;
  recordsCount: number;
  currentUser: User | null;
  activeView: 'assistant' | 'split' | 'preview';
  onViewChange: (view: 'assistant' | 'split' | 'preview') => void;
  onOpenDatabase: () => void;
  onOpenTemplates: () => void;
  onOpenFastEditor: () => void;
  onOpenCompliance?: () => void;
  onOpenRaciModal?: () => void;
  onNewRecord: () => void;
  onSaveRecord: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenFullscreenPreview?: () => void;
  isSaving?: boolean;
}

export function Navbar({
  activeRecord,
  recordsCount,
  currentUser,
  activeView,
  onViewChange,
  onOpenDatabase,
  onOpenTemplates,
  onOpenFastEditor,
  onOpenCompliance,
  onOpenRaciModal,
  onNewRecord,
  onSaveRecord,
  onOpenLogin,
  onLogout,
  onOpenFullscreenPreview,
  isSaving
}: NavbarProps) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: 'Taslak', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    review: { label: 'İnceleniyor', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    finalized: { label: 'Onaylandı', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    active: { label: 'Aktif Veritabanı Kaydı', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
  };

  const status = statusLabels[activeRecord.status] || statusLabels.draft;
  const complianceReport = analyzeKVKKCompliance(activeRecord);

  return (
    <header className="bg-gradient-to-r from-[#143427] via-[#1B4332] to-[#2D6A4F] text-white border-b border-emerald-800/40 shadow-lg px-3 lg:px-6 py-2.5 flex-shrink-0 z-30">
      <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left: Brand & Active Record Meta & Company Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner flex-shrink-0">
            <FileText className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm md:text-base tracking-tight text-white flex items-center gap-2">
                KVKK GÖREV & ENVANTER VERİTABANI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Canlı Sistem
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-emerald-100/90 mt-0.5">
              <span className="font-semibold text-white flex items-center gap-1 truncate max-w-[220px] md:max-w-[320px]" title={currentUser?.companyName || activeRecord.unvan || activeRecord.title}>
                <Building2 className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                {currentUser?.companyName || activeRecord.unvan || activeRecord.title || 'İsimsiz Şirket Kaydı'}
              </span>
              <span className="text-emerald-400/60">•</span>
              <span className="font-mono text-[11px] bg-black/20 px-1.5 py-0.5 rounded text-emerald-200">
                {activeRecord.projectCode || 'PRJ-KVK'}
              </span>
              <span className="hidden md:inline-flex text-emerald-400/60">•</span>
              <span className={`hidden md:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Primary View Mode Switcher (Soru-Cevap / Yan Yana / Ön İzleme) */}
        <div className="flex items-center bg-black/30 p-1 rounded-xl border border-emerald-500/40 shadow-inner">
          <button
            onClick={() => onViewChange('assistant')}
            title="Soru-Cevap asistanı görünümü"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'assistant'
                ? 'bg-emerald-500 text-[#143427] shadow-md'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Sorular</span>
          </button>

          <button
            onClick={() => onViewChange('split')}
            title="Yan yana bölünmüş çift ekran görünümü"
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'split'
                ? 'bg-emerald-500 text-[#143427] shadow-md'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Yan Yana</span>
          </button>

          <button
            onClick={() => onViewChange('preview')}
            title="Tam ekran canlı ön izleme ve rapor görünümü"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              activeView === 'preview'
                ? 'bg-emerald-400 text-[#102a1f] shadow-md ring-2 ring-emerald-300/50'
                : 'bg-emerald-900/60 text-emerald-100 hover:text-white hover:bg-emerald-800/80 border border-emerald-500/30'
            }`}
          >
            <Eye className="w-4 h-4 text-emerald-300" />
            <span>Canlı Ön İzleme</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>
        </div>

        {/* Right: User Profile & Record Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* User Profile / Company Account Chip */}
          {currentUser ? (
            <div className="flex items-center bg-black/25 border border-emerald-600/40 rounded-xl px-2.5 py-1 text-xs text-white gap-2 shadow-inner">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-200 font-bold text-[10px]">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="font-bold text-white text-[11px] truncate max-w-[130px]">{currentUser.fullName}</span>
                <span className="text-[9px] text-emerald-300/90 truncate max-w-[130px] font-medium">
                  {currentUser.role === 'admin' ? 'Yönetici / DPO' : 'Kullanıcı'}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Şirket oturumunu kapat"
                className="p-1 rounded-lg hover:bg-red-500/20 text-emerald-200 hover:text-red-300 transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#143427] font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Giriş Yap</span>
            </button>
          )}

          {/* Interactive RACI Matrix & Workload Chart Button */}
          {onOpenRaciModal && (
            <button
              onClick={onOpenRaciModal}
              title="Departman ve Rol Bazlı Etkileşimli RACI Matrisi ve Yük Dağılım Grafiği"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-emerald-400/40 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
              <span>RACI Matrisi & Grafik</span>
            </button>
          )}

          {/* KVKK Compliance & Retention Analysis Button */}
          {onOpenCompliance && (
            <button
              onClick={onOpenCompliance}
              title="Envanter formundaki veri işleme süreleri ve yasal saklama periyotlarını KVKK mevzuatına göre denetle"
              className={`flex items-center gap-1.5 px-3 py-1.5 font-extrabold text-xs rounded-xl shadow-md transition-all border ${
                complianceReport.criticalCount > 0 || complianceReport.missingRetentionCount > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300'
                  : 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border-emerald-400/50'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>KVKK Uyum Analizi</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                complianceReport.criticalCount > 0 || complianceReport.missingRetentionCount > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-emerald-500 text-slate-950'
              }`}>
                %{complianceReport.overallScore}
              </span>
            </button>
          )}

          {/* Save to Database Button */}
          <button
            onClick={onSaveRecord}
            disabled={isSaving}
            title="Mevcut envanter ve raporu veritabanına kaydet"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#143427] font-bold text-xs rounded-xl shadow-md transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</span>
          </button>

          {/* New Record Creation Button */}
          <button
            onClick={onNewRecord}
            title="Yeni bir şirket kayıt ve envanter süreci başlat"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-300" />
            <span>Yeni</span>
          </button>

          {/* Database / Records Manager Button */}
          <button
            onClick={onOpenDatabase}
            title="Şirketinize ait veritabanı kayıtlarını görüntüle"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0f281e] hover:bg-[#143427] border border-emerald-700/60 text-emerald-100 font-semibold text-xs rounded-xl shadow-sm transition-all"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kayıtlar</span>
            <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {recordsCount}
            </span>
          </button>

          {/* Industry Templates Button */}
          <button
            onClick={onOpenTemplates}
            title="Sektörlere özel hazır KVKK envanter şablonları yükle"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs rounded-xl transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Şablonlar</span>
          </button>

          {/* Fast Full-Editor Button */}
          <button
            onClick={onOpenFastEditor}
            title="Tüm form alanlarını toplu düzenle"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs rounded-xl transition-all"
          >
            <FileEdit className="w-3.5 h-3.5 text-blue-300" />
            <span>Hızlı Düzenle</span>
          </button>

        </div>

      </div>
    </header>
  );
}

