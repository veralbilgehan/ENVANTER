import React, { useState, useMemo } from 'react';
import { InventoryRecord, RACIValue } from '../types';
import { 
  POZISYON_HAVUZU, SABIT_BIRIMLER, POLITIKA_METNI, EK_BILGILER, STEPS 
} from '../data/initialData';
import { 
  FileText, Calendar, Building2, Shield, Users, 
  FileDown, Printer, Plus, Trash2, CheckCircle2, Save, 
  Layers, HardDrive, Lock, ShieldCheck, Sparkles, Cloud, Database,
  Maximize2, Minimize2, Search, Eye, ArrowLeft, Check, Layout, Sparkle,
  Scale, AlertTriangle, XCircle
} from 'lucide-react';
import { 
  exportWordDocument, exportExcelSpreadsheet, 
  exportCSVDocument, exportPDFDocument, exportTextDocument 
} from '../services/exportService';
import { exportSingleRecordJSON } from '../services/dbStorage';
import { analyzeKVKKCompliance, buildFullComplianceAutoFixPatch } from '../services/complianceAnalyzer';
import { RaciAnalyticsPanel } from './RaciAnalyticsPanel';

interface LiveReportProps {
  record: InventoryRecord;
  onUpdateRecord: (partial: Partial<InventoryRecord>) => void;
  onSaveToDatabase: () => void;
  onOpenFastEditor: () => void;
  onOpenCompliance?: () => void;
  onOpenRaciModal?: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClosePreview?: () => void;
}

