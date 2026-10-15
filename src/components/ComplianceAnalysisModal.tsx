import React, { useState, useMemo } from 'react';
import { InventoryRecord } from '../types';
import {
  analyzeKVKKCompliance,
  buildFullComplianceAutoFixPatch,
  RetentionAuditItem,
  ComplianceFinding
} from '../services/complianceAnalyzer';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Scale,
  Clock,
  Sparkles,
  FileDown,
  X,
  Check,
  Filter,
  BookOpen,
  Wrench,
  ArrowRight,
  Info,
  Lock
} from 'lucide-react';

interface ComplianceAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: InventoryRecord;
  onUpdateRecord: (partial: Partial<InventoryRecord>) => void;
  onSaveToDatabase: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function ComplianceAnalysisModal({
  isOpen,
  onClose,
  record,
  onUpdateRecord,
  onSaveToDatabase,
  showToast
}: ComplianceAnalysisModalProps) {
  const [activeTab, setActiveTab] = useState<'retention_matrix' | 'findings' | 'legislation_guide'>('retention_matrix');
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'issues' | 'processed' | 'special'>('all');

  const report = useMemo(() => analyzeKVKKCompliance(record), [record]);

  if (!isOpen) return null;

  const filteredAudits = report.retentionAudits.filter(item => {
    if (matrixFilter === 'issues') {
      return item.status === 'missing_period' || item.status === 'duration_mismatch';
    }
    if (matrixFilter === 'processed') {
      return item.isProcessedInInventory;
    }
    if (matrixFilter === 'special') {
      return item.rule.isSpecialCategory;
    }
    return true;
  });

  // Fix a single category's retention period
  const handleFixSingleRetention = (auditItem: RetentionAuditItem) => {
    const existingList = (record.saklamaSureleri || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const updatedList = Array.from(new Set([...existingList, auditItem.rule.recommendedEntry]));
    const patch: Partial<InventoryRecord> = {
      saklamaSureleri: updatedList.join(', ')
    };

    // If not marked as processed yet, also add to appropriate category field if user clicked add
    if (!auditItem.isProcessedInInventory) {
      const currentCats = (record.kisiselVeriKategorileri || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      patch.kisiselVeriKategorileri = Array.from(
        new Set([...currentCats, auditItem.rule.categoryName])
      ).join(', ');
    }

    onUpdateRecord(patch);
    showToast(
      'success',
      'Yasal Saklama Süresi Eklendi',
      `"${auditItem.rule.shortLabel}" için "${auditItem.rule.recommendedEntry}" envantere işlendi.`
    );
  };

  // Fix a single finding
  const handleApplyFindingFix = (finding: ComplianceFinding) => {
    if (!finding.autoFixPatch) return;
    onUpdateRecord(finding.autoFixPatch);
    showToast(
      'success',
      'Mevzuat Eksikliği Giderildi',
      `"${finding.title}" bulgusu KVKK standartlarına göre otomatik düzeltildi.`
    );
  };

  // Fix ALL retention & compliance issues in one click
  const handleAutoFixAll = () => {
    const fullPatch = buildFullComplianceAutoFixPatch(record);
    if (Object.keys(fullPatch).length === 0) {
      showToast('info', 'Tam Uyumlu', 'Envanterinizde düzeltilecek eksik süre veya mevzuat bulgusu kalmadı.');
      return;
    }
    onUpdateRecord(fullPatch);
    onSaveToDatabase();
    showToast(
      'success',
      'Tüm KVKK Süre ve Mevzuat Eksiklikleri Tamamlandı',
      'Yasal saklama periyotları, periyodik imha süresi ve güvenlik tedbirleri mevzuata uygun şekilde güncellendi.'
    );
  };

  // Export plain-text KVKK Audit Report
  const handleDownloadAuditReport = () => {
    const lines: string[] = [
      '================================================================================',
      '         6698 SAYILI KVKK VERİ İŞLEME VE SAKLAMA SÜRELERİ UYUM RAPORU          ',
      '================================================================================',
      `Şirket / Veri Sorumlusu : ${record.unvan || record.companyName || record.title}`,
      `Proje Kodu              : ${record.projectCode || 'PRJ-KVK'}`,
      `Denetim Tarihi          : ${new Date().toLocaleString('tr-TR')}`,
      `Genel KVKK Uyum Skoru   : %${report.overallScore} (${report.riskLevel})`,
      `Saklama Süresi Uyumu    : %${report.retentionScore} (${report.compliantRetentionCount}/${report.totalProcessedCategories} Kategori Uyumlu)`,
      `Periyodik İmha Süresi   : ${record.periyodikImhaSuresi || 'Belirtilmemiş'}`,
      '--------------------------------------------------------------------------------',
      '',
      '1. KİŞİSEL VERİ KATEGORİLERİ VE YASAL SAKLAMA PERİYOTLARI DENETİM TABLOSU:',
      '--------------------------------------------------------------------------------'
    ];

    report.retentionAudits.forEach((item, idx) => {
      const statusLabel =
        item.status === 'compliant'
          ? '[UYUMLU]'
          : item.status === 'missing_period'
            ? '[EKSİK SÜRE - KRİTİK]'
            : item.status === 'duration_mismatch'
              ? '[SÜRE UYUMSUZLUĞU]'
              : item.status === 'unprocessed_declared'
                ? '[İHTİYATİ TANIMLI]'
                : '[İŞLENMİYOR]';

      lines.push(`${idx + 1}. ${item.rule.categoryName}`);
      lines.push(`   Durum          : ${statusLabel}`);
      lines.push(`   Yasal Periyot  : ${item.rule.statutoryPeriodText}`);
      lines.push(`   Yasal Dayanak  : ${item.rule.legalBasis}`);
      lines.push(`   Beyan Edilen   : ${item.matchedRetentionLine || 'Tanımlanmamış'}`);
      lines.push(`   Denetim Notu   : ${item.findingMessage}`);
      lines.push('');
    });

    lines.push('--------------------------------------------------------------------------------');
    lines.push('2. GENEL KVKK MEVZUAT VE ENVANTER DENETİM BULGULARI:');
    lines.push('--------------------------------------------------------------------------------');

    report.findings.forEach((f, idx) => {
      const sev =
        f.severity === 'critical'
          ? 'KRİTİK EKSİKLİK'
          : f.severity === 'warning'
            ? 'UYARI / KISMİ EKSİKLİK'
            : 'MEVZUATA UYGUN';
      lines.push(`${idx + 1}. [${sev}] ${f.title}`);
      lines.push(`   Mevzuat Dayanağı : ${f.legalReference}`);
      lines.push(`   Mevcut Durum     : ${f.currentValueSummary}`);
      lines.push(`   Açıklama         : ${f.description}`);
      lines.push(`   Öneri            : ${f.recommendation}`);
      lines.push('');
    });

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KVKK_Uyum_Analiz_Raporu_${(record.projectCode || 'Envanter').replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('success', 'Denetim Raporu İndirildi', 'KVKK Uyum ve Saklama Süresi Analiz Raporu cihazınıza kaydedildi.');
  };

  const scoreColor =
    report.overallScore >= 85
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/15'
      : report.overallScore >= 65
        ? 'text-amber-300 border-amber-500/40 bg-amber-500/15'
        : 'text-rose-300 border-rose-500/40 bg-rose-500/15';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#102A1F] via-[#1B4332] to-[#2D6A4F] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-emerald-800/60 flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <Scale className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  KVKK MEVZUAT & SAKLAMA SÜRELERİ UYUM ANALİZİ
                </h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${scoreColor}`}>
                  %{report.overallScore} Uyum Skoru • {report.riskLevel}
                </span>
              </div>
              <p className="text-xs text-emerald-100/85 mt-0.5">
                6698 Sayılı KVKK, Silme-Yok Etme Yönetmeliği, TTK, TBK, İş Kanunu, İSG ve 5651 Sayılı Kanun Otomatik Denetim Motoru
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(report.criticalCount > 0 || report.warningCount > 0 || report.missingRetentionCount > 0) && (
              <button
                onClick={handleAutoFixAll}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Tüm Eksiklikleri Otomatik Tamamla</span>
              </button>
            )}

            <button
              onClick={handleDownloadAuditReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs rounded-xl transition-all"
            >
              <FileDown className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Denetim Raporu İndir</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition-colors"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 p-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Genel Uyum Skoru</p>
              <p className="text-2xl font-black text-[#1B4332] mt-0.5">%{report.overallScore}</p>
              <p className="text-[11px] text-slate-500">{report.riskLevel}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">İşlenen Veri Kategorisi</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">
                {report.compliantRetentionCount} / {report.totalProcessedCategories}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold">Yasal Süresi Tanımlı</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Eksik Saklama Süresi</p>
              <p className={`text-2xl font-black mt-0.5 ${report.missingRetentionCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {report.missingRetentionCount}
              </p>
              <p className="text-[11px] text-slate-500">Madde 28/29 vs Madde 36</p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.missingRetentionCount > 0 ? 'bg-rose-50 border border-rose-200 text-rose-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
              {report.missingRetentionCount > 0 ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Kritik Mevzuat Bulgusu</p>
              <p className={`text-2xl font-black mt-0.5 ${report.criticalCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {report.criticalCount}
              </p>
              <p className="text-[11px] text-slate-500">{report.warningCount} Uyarı / Öneri</p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.criticalCount > 0 ? 'bg-rose-50 border border-rose-200 text-rose-600' : 'bg-amber-50 border border-amber-200 text-amber-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between col-span-2 md:col-span-1">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Periyodik İmha (Md. 11)</p>
              <p className="text-sm font-black text-slate-800 mt-1 truncate max-w-[140px]" title={record.periyodikImhaSuresi}>
                {record.periyodikImhaSuresi ? (record.periyodikImhaSuresi.includes('6 Ay') || record.periyodikImhaSuresi.includes('3 Ay') ? '≤ 6 Ay (Uygun)' : 'Süre Aşımı Riski') : 'Tanımlanmamış'}
              </p>
              <p className="text-[11px] text-slate-500">Yasal Azami Sınır: 6 Ay</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <Scale className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('retention_matrix')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'retention_matrix'
                  ? 'border-[#1B4332] text-[#1B4332] bg-emerald-50/60 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Veri İşleme & Yasal Saklama Süreleri Denetimi ({report.retentionAudits.length})</span>
              {report.missingRetentionCount + report.mismatchRetentionCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-md">
                  {report.missingRetentionCount + report.mismatchRetentionCount} Eksik/Uyarı
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('findings')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'findings'
                  ? 'border-[#1B4332] text-[#1B4332] bg-emerald-50/60 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>KVKK Mevzuat & Envanter Bulguları ({report.findings.length})</span>
              {report.criticalCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-md">
                  {report.criticalCount} Kritik
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('legislation_guide')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'legislation_guide'
                  ? 'border-[#1B4332] text-[#1B4332] bg-emerald-50/60 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>KVKK Yasal Süre Cetveli & Mevzuat Dayanakları</span>
            </button>
          </div>

          {activeTab === 'retention_matrix' && (
            <div className="flex items-center gap-1 pb-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <button
                onClick={() => setMatrixFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                  matrixFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tümü ({report.retentionAudits.length})
              </button>
              <button
                onClick={() => setMatrixFilter('issues')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                  matrixFilter === 'issues' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Eksik & Uyumsuz ({report.missingRetentionCount + report.mismatchRetentionCount})
              </button>
              <button
                onClick={() => setMatrixFilter('processed')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                  matrixFilter === 'processed' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Envanterde İşlenenler ({report.totalProcessedCategories})
              </button>
              <button
                onClick={() => setMatrixFilter('special')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                  matrixFilter === 'special' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                Özel Nitelikli Veriler (4)
              </button>
            </div>
          )}
        </div>

        {/* Main Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/60">
          
          {/* TAB 1: RETENTION PERIOD MATRIX */}
          {activeTab === 'retention_matrix' && (
            <div className="space-y-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Info className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>
                    Envanter formunun <strong>28. ve 29. Maddelerinde</strong> seçilen kişisel veri kategorileri ile{' '}
                    <strong>36. Maddede</strong> beyan edilen saklama süreleri çapraz denetlenmektedir.
                  </span>
                </div>
                <span className="font-semibold text-slate-500">
                  Toplam {filteredAudits.length} veri kategorisi listeleniyor
                </span>
              </div>

              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-xs">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-left">
                      <th className="p-3 border-b border-slate-800">Veri Kategorisi</th>
                      <th className="p-3 border-b border-slate-800">Envanter Durumu</th>
                      <th className="p-3 border-b border-slate-800">Mevzuat Yasal Saklama Süresi & Dayanak</th>
                      <th className="p-3 border-b border-slate-800">Formda Beyan Edilen Süre (Madde 36)</th>
                      <th className="p-3 border-b border-slate-800">Uyum Analizi Sonucu</th>
                      <th className="p-3 border-b border-slate-800 text-right">Otomatik İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredAudits.map(item => {
                      const statusBadge =
                        item.status === 'compliant' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mevzuata Uygun
                          </span>
                        ) : item.status === 'missing_period' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Saklama Süresi Eksik
                          </span>
                        ) : item.status === 'duration_mismatch' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Süre Uyumsuzluğu
                          </span>
                        ) : item.status === 'unprocessed_declared' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            İhtiyati Süre Tanımlı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-slate-500 bg-slate-100">
                            İşlenmiyor
                          </span>
                        );

                      return (
                        <tr
                          key={item.rule.id}
                          className={`hover:bg-slate-50/90 transition-colors ${
                            item.status === 'missing_period'
                              ? 'bg-rose-50/40'
                              : item.status === 'duration_mismatch'
                                ? 'bg-amber-50/40'
                                : ''
                          }`}
                        >
                          <td className="p-3 align-top max-w-[230px]">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{item.rule.shortLabel}</span>
                              {item.rule.isSpecialCategory && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 border border-purple-300 rounded font-bold">
                                  Özel Nitelikli
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.rule.categoryName}</p>
                          </td>

                          <td className="p-3 align-top">
                            {item.isProcessedInInventory ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                <Check className="w-3 h-3" /> İşleniyor (Md. 28/29)
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Seçilmemiş</span>
                            )}
                          </td>

                          <td className="p-3 align-top max-w-[260px]">
                            <div className="font-bold text-[#1B4332]">{item.rule.statutoryPeriodText}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{item.rule.legalBasis}</div>
                          </td>

                          <td className="p-3 align-top max-w-[240px]">
                            {item.matchedRetentionLine ? (
                              <div className="text-slate-800 font-medium bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                {item.matchedRetentionLine}
                              </div>
                            ) : (
                              <span className="text-rose-600 font-semibold italic">
                                Süre tanımlanmamış
                              </span>
                            )}
                          </td>

                          <td className="p-3 align-top max-w-[250px]">
                            <div>{statusBadge}</div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">{item.findingMessage}</p>
                          </td>

                          <td className="p-3 align-top text-right">
                            {(item.status === 'missing_period' || item.status === 'duration_mismatch') ? (
                              <button
                                onClick={() => handleFixSingleRetention(item)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-[11px] rounded-lg shadow-xs transition-all"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>Yasal Süreyi Ekle</span>
                              </button>
                            ) : !item.isProcessedInInventory ? (
                              <button
                                onClick={() => handleFixSingleRetention(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-300 transition-all"
                              >
                                <span>Envantere Dahil Et</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Tamam
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: KVKK COMPLIANCE & LEGISLATION FINDINGS */}
          {activeTab === 'findings' && (
            <div className="space-y-3">
              {report.findings.map(finding => {
                const cardStyle =
                  finding.severity === 'critical'
                    ? 'border-rose-300 bg-rose-50/40'
                    : finding.severity === 'warning'
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-emerald-200 bg-white';

                const badgeStyle =
                  finding.severity === 'critical'
                    ? 'bg-rose-600 text-white'
                    : finding.severity === 'warning'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-600 text-white';

                const badgeLabel =
                  finding.severity === 'critical'
                    ? 'KRİTİK MEVZUAT EKSİKLİĞİ'
                    : finding.severity === 'warning'
                      ? 'UYARI / İYİLEŞTİRME GEREKLİ'
                      : 'KVKK MEVZUATINA UYGUN';

                return (
                  <div
                    key={finding.id}
                    className={`p-4 rounded-xl border-2 shadow-xs transition-all ${cardStyle}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            İlgili Maddeler: {finding.stepNumbers.map(n => `Madde ${n}`).join(', ')}
                          </span>
                          <span className="text-xs font-semibold text-[#1B4332] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                            {finding.legalReference}
                          </span>
                        </div>

                        <h3 className="text-sm font-extrabold text-slate-900">{finding.title}</h3>
                        <p className="text-xs text-slate-700 leading-relaxed">{finding.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 text-xs">
                          <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-500 block text-[10px] uppercase">
                              Envanterdeki Mevcut Durum:
                            </span>
                            <span className="font-semibold text-slate-800">{finding.currentValueSummary}</span>
                          </div>
                          <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200">
                            <span className="font-bold text-emerald-700 block text-[10px] uppercase">
                              KVKK Denetim Önerisi & Aksiyon:
                            </span>
                            <span className="text-slate-800">{finding.recommendation}</span>
                          </div>
                        </div>
                      </div>

                      {finding.autoFixAvailable && (
                        <button
                          onClick={() => handleApplyFindingFix(finding)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex-shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>{finding.autoFixLabel || 'Otomatik Düzelt'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: LEGISLATION GUIDE & STATUTORY TABLE */}
          {activeTab === 'legislation_guide' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1B4332] font-bold text-xs">
                    <Scale className="w-4 h-4" />
                    <span>KVKK Md. 4/2-ç (Süre Sınırlaması İlkesi)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kişisel veriler yalnızca <strong>ilgili mevzuatta öngörülen veya işlendikleri amaç için gerekli olan süre kadar</strong> muhafaza edilebilir. Süre bitiminde re'sen veya talep üzerine silinir, yok edilir veya anonim hale getirilir.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1B4332] font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>Yönetmelik Md. 11 (Azami 6 Ay Kuralı)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Periyodik imha süresi her hâlükârda <strong>6 ayı geçemez</strong>. Saklama süresi dolan kişisel veriler, takip eden ilk periyodik imha işleminde (Haziran ve Aralık sonu) imha edilir ve tutanakları <strong>3 yıl</strong> saklanır.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#1B4332] font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>Kurul 2018/10 Kararı (Özel Nitelikli Veri)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sağlık verileri İSG Kanunu gereği işten ayrılıştan itibaren <strong>15 yıl</strong> işyeri hekimi arşivinde saklanır; biyometrik veriler ise iş akdi bittiğinde <strong>derhal</strong> imha edilmelidir.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Türk Mevzuatında Kişisel Veri Saklama Süreleri Referans Cetveli
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  {report.retentionAudits.map(item => (
                    <div
                      key={item.rule.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">{item.rule.categoryName}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 whitespace-nowrap">
                          {item.rule.statutoryPeriodText}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        <strong>Dayanak:</strong> {item.rule.legalBasis}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        <strong>İmha Kuralı:</strong> {item.rule.destructionPolicyNote}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Bu analiz 6698 Sayılı KVKK ve Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik hükümlerine göre gerçek zamanlı üretilmiştir.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