export function LiveReport({
  record,
  onUpdateRecord,
  onSaveToDatabase,
  onOpenFastEditor,
  onOpenCompliance,
  onOpenRaciModal,
  showToast,
  isFullscreen = false,
  onToggleFullscreen,
  onClosePreview
}: LiveReportProps) {
  const [newRaciTaskInput, setNewRaciTaskInput] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [viewFormat, setViewFormat] = useState<'fluid' | 'a4'>('fluid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavSection, setActiveNavSection] = useState<string>('all');

  const complianceReport = useMemo(() => analyzeKVKKCompliance(record), [record]);

  // Calculate completion statistics (37 questions)
  const completionStats = useMemo(() => {
    let filledCount = 0;
    STEPS.forEach(step => {
      if (step.customType === 'orgSelection') {
        if (record.selectedPositions && record.selectedPositions.length > 0) filledCount++;
      } else if (step.customType === 'committeeSelection') {
        if (record.komiteBaskani && record.komiteUyeleri && record.komiteUyeleri.length > 0) filledCount++;
      } else if (step.customType === 'taskSelection') {
        const tasks = record.birimSecilenGorevler?.[step.key as string];
        if (tasks && tasks.length > 0) filledCount++;
      } else {
        const val = record[step.key as keyof InventoryRecord];
        if (val && String(val).trim().length > 0) filledCount++;
      }
    });
    const percentage = Math.round((filledCount / STEPS.length) * 100);
    return { filledCount, total: STEPS.length, percentage };
  }, [record]);

  // Group positions by hierarchical level (Kademe 1 to 6)
  const groupedLevels: Record<number, string[]> = {};
  (record.selectedPositions || []).forEach(posTitle => {
    const item = POZISYON_HAVUZU.find(p => p.unvan === posTitle) || { unvan: posTitle, seviye: 4 };
    if (!groupedLevels[item.seviye]) groupedLevels[item.seviye] = [];
    groupedLevels[item.seviye].push(item.unvan);
  });

  const sortedLevels = Object.keys(groupedLevels)
    .map(Number)
    .sort((a, b) => a - b);

  // RACI Matrix Reverse Roles (Tabandan Tavana / Bottom-up)
  const reverseRoles = [...(record.selectedPositions || [])].reverse();

  const handleRaciChange = (taskIndex: number, role: string, value: RACIValue) => {
    const key = `${taskIndex}_${role}`;
    const newValues = {
      ...record.raciValues,
      [key]: value
    };
    onUpdateRecord({ raciValues: newValues });
  };

  const handleAddRaciTask = () => {
    if (!newRaciTaskInput.trim()) return;
    const updated = [...(record.raciTasks || []), newRaciTaskInput.trim()];
    onUpdateRecord({ raciTasks: updated });
    setNewRaciTaskInput('');
    showToast('success', 'RACI Görevi Eklendi', `"${newRaciTaskInput.trim()}" matrise satır olarak dahil edildi.`);
  };

  const handleDeleteRaciTask = (index: number) => {
    const updated = record.raciTasks.filter((_, i) => i !== index);
    onUpdateRecord({ raciTasks: updated });
  };

  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    showToast('info', 'PDF Hazırlanıyor...', 'Sayfa çizimi ve render işlemi yapılıyor.');
    const success = await exportPDFDocument(record, 'printableReportContent');
    setIsExportingPdf(false);
    if (success) {
      showToast('success', 'PDF İndirildi', 'Rapor PDF formatında cihazınıza kaydedildi.');
    } else {
      showToast('error', 'PDF Hatası', 'PDF oluşturulurken bir hata meydana geldi.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (secId: string) => {
    setActiveNavSection(secId);
    if (secId === 'all') {
      const el = document.getElementById('printableReportScrollArea');
      if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = document.getElementById(secId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : ''}`}>
      
      {/* Top Header & Export Controls */}
      <div className="px-4 md:px-5 py-2.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0 border-b border-slate-800">
        
        {/* Title & Badge */}
        <div className="flex items-center gap-2">
          {onClosePreview && (
            <button
              onClick={onClosePreview}
              title="Soru-Cevap asistanına geri dön"
              className="lg:hidden flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Geri
            </button>
          )}

          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
            <Eye className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                CANLI ÖN İZLEME & RAPOR
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 37 Madde
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="font-mono text-emerald-400">{record.projectCode || 'PRJ-KVK'}</span>
              <span>•</span>
              <span className="text-emerald-200 font-semibold">{completionStats.filledCount}/{completionStats.total} Madde (%{completionStats.percentage})</span>
            </div>
          </div>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          <button
            onClick={() => {
              exportWordDocument(record);
              showToast('success', 'Word İndirildi', 'Rapor Word (.doc) formatında kaydedildi.');
            }}
            title="Word (.doc) formatında indir"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#2b5797] hover:bg-[#1e3f6f] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <FileDown className="w-3.5 h-3.5" /> Word
          </button>

          <button
            onClick={() => {
              exportExcelSpreadsheet(record);
              showToast('success', 'Excel İndirildi', 'Rapor Excel (.xls) formatında kaydedildi.');
            }}
            title="Excel (.xls) formatında indir"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#217346] hover:bg-[#165131] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <FileDown className="w-3.5 h-3.5" /> Excel
          </button>

          <button
            onClick={() => {
              exportTextDocument(record);
              showToast('success', 'Text İndirildi', 'Rapor Text (.txt) formatında kaydedildi.');
            }}
            title="Text (.txt) formatında indir"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <FileDown className="w-3.5 h-3.5" /> TXT
          </button>

          <button
            onClick={() => {
              exportCSVDocument(record);
              showToast('success', 'CSV İndirildi', 'Rapor CSV formatında kaydedildi.');
            }}
            title="CSV formatında indir"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <FileDown className="w-3.5 h-3.5" /> CSV
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            title="PDF formatında indir"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#dc3545] hover:bg-[#b02a37] text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" /> {isExportingPdf ? '...' : 'PDF'}
          </button>

          <button
            onClick={() => {
              exportSingleRecordJSON(record);
              showToast('success', 'Lokal Veri Paketi (.json) İndirildi', 'Form verisi bilgisayarınıza (lokale) kaydedildi.');
            }}
            title="Formu daha sonra geri yüklenebilir JSON veri paketi olarak kendi bilgisayarınıza (lokale) indirin"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <HardDrive className="w-3.5 h-3.5" /> Lokale Sakla (.json)
          </button>

          {onOpenCompliance && (
            <button
              onClick={onOpenCompliance}
              title="KVKK mevzuat ve saklama süreleri uyum analizini aç"
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-extrabold rounded-lg shadow-sm transition-all ${
                complianceReport.criticalCount > 0 || complianceReport.missingRetentionCount > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/40'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>KVKK Uyum (%{complianceReport.overallScore})</span>
            </button>
          )}

          <button
            onClick={onSaveToDatabase}
            title="Formu bulut ve sunucu veritabanına kaydet"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Veritabanına Kaydet
          </button>

          <button
            onClick={handlePrint}
            title="Raporu yazdır"
            className="flex items-center gap-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Preview Toggle Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Tam ekrandan çık" : "Tam ekran ön izleme modu"}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all ml-1"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Küçült</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tam Ekran</span>
                </>
              )}
            </button>
          )}

        </div>
      </div>

      {/* Sub-bar: Quick Section Jump, Format View Switcher, and Live Search */}
      <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
        
        {/* Quick Section Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar max-w-full">
          <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Bölümler:</span>
          
          <button
            onClick={() => scrollToSection('all')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all whitespace-nowrap ${
              activeNavSection === 'all'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            📋 Tümü
          </button>

          <button
            onClick={() => scrollToSection('preview-sec-1')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all whitespace-nowrap ${
              activeNavSection === 'preview-sec-1'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            1. Firma (1-9)
          </button>

          <button
            onClick={() => scrollToSection('preview-sec-2')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all whitespace-nowrap ${
              activeNavSection === 'preview-sec-2'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            2. Komite (10-14)
          </button>

          <button
            onClick={() => scrollToSection('preview-sec-3')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all whitespace-nowrap ${
              activeNavSection === 'preview-sec-3'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            3. Görev & RACI (15-19)
          </button>

          <button
            onClick={() => scrollToSection('preview-sec-4')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all whitespace-nowrap ${
              activeNavSection === 'preview-sec-4'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            4. Ortamlar (20-24)
          </button>

          <button
            onClick={() => scrollToSection('preview-sec-5')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all whitespace-nowrap ${
              activeNavSection === 'preview-sec-5'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            5. Güvenlik (25-27)
          </button>

          <button
            onClick={() => scrollToSection('preview-sec-6')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all whitespace-nowrap ${
              activeNavSection === 'preview-sec-6'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            6. Veriler (28-33)
          </button>

          <button
            onClick={() => scrollToSection('preview-sec-7')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all whitespace-nowrap ${
              activeNavSection === 'preview-sec-7'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            7. İmha (34-37)
          </button>

          <button
            onClick={() => scrollToSection('preview-sec-compliance')}
            className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-all whitespace-nowrap flex items-center gap-1 ${
              activeNavSection === 'preview-sec-compliance'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            <Scale className="w-3 h-3" /> 8. KVKK Uyum (%{complianceReport.overallScore})
          </button>

          <button
            onClick={() => scrollToSection('preview-policy')}
            className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all whitespace-nowrap ${
              activeNavSection === 'preview-policy'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            📜 Politika
          </button>
        </div>

        {/* View Mode & Search */}
        <div className="flex items-center gap-2">
          
          {/* Format Switcher */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setViewFormat('fluid')}
              title="Geniş ekran kart görünümü"
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                viewFormat === 'fluid' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Geniş
            </button>
            <button
              onClick={() => setViewFormat('a4')}
              title="A4 Resmi Belge sayfa görünümü"
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                viewFormat === 'a4' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4 Belge
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rapor içinde ara..."
              className="pl-7 pr-2 py-1 text-[11px] bg-white border border-slate-300 rounded-lg w-28 md:w-36 focus:w-48 transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

        </div>

      </div>

      {/* Printable Report Scroll Area */}
      <div 
        className={`flex-1 overflow-y-auto p-4 md:p-8 ${
          viewFormat === 'a4' ? 'bg-slate-200/80' : 'bg-slate-50/50'
        }`} 
        id="printableReportScrollArea"
      >
        <div 
          id="printableReportContent" 
          className={`mx-auto bg-white p-6 md:p-10 transition-all ${
            viewFormat === 'a4' 
              ? 'max-w-3xl shadow-2xl rounded-none border border-slate-300 my-4 space-y-8 ring-1 ring-black/5' 
              : 'max-w-5xl shadow-sm rounded-2xl border border-slate-200/80 space-y-8'
          } text-slate-800`}
        >
          
          {/* Header Band */}
          <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 text-emerald-200 px-2 py-0.5 rounded">
                  CANLI ÖN İZLEME BELGESİ
                </span>
                <span className="text-[10px] font-semibold text-emerald-200">
                  {completionStats.filledCount}/37 Soru Hazır
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-black flex items-center gap-2 mt-1">
                <FileText className="w-6 h-6 text-emerald-300" />
                GÖREV TANIMI VE VERİ SAKLAMA-İMHA ENVANTER RAPORU
              </h1>
              <p className="text-xs text-emerald-100 mt-0.5">
                6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) Kapsamında 37 Maddelik Uyum ve Envanter Matrisi
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span>{new Date().toLocaleDateString('tr-TR')} • {record.version || 'v1.0'}</span>
            </div>
          </div>

          {/* Bölüm 1: Firma ve İletişim Bilgileri (Sorular 1-9) */}
          <div id="preview-sec-1" className="space-y-4 scroll-mt-6">
            <h2 className="text-sm font-bold text-[#1B4332] border-b-2 border-[#2D6A4F] pb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#2D6A4F]" />
                Bölüm 1: Firma ve İletişim Bilgileri (Maddeler 1-9)
              </span>
              <span className="text-[11px] font-normal text-slate-500">Maddeler 1-9</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800">1. Şirket Tam Unvanı: </span>
                <span className="text-slate-900 font-bold">{record.unvan || '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">2. Şirket Adresi: </span>
                <span className="text-slate-700">{record.adres || '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">3. Vergi Numarası (VKN): </span>
                <span className="text-slate-700 font-mono">{record.vergiNo || '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">4. Vergi Dairesi: </span>
                <span className="text-slate-700">{record.vergiDairesi || '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">5. MERSİS / Ticaret Sicil No: </span>
                <span className="text-slate-700 font-mono">{record.mersisNo || '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">6. Telefon & Santral: </span>
                <span className="text-slate-700">{record.telefon || '--'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold text-slate-800">7. E-Posta & KEP Adresi: </span>
                <span className="text-slate-700">{record.eposta || '--'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold text-slate-800">8. Faaliyet Konusu ve Sektör: </span>
                <span className="text-slate-700">{record.faaliyet || '--'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold text-slate-800 block mb-1">9. Departmanlar ve Birimler: </span>
                {record.departmanlar ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {record.departmanlar.split(/[;,]/).map((dep, idx) => {
                      const trimmed = dep.trim().replace(/\.$/, '');
                      if (!trimmed) return null;
                      return (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200">
                          🏢 {trimmed}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-slate-700">--</span>
                )}
              </div>
            </div>
          </div>

          {/* Bölüm 2: Organizasyon, Komite ve Sorumlular (Sorular 10-14) */}
          <div id="preview-sec-2" className="space-y-4 scroll-mt-6">
            <h2 className="text-sm font-bold text-[#1B4332] border-b-2 border-[#2D6A4F] pb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2D6A4F]" />
                Bölüm 2: Organizasyon, Komite ve Sorumlular (Maddeler 10-14)
              </span>
              <span className="text-[11px] font-normal text-slate-500">Maddeler 10-14</span>
            </h2>

            {/* 10. Madde: Şemsiye Modeli Kademeleri */}
            <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">10. Şemsiye Modeli Organizasyon Kademeleri:</span>
                <span className="text-[11px] text-slate-500">Tepeden tabana doğru kademelendirilmiş yapı ({record.selectedPositions?.length || 0} Pozisyon)</span>
              </div>

              {sortedLevels.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">Henüz pozisyon seçilmedi.</div>
              ) : (
                <div className="space-y-3">
                  {sortedLevels.map(lvl => (
                    <div key={lvl} className="flex flex-col items-center">
                      <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-3 py-0.5 rounded-full mb-1.5">
                        KADEME {lvl}
                      </span>
                      <div className="flex flex-wrap justify-center gap-2">
                        {groupedLevels[lvl].map(title => (
                          <div
                            key={title}
                            className="bg-emerald-50 border border-emerald-600 text-[#065f46] font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm"
                          >
                            {title}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 11-14. Maddeler: Komite ve Yetkililer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800">11. Komite Başkanı: </span>
                <span className="text-blue-900 font-bold">{record.komiteBaskani || '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">11. Komite Üyeleri: </span>
                <span className="text-slate-700">{(record.komiteUyeleri || []).join(', ') || '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">12. İmza Yetkilisi / Temsilci: </span>
                <span className="text-slate-700">{record.yetkili || '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800">13. Veri Sorumlusu Unvanı: </span>
                <span className="text-slate-700">{record.veriSorumlusu || record.unvan || '--'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold text-slate-800">14. İrtibat Kişisi (VERBİS): </span>
                <span className="text-slate-700">{record.irtibat || '--'}</span>
              </div>
            </div>
          </div>

          {/* Bölüm 3: Birim Görev ve Yetki Dağılımı (Sorular 15-19) */}
          <div id="preview-sec-3" className="space-y-3 scroll-mt-6">
            <h2 className="text-sm font-bold text-[#1B4332] border-b-2 border-[#2D6A4F] pb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#2D6A4F]" />
                Bölüm 3: Birim Görev ve Yetki Dağılımı (Maddeler 15-19)
              </span>
              <span className="text-[11px] font-normal text-slate-500">Maddeler 15-19</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-[#2D6A4F] text-white">
                    <th className="p-2.5 border border-[#1B4332] w-1/4">Unvan & Madde No</th>
                    <th className="p-2.5 border border-[#1B4332] w-1/4">Birim</th>
                    <th className="p-2.5 border border-[#1B4332]">Görev ve Sorumluluklar</th>
                  </tr>
                </thead>
                <tbody>
                  {SABIT_BIRIMLER.map((b, i) => {
                    const stepNum = 15 + i;
                    const tasks = record.birimSecilenGorevler?.[b.key] || [];
                    return (
                      <tr key={b.key} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="p-2.5 border border-slate-200 font-bold text-slate-900">
                          {stepNum}. {b.unvan}
                        </td>
                        <td className="p-2.5 border border-slate-200 text-slate-700">{b.birim}</td>
                        <td className="p-2.5 border border-slate-200 text-slate-600">
                          {tasks.length > 0 ? tasks.join('; ') : 'Görev tanımlanmadı'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ters Şemsiye RACI Matrisi & Departman/Rol Sorumluluk Grafiği */}
          <div id="preview-sec-raci" className="space-y-3 scroll-mt-6">
            <RaciAnalyticsPanel
              record={record}
              onUpdateRecord={onUpdateRecord}
              showToast={showToast}
              onOpenModal={onOpenRaciModal}
            />
          </div>

          {/* Bölüm 4: Veri Kayıt Ortamları (Sorular 20-24) */}
          <div id="preview-sec-4" className="space-y-3 scroll-mt-6">
            <h2 className="text-sm font-bold text-[#1B4332] border-b-2 border-[#2D6A4F] pb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#2D6A4F]" />
                Bölüm 4: Veri Kayıt Ortamları (Maddeler 20-24)
              </span>
              <span className="text-[11px] font-normal text-slate-500">Maddeler 20-24</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">20. Elektronik Donanım Kayıt Ortamları:</h3>
                <p className="text-slate-600">{record.donanim || 'Henüz belirtilmedi.'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">21. Yazılım & Veritabanı Ortamları:</h3>
                <p className="text-slate-600">{record.yazilim || 'Henüz belirtilmedi.'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">22. Güvenlik Donanım & Yazılımları:</h3>
                <p className="text-slate-600">{record.guvenlik || 'Henüz belirtilmedi.'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">23. Fiziksel / Elektronik Olmayan Ortamlar:</h3>
                <p className="text-slate-600">{record.elektronikOlmayan || 'Henüz belirtilmedi.'}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="font-bold text-slate-800 mb-1.5">24. Bulut ve Uzak Sunucu Depolama Ortamları:</h3>
                <p className="text-slate-600">{record.bulutSistemleri || 'Henüz belirtilmedi.'}</p>
              </div>
            </div>
          </div>

          {/* Bölüm 5: Veri Güvenliği Tedbirleri (Sorular 25-27) */}
          <div id="preview-sec-5" className="space-y-3 scroll-mt-6">
            <h2 className="text-sm font-bold text-[#1B4332] border-b-2 border-[#2D6A4F] pb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2D6A4F]" />
                Bölüm 5: Veri Güvenliği Tedbirleri (Maddeler 25-27)
              </span>
              <span className="text-[11px] font-normal text-slate-500">Maddeler 25-27</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-950 mb-2">25. İdari Tedbirler</h3>
                <p className="text-slate-700 leading-relaxed">
                  {record.idariTedbirler || record.veriGuvenligi || 'İdari tedbir belirtilmedi.'}
                </p>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                <h3 className="font-bold text-emerald-950 mb-2">26. Teknik Tedbirler</h3>
                <p className="text-slate-700 leading-relaxed">
                  {record.teknikTedbirler || record.veriGuvenligi || 'Teknik tedbir belirtilmedi.'}
                </p>
              </div>

              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">27. Genel Veri Güvenliği Politikası ve Tedbirleri</h3>
                <p className="text-slate-700 leading-relaxed">
                  {record.veriGuvenligi || 'Genel tedbirler belirtilmedi.'}
                </p>
              </div>
            </div>
          </div>

          {/* Bölüm 6: Kişisel Veri Kategorileri ve Amaçlar (Sorular 28-33) */}
          <div id="preview-sec-6" className="space-y-3 scroll-mt-6">
            <h2 className="text-sm font-bold text-[#1B4332] border-b-2 border-[#2D6A4F] pb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#2D6A4F]" />
                Bölüm 6: Kişisel Veri Kategorileri ve Amaçlar (Maddeler 28-33)
              </span>
              <span className="text-[11px] font-normal text-slate-500">Maddeler 28-33</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">28. Kişisel Veri Kategorileri (Genel):</h3>
                <p className="text-slate-700">{record.kisiselVeriKategorileri || '--'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">29. Özel Nitelikli Kişisel Veriler:</h3>
                <p className="text-slate-700">{record.ozelNitelikliVeriler || '--'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">30. Veri Toplama Yöntemleri:</h3>
                <p className="text-slate-700">{record.veriToplamaYontemleri || '--'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">31. Saklamayı Gerektiren İşleme Amaçları:</h3>
                <p className="text-slate-700">{record.saklamaAmaclari || '--'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">32. Saklamayı Gerektiren Hukuki Sebepler:</h3>
                <p className="text-slate-700">{record.hukukiSebepler || '--'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">33. Veri Aktarılan Alıcı Grupları:</h3>
                <p className="text-slate-700">{record.aliciGruplari || '--'}</p>
              </div>
            </div>
          </div>

          {/* Bölüm 7: İmha Sebepleri, Yöntemleri ve Süreler (Sorular 34-37) */}
          <div id="preview-sec-7" className="space-y-3 scroll-mt-6">
            <h2 className="text-sm font-bold text-[#1B4332] border-b-2 border-[#2D6A4F] pb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
                Bölüm 7: İmha Sebepleri, Yöntemleri ve Süreler (Maddeler 34-37)
              </span>
              <span className="text-[11px] font-normal text-slate-500">Maddeler 34-37</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">34. İmhayı Gerektiren Sebepler:</h3>
                <p className="text-slate-700">{record.imhaSebep || '--'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">35. İmha Yöntemleri:</h3>
                <p className="text-slate-700">{record.imhaYontem || '--'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">36. Saklama ve İmha Süreleri:</h3>
                <p className="text-slate-700">{record.saklamaSureleri || '--'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1.5">37. Periyodik İmha Süresi ve Güncelleme:</h3>
                <p className="text-slate-700">{record.periyodikImhaSuresi || '--'}</p>
              </div>
            </div>
          </div>

          {/* Bölüm 8: KVKK Mevzuat ve Yasal Saklama Süreleri Otomatik Denetim Raporu */}
          <div id="preview-sec-compliance" className="space-y-3 scroll-mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#2D6A4F] pb-1.5">
              <h2 className="text-sm font-bold text-[#1B4332] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#2D6A4F]" />
                Bölüm 8: KVKK Mevzuat ve Yasal Saklama Süreleri Uyum Analizi
              </h2>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border ${
                  complianceReport.overallScore >= 85
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : complianceReport.overallScore >= 65
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}>
                  Uyum Skoru: %{complianceReport.overallScore} ({complianceReport.riskLevel})
                </span>

                {(complianceReport.missingRetentionCount > 0 || complianceReport.criticalCount > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      const patch = buildFullComplianceAutoFixPatch(record);
                      onUpdateRecord(patch);
                      showToast(
                        'success',
                        'Mevzuat Süreleri Otomatik Tamamlandı',
                        'Eksik yasal saklama periyotları ve imha kriterleri KVKK mevzuatına göre eklendi.'
                      );
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg shadow-xs transition-all print:hidden"
                  >
                    <Sparkles className="w-3 h-3" /> Eksik Süreleri Otomatik Tamamla
                  </button>
                )}

                {onOpenCompliance && (
                  <button
                    type="button"
                    onClick={onOpenCompliance}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-semibold text-[11px] rounded-lg shadow-xs transition-all print:hidden"
                  >
                    <Scale className="w-3 h-3" /> Detaylı Denetim Merkezi
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">İşlenen Kategori</span>
                  <span className="text-base font-black text-slate-800">{complianceReport.totalProcessedCategories} Kategori</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Yasal Süresi Uyumlu</span>
                  <span className="text-base font-black text-emerald-700">{complianceReport.compliantRetentionCount} Kategori</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Eksik / Uyumsuz Süre</span>
                  <span className={`text-base font-black ${complianceReport.missingRetentionCount + complianceReport.mismatchRetentionCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {complianceReport.missingRetentionCount + complianceReport.mismatchRetentionCount} Kategori
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Periyodik İmha (Md. 11)</span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-0.5">
                    {record.periyodikImhaSuresi ? (record.periyodikImhaSuresi.includes('6 Ay') || record.periyodikImhaSuresi.includes('3 Ay') ? '≤ 6 Ay (Mevzuata Uygun)' : 'Süre Uyarısı (>6 Ay)') : 'Tanımlanmamış'}
                  </span>
                </div>
              </div>

              {/* Processed Categories Statutory Retention Audit Table */}
              <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-[#1B4332] text-white text-left">
                      <th className="p-2 border border-[#2D6A4F]">İşlenen Veri Kategorisi</th>
                      <th className="p-2 border border-[#2D6A4F]">Mevzuat Yasal Saklama Süresi & Dayanak</th>
                      <th className="p-2 border border-[#2D6A4F]">Envanterde Beyan Edilen Süre (Md. 36)</th>
                      <th className="p-2 border border-[#2D6A4F] text-center">Denetim Sonucu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceReport.retentionAudits
                      .filter(a => a.isProcessedInInventory || a.isDeclaredInRetention)
                      .map(item => (
                        <tr key={item.rule.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-800">
                            {item.rule.shortLabel}
                            {item.rule.isSpecialCategory && (
                              <span className="ml-1 text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-bold">
                                Özel Nitelikli
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-slate-700">
                            <span className="font-semibold text-[#1B4332] block">{item.rule.statutoryPeriodText}</span>
                            <span className="text-[10px] text-slate-500">{item.rule.legalBasis}</span>
                          </td>
                          <td className="p-2 text-slate-700">
                            {item.matchedRetentionLine || (
                              <span className="text-rose-600 font-semibold italic">Tanımlanmamış (Eksik)</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {item.status === 'compliant' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> Uygun
                              </span>
                            ) : item.status === 'missing_period' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                                <XCircle className="w-3 h-3" /> Süre Eksik
                              </span>
                            ) : item.status === 'duration_mismatch' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                                <AlertTriangle className="w-3 h-3" /> Süre Uyumsuz
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[10px]">
                                İhtiyati Tanım
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Politika Metni */}
          <div id="preview-policy" className="space-y-3 scroll-mt-6">
            <h2 className="text-sm font-bold text-[#1B4332] border-b-2 border-[#2D6A4F] pb-1">
              Kurumsal Politika Metni (KVKK İlgili Politikası)
            </h2>
            <div 
              className="text-xs leading-relaxed text-slate-700 bg-slate-50/80 p-4 rounded-xl border border-slate-200 prose prose-xs max-w-none"
              dangerouslySetInnerHTML={{ __html: POLITIKA_METNI }}
            />
          </div>

          {/* Ek Bilgiler */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-[#1B4332] border-b-2 border-[#2D6A4F] pb-1">
              Ek Bilgiler (Periyotlar, Dağıtım & Yürürlük)
            </h2>
            <div 
              className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 prose prose-xs max-w-none"
              dangerouslySetInnerHTML={{ __html: EK_BILGILER }}
            />
          </div>

          {/* Bilgi Notu */}
          <div className="p-4 bg-emerald-50/70 border-l-4 border-[#2D6A4F] rounded-r-xl text-xs text-slate-800 flex items-start gap-2">
            <Shield className="w-4 h-4 text-[#2D6A4F] flex-shrink-0 mt-0.5" />
            <div>
              <strong>Bilgi Notu: </strong>
              <span>{record.infoNote || 'Rapor, 37 maddelik veri sorumlusu kayıt ve envanter süreci doğrultusunda oluşturulmuştur.'}</span>
            </div>
          </div>

          {/* Official Signature Area in A4 Mode */}
          {viewFormat === 'a4' && (
            <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="p-4 border border-dashed border-slate-300 rounded-lg">
                <p className="font-bold text-slate-800">Hazırlayan / KVK Komitesi Başkanı</p>
                <p className="text-slate-600 mt-1">{record.komiteBaskani || 'Komite Başkanı'}</p>
                <div className="h-14 flex items-end justify-center text-[10px] text-slate-400">İmza & Kaşe</div>
              </div>
              <div className="p-4 border border-dashed border-slate-300 rounded-lg">
                <p className="font-bold text-slate-800">Onaylayan / Veri Sorumlusu Temsilcisi</p>
                <p className="text-slate-600 mt-1">{record.yetkili || 'Yetkili Temsilci'}</p>
                <div className="h-14 flex items-end justify-center text-[10px] text-slate-400">İmza & Kaşe</div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
