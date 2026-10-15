import React, { useState, useMemo } from 'react';
import { InventoryRecord, RACIValue } from '../types';
import { SABIT_BIRIMLER, POZISYON_HAVUZU, BIRIM_TASK_LIST } from '../data/initialData';
import {
  BarChart3,
  Layers,
  Users,
  Building2,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw,
  Maximize2,
  X
} from 'lucide-react';

interface RaciAnalyticsPanelProps {
  record: InventoryRecord;
  onUpdateRecord: (partial: Partial<InventoryRecord>) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
  onOpenModal?: () => void;
}

export interface DepartmentMapping {
  deptId: string;
  deptName: string;
  unitKey: string;
  defaultManagerRole: string;
  matchedRoles: string[];
}

const RACI_META: Record<
  Exclude<RACIValue, ''>,
  { label: string; short: string; desc: string; bg: string; text: string; barColor: string; border: string }
> = {
  R: {
    label: 'Sorumlu (Responsible)',
    short: 'R · Yapan',
    desc: 'Görevi bizzat icra eden ve yürüten rol/birim',
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    barColor: 'bg-blue-600',
    border: 'border-blue-300'
  },
  A: {
    label: 'Onaylayan (Accountable)',
    short: 'A · Onaylayan',
    desc: 'Nihai hesap verebilir ve onay mercii olan tekil rol',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    barColor: 'bg-amber-500',
    border: 'border-amber-300'
  },
  C: {
    label: 'Danışılan (Consulted)',
    short: 'C · Danışılan',
    desc: 'Karar öncesi uzman görüşü alınan rol/birim',
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    barColor: 'bg-rose-500',
    border: 'border-rose-300'
  },
  I: {
    label: 'Bilgilendirilen (Informed)',
    short: 'I · Bilgilendirilen',
    desc: 'Süreç sonucu veya çıktısı hakkında bilgi verilen rol/birim',
    bg: 'bg-indigo-50',
    text: 'text-indigo-900',
    barColor: 'bg-indigo-500',
    border: 'border-indigo-300'
  }
};

/**
 * Maps any position title to one of the 5 core KVKK departments (or Operasyon/Diğer)
 */
function mapRoleToDepartmentId(roleTitle: string): string {
  const lower = roleTitle.toLowerCase();
  if (lower.includes('genel müdür') || lower.includes('ceo') || lower.includes('direktör')) {
    return 'genel_mudurluk';
  }
  if (lower.includes('insan kaynakları') || lower.includes('ik ')) {
    return 'insan_kaynaklari';
  }
  if (
    lower.includes('teknik') ||
    lower.includes('it ') ||
    lower.includes('bilgi') ||
    lower.includes('sistem')
  ) {
    return 'bilgi_islem';
  }
  if (lower.includes('finans') || lower.includes('muhasebe') || lower.includes('mali')) {
    return 'mali_isler';
  }
  if (
    lower.includes('hukuk') ||
    lower.includes('uyum') ||
    lower.includes('kvk') ||
    lower.includes('dpo')
  ) {
    return 'hukuk_uyum';
  }
  return 'operasyon_diger';
}

export function RaciAnalyticsPanel({
  record,
  onUpdateRecord,
  showToast,
  isModal = false,
  onCloseModal,
  onOpenModal
}: RaciAnalyticsPanelProps) {
  const [perspective, setPerspective] = useState<'role' | 'department'>('department');
  const [activeSubView, setActiveSubView] = useState<'split_all' | 'matrix_only' | 'chart_only' | 'dept_cards'>('split_all');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string | null>(null);
  const [selectedRaciFilter, setSelectedRaciFilter] = useState<RACIValue | 'ALL'>('ALL');
  const [newTaskText, setNewTaskText] = useState('');

  // Reverse roles (Bottom-up / Ters Şemsiye)
  const roles = useMemo(() => {
    const base = record.selectedPositions && record.selectedPositions.length > 0
      ? [...record.selectedPositions].reverse()
      : ['Operasyon / Ofis Personeli', 'KVK Sorumlusu / DPO', 'Hukuk Müşaviri / Uyum Yöneticisi', 'Finans ve Muhasebe Müdürü', 'Teknik / IT Müdürü', 'İnsan Kaynakları Müdürü', 'Genel Müdür / CEO'];
    return base;
  }, [record.selectedPositions]);

  // Core departments synthesized from inventory SABIT_BIRIMLER + selected roles
  const departments = useMemo((): DepartmentMapping[] => {
    const defs: DepartmentMapping[] = [
      {
        deptId: 'genel_mudurluk',
        deptName: 'Genel Müdürlük & Üst Yönetim',
        unitKey: 'yetkiGenelMudur',
        defaultManagerRole: 'Genel Müdür / CEO',
        matchedRoles: []
      },
      {
        deptId: 'insan_kaynaklari',
        deptName: 'İnsan Kaynakları (İK) & Özlük',
        unitKey: 'yetkiIKMudur',
        defaultManagerRole: 'İnsan Kaynakları Müdürü',
        matchedRoles: []
      },
      {
        deptId: 'bilgi_islem',
        deptName: 'Bilgi İşlem (IT) & Siber Güvenlik',
        unitKey: 'yetkiTeknik',
        defaultManagerRole: 'Teknik / IT Müdürü',
        matchedRoles: []
      },
      {
        deptId: 'mali_isler',
        deptName: 'Mali İşler, Finans & Muhasebe',
        unitKey: 'yetkiFinans',
        defaultManagerRole: 'Finans ve Muhasebe Müdürü',
        matchedRoles: []
      },
      {
        deptId: 'hukuk_uyum',
        deptName: 'Hukuk Müşavirliği & KVK Uyum',
        unitKey: 'yetkiHukuk',
        defaultManagerRole: 'Hukuk Müşaviri / Uyum Yöneticisi',
        matchedRoles: []
      },
      {
        deptId: 'operasyon_diger',
        deptName: 'Operasyon, Satış & İdari Birimler',
        unitKey: '',
        defaultManagerRole: 'Operasyon / Ofis Personeli',
        matchedRoles: []
      }
    ];

    roles.forEach(r => {
      const dId = mapRoleToDepartmentId(r);
      const target = defs.find(d => d.deptId === dId);
      if (target) target.matchedRoles.push(r);
    });

    return defs;
  }, [roles]);

  const tasks = useMemo(() => record.raciTasks || [], [record.raciTasks]);

  // Helper to get effective RACI value for a department on a task
  // Priority: R > A > C > I across the roles belonging to that department
  const getDepartmentRaciForTask = (taskIdx: number, dept: DepartmentMapping): RACIValue => {
    const priorityOrder: Exclude<RACIValue, ''>[] = ['R', 'A', 'C', 'I'];
    const rolesToCheck = dept.matchedRoles.length > 0 ? dept.matchedRoles : [dept.defaultManagerRole];
    const foundValues: RACIValue[] = rolesToCheck.map(
      r => record.raciValues?.[`${taskIdx}_${r}`] || ''
    );
    for (const p of priorityOrder) {
      if (foundValues.includes(p)) return p;
    }
    return '';
  };

  // Cycle RACI value on click
  const cycleRaciValue = (current: RACIValue): RACIValue => {
    const order: RACIValue[] = ['', 'R', 'A', 'C', 'I'];
    const idx = order.indexOf(current);
    return order[(idx + 1) % order.length];
  };

  const handleRoleCellClick = (taskIdx: number, role: string) => {
    const key = `${taskIdx}_${role}`;
    const current = record.raciValues?.[key] || '';
    const next = cycleRaciValue(current);
    onUpdateRecord({
      raciValues: {
        ...record.raciValues,
        [key]: next
      }
    });
  };

  const handleRoleSelectChange = (taskIdx: number, role: string, val: RACIValue) => {
    const key = `${taskIdx}_${role}`;
    onUpdateRecord({
      raciValues: {
        ...record.raciValues,
        [key]: val
      }
    });
  };

  const handleDepartmentCellClick = (taskIdx: number, dept: DepartmentMapping) => {
    const current = getDepartmentRaciForTask(taskIdx, dept);
    const next = cycleRaciValue(current);
    const targetRoles = dept.matchedRoles.length > 0 ? [dept.matchedRoles[0]] : [dept.defaultManagerRole];
    const updatedValues = { ...record.raciValues };
    // Clear other roles in same dept so the department has a clean value, and set primary role
    dept.matchedRoles.forEach(r => {
      updatedValues[`${taskIdx}_${r}`] = '';
    });
    targetRoles.forEach(r => {
      updatedValues[`${taskIdx}_${r}`] = next;
    });
    onUpdateRecord({ raciValues: updatedValues });
  };

  // Compute workload statistics per Role and per Department
  const workloadStats = useMemo(() => {
    const items =
      perspective === 'department'
        ? departments.map(d => {
            let R = 0;
            let A = 0;
            let C = 0;
            let I = 0;
            tasks.forEach((_, tIdx) => {
              const v = getDepartmentRaciForTask(tIdx, d);
              if (v === 'R') R++;
              else if (v === 'A') A++;
              else if (v === 'C') C++;
              else if (v === 'I') I++;
            });
            const unitTasks = d.unitKey ? record.birimSecilenGorevler?.[d.unitKey] || [] : [];
            return {
              id: d.deptId,
              name: d.deptName,
              subtitle: d.matchedRoles.length > 0 ? d.matchedRoles.join(', ') : d.defaultManagerRole,
              R,
              A,
              C,
              I,
              total: R + A + C + I,
              unitTasksCount: unitTasks.length,
              unitTasks
            };
          })
        : roles.map(r => {
            let R = 0;
            let A = 0;
            let C = 0;
            let I = 0;
            tasks.forEach((_, tIdx) => {
              const v = record.raciValues?.[`${tIdx}_${r}`] || '';
              if (v === 'R') R++;
              else if (v === 'A') A++;
              else if (v === 'C') C++;
              else if (v === 'I') I++;
            });
            const posInfo = POZISYON_HAVUZU.find(p => p.unvan === r);
            return {
              id: r,
              name: r,
              subtitle: posInfo ? `Kademe ${posInfo.seviye}` : 'Özel Pozisyon',
              R,
              A,
              C,
              I,
              total: R + A + C + I,
              unitTasksCount: 0,
              unitTasks: [] as string[]
            };
          });

    const maxTotal = Math.max(1, ...items.map(i => i.total));
    return { items, maxTotal };
  }, [perspective, departments, roles, tasks, record.raciValues, record.birimSecilenGorevler]);

  // Task-level Governance Health Check (Does each task have at least one R and one A?)
  const taskHealth = useMemo(() => {
    return tasks.map((task, tIdx) => {
      let rCount = 0;
      let aCount = 0;
      let cCount = 0;
      let iCount = 0;

      roles.forEach(r => {
        const v = record.raciValues?.[`${tIdx}_${r}`] || '';
        if (v === 'R') rCount++;
        else if (v === 'A') aCount++;
        else if (v === 'C') cCount++;
        else if (v === 'I') iCount++;
      });

      let status: 'healthy' | 'missing_r' | 'missing_a' | 'multiple_a' = 'healthy';
      let note = 'R ve A dengesi uygun';
      if (rCount === 0) {
        status = 'missing_r';
        note = 'Sorumlu (R) atanmamış!';
      } else if (aCount === 0) {
        status = 'missing_a';
        note = 'Onaylayan (A) atanmamış!';
      } else if (aCount > 1) {
        status = 'multiple_a';
        note = `${aCount} adet Onaylayan (A) var (Tekil olmalı)`;
      }

      return { taskIdx: tIdx, task, rCount, aCount, cCount, iCount, status, note };
    });
  }, [tasks, roles, record.raciValues]);

  // Sync Unit Tasks from Inventory (Steps 15-19) & Auto-Assign Smart RACI Values
  const handleSyncInventoryResponsibilitiesToRaci = () => {
    const existingTasks = [...(record.raciTasks || [])];
    const unitTaskMap = record.birimSecilenGorevler || BIRIM_TASK_LIST;

    // Collect key responsibilities from Steps 15-19 that aren't in raciTasks yet
    SABIT_BIRIMLER.forEach(unit => {
      const unitTasks = unitTaskMap[unit.key] || [];
      unitTasks.forEach(ut => {
        const exists = existingTasks.some(et => et.toLowerCase() === ut.toLowerCase());
        if (!exists) {
          existingTasks.push(ut);
        }
      });
    });

    // Smart RACI assignment based on task content & role hierarchy
    const updatedRaciValues: Record<string, RACIValue> = { ...(record.raciValues || {}) };

    existingTasks.forEach((taskText, tIdx) => {
      const lower = taskText.toLowerCase();

      // Determine which department is primarily Responsible (R) for this task
      let primaryDept: string = 'hukuk_uyum';
      if (
        lower.includes('ağ') ||
        lower.includes('sunucu') ||
        lower.includes('siber') ||
        lower.includes('şifrele') ||
        lower.includes('log') ||
        lower.includes('5651') ||
        lower.includes('yetki') ||
        lower.includes('ihlal')
      ) {
        primaryDept = 'bilgi_islem';
      } else if (
        lower.includes('özlük') ||
        lower.includes('personel') ||
        lower.includes('çalışan') ||
        lower.includes('eğitim') ||
        lower.includes('ik ')
      ) {
        primaryDept = 'insan_kaynaklari';
      } else if (
        lower.includes('mali') ||
        lower.includes('fatura') ||
        lower.includes('banka') ||
        lower.includes('iban') ||
        lower.includes('finans') ||
        lower.includes('bütçe')
      ) {
        primaryDept = 'mali_isler';
      } else if (
        lower.includes('onay') ||
        lower.includes('üst düzey') ||
        lower.includes('genel denetim')
      ) {
        primaryDept = 'genel_mudurluk';
      }

      let accountableAssigned = false;

      roles.forEach(role => {
        const rDept = mapRoleToDepartmentId(role);
        const key = `${tIdx}_${role}`;

        if (rDept === 'genel_mudurluk' && !accountableAssigned) {
          updatedRaciValues[key] = 'A';
          accountableAssigned = true;
        } else if (rDept === primaryDept) {
          updatedRaciValues[key] = 'R';
        } else if (rDept === 'hukuk_uyum') {
          updatedRaciValues[key] = 'C';
        } else if (rDept === 'operasyon_diger') {
          updatedRaciValues[key] = 'I';
        } else if (!updatedRaciValues[key]) {
          updatedRaciValues[key] = 'I';
        }
      });
    });

    onUpdateRecord({
      raciTasks: existingTasks,
      raciValues: updatedRaciValues
    });

    showToast(
      'success',
      'Envanter Sorumlulukları RACI Matrisine Aktarıldı',
      `Bölüm 3 (Maddeler 15-19) birim sorumlulukları matrise eklendi ve toplam ${existingTasks.length} görev için departman/rol RACI dağılımı oluşturuldu.`
    );
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const updated = [...tasks, newTaskText.trim()];
    onUpdateRecord({ raciTasks: updated });
    setNewTaskText('');
    showToast('success', 'RACI Görevi Eklendi', `"${newTaskText.trim()}" matrise eklendi.`);
  };

  const handleDeleteTask = (idx: number) => {
    const updated = tasks.filter((_, i) => i !== idx);
    onUpdateRecord({ raciTasks: updated });
  };

  // Filtered tasks based on selectedEntityFilter and selectedRaciFilter
  const filteredTaskIndices = useMemo(() => {
    return tasks
      .map((_, idx) => idx)
      .filter(tIdx => {
        if (!selectedEntityFilter && selectedRaciFilter === 'ALL') return true;

        if (perspective === 'department') {
          if (selectedEntityFilter) {
            const dept = departments.find(d => d.deptId === selectedEntityFilter);
            if (!dept) return true;
            const val = getDepartmentRaciForTask(tIdx, dept);
            if (selectedRaciFilter !== 'ALL') return val === selectedRaciFilter;
            return val !== '';
          } else if (selectedRaciFilter !== 'ALL') {
            return departments.some(d => getDepartmentRaciForTask(tIdx, d) === selectedRaciFilter);
          }
        } else {
          if (selectedEntityFilter) {
            const val = record.raciValues?.[`${tIdx}_${selectedEntityFilter}`] || '';
            if (selectedRaciFilter !== 'ALL') return val === selectedRaciFilter;
            return val !== '';
          } else if (selectedRaciFilter !== 'ALL') {
            return roles.some(r => (record.raciValues?.[`${tIdx}_${r}`] || '') === selectedRaciFilter);
          }
        }
        return true;
      });
  }, [tasks, selectedEntityFilter, selectedRaciFilter, perspective, departments, roles, record.raciValues]);

  // Overall RACI totals
  const totalCounts = useMemo(() => {
    let R = 0;
    let A = 0;
    let C = 0;
    let I = 0;
    workloadStats.items.forEach(item => {
      R += item.R;
      A += item.A;
      C += item.C;
      I += item.I;
    });
    const healthyTasks = taskHealth.filter(t => t.status === 'healthy').length;
    return { R, A, C, I, total: R + A + C + I, healthyTasks };
  }, [workloadStats, taskHealth]);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 ${isModal ? 'p-5 space-y-5' : 'p-4 space-y-4'}`}>
      
      {/* Header & Perspective Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1B4332]" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Departman ve Rol Bazlı Etkileşimli RACI Matrisi & Sorumluluk Analitiği
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Envanterin 10-19. maddelerindeki departman/rol sorumluluklarını R (Yapan), A (Onaylayan), C (Danışılan), I (Bilgilendirilen) olarak özetler. Hücrelere tıklayarak rol değiştirebilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap print:hidden">
          {/* Perspective Switcher: Departman Bazlı vs Rol/Unvan Bazlı */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setPerspective('department');
                setSelectedEntityFilter(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                perspective === 'department'
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Departman Bazlı Özet</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPerspective('role');
                setSelectedEntityFilter(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                perspective === 'role'
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Rol / Unvan Bazlı ({roles.length})</span>
            </button>
          </div>

          {/* Sync from Inventory Responsibilities (Steps 15-19) */}
          <button
            type="button"
            onClick={handleSyncInventoryResponsibilitiesToRaci}
            title="Envanterdeki (Madde 15-19) birim görevlerini RACI matrisine aktar ve otomatik dağıt"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-lg shadow-xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Envanter Görevlerini Matrise Senkronize Et</span>
          </button>

          {onOpenModal && !isModal && (
            <button
              type="button"
              onClick={onOpenModal}
              title="Tam ekran etkileşimli RACI analitik görünümünü aç"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Büyüt</span>
            </button>
          )}

          {isModal && onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation & RACI Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveSubView('split_all')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              activeSubView === 'split_all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Grafik + Etkileşimli Tablo
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('chart_only')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              activeSubView === 'chart_only' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Yük Dağılım Grafiği
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('matrix_only')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              activeSubView === 'matrix_only' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Etkileşimli RACI Tablosu
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('dept_cards')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              activeSubView === 'dept_cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Departman Sorumluluk Özeti (Md. 15-19)
          </button>
        </div>

        {/* R / A / C / I Interactive Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500">Rol Tipi Filtresi:</span>
          <button
            type="button"
            onClick={() => setSelectedRaciFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
              selectedRaciFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tümü ({totalCounts.total})
          </button>
          {(['R', 'A', 'C', 'I'] as const).map(code => (
            <button
              key={code}
              type="button"
              onClick={() => setSelectedRaciFilter(prev => (prev === code ? 'ALL' : code))}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                selectedRaciFilter === code
                  ? `${RACI_META[code].barColor} text-white border-transparent shadow-xs`
                  : `${RACI_META[code].bg} ${RACI_META[code].text} ${RACI_META[code].border}`
              }`}
            >
              {RACI_META[code].short} ({totalCounts[code]})
            </button>
          ))}

          {selectedEntityFilter && (
            <button
              type="button"
              onClick={() => setSelectedEntityFilter(null)}
              className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
            >
              Filtreyi Temizle ✕
            </button>
          )}
        </div>
      </div>

      {/* SECTION A: INTERACTIVE WORKLOAD DISTRIBUTION BAR CHART */}
      {(activeSubView === 'split_all' || activeSubView === 'chart_only') && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                {perspective === 'department'
                  ? 'Departman Bazlı RACI Sorumluluk ve İş Yükü Dağılım Grafiği'
                  : 'Organizasyon Rol / Unvan Bazlı RACI İş Yükü Dağılım Grafiği'}
              </h4>
              <p className="text-[11px] text-slate-500">
                 Bir departman veya role tıklayarak aşağıdaki matrisi sadece o birimin görevlerine göre filtreleyebilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" /> R: Yapan ({totalCounts.R})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> A: Onaylayan ({totalCounts.A})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> C: Danışılan ({totalCounts.C})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" /> I: Bilgilendirilen ({totalCounts.I})
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {workloadStats.items.map(item => {
              const isSelected = selectedEntityFilter === item.id;
              const rPct = (item.R / workloadStats.maxTotal) * 100;
              const aPct = (item.A / workloadStats.maxTotal) * 100;
              const cPct = (item.C / workloadStats.maxTotal) * 100;
              const iPct = (item.I / workloadStats.maxTotal) * 100;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedEntityFilter(prev => (prev === item.id ? null : item.id))}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/80 border-[#1B4332] ring-1 ring-[#1B4332]'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-slate-900 truncate">{item.name}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-[11px] text-slate-500 truncate">{item.subtitle}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <span className="text-blue-700">R: {item.R}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-amber-700">A: {item.A}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-rose-700">C: {item.C}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-indigo-700">I: {item.I}</span>
                      <span className="text-slate-300">|</span>
                      <span className="font-bold text-slate-800">Toplam: {item.total} Görev</span>
                    </div>
                  </div>

                  {/* Stacked Horizontal Bar */}
                  <div className="w-full h-5 bg-slate-100 rounded-md overflow-hidden flex border border-slate-200/80">
                    {item.R > 0 && (
                      <div
                        style={{ width: `${rPct}%` }}
                        title={`${item.name} - Sorumlu (R): ${item.R} Görev`}
                        className="bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center transition-all duration-300"
                      >
                        {rPct > 6 ? `R:${item.R}` : ''}
                      </div>
                    )}
                    {item.A > 0 && (
                      <div
                        style={{ width: `${aPct}%` }}
                        title={`${item.name} - Onaylayan (A): ${item.A} Görev`}
                        className="bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center transition-all duration-300"
                      >
                        {aPct > 6 ? `A:${item.A}` : ''}
                      </div>
                    )}
                    {item.C > 0 && (
                      <div
                        style={{ width: `${cPct}%` }}
                        title={`${item.name} - Danışılan (C): ${item.C} Görev`}
                        className="bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center transition-all duration-300"
                      >
                        {cPct > 6 ? `C:${item.C}` : ''}
                      </div>
                    )}
                    {item.I > 0 && (
                      <div
                        style={{ width: `${iPct}%` }}
                        title={`${item.name} - Bilgilendirilen (I): ${item.I} Görev`}
                        className="bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center transition-all duration-300"
                      >
                        {iPct > 6 ? `I:${item.I}` : ''}
                      </div>
                    )}
                    {item.total === 0 && (
                      <div className="w-full flex items-center px-2 text-[10px] text-slate-400 italic">
                        Henüz RACI rolü atanmamış
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION B: INTERACTIVE RACI MATRIX TABLE (DEPARTMENT OR ROLE BASED) */}
      {(activeSubView === 'split_all' || activeSubView === 'matrix_only') && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-xs">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#1B4332] text-white">
                  <th className="p-2.5 border border-[#2D6A4F] text-left min-w-[230px]">
                    KVKK Envanter ve Süreç Görev Tanımı ({filteredTaskIndices.length}/{tasks.length})
                  </th>
                  {perspective === 'department'
                    ? departments.map(dept => (
                        <th
                          key={dept.deptId}
                          onClick={() =>
                            setSelectedEntityFilter(prev => (prev === dept.deptId ? null : dept.deptId))
                          }
                          className={`p-2 border border-[#2D6A4F] text-center min-w-[115px] cursor-pointer transition-colors ${
                            selectedEntityFilter === dept.deptId ? 'bg-amber-500 text-slate-950' : 'hover:bg-[#2D6A4F]'
                          }`}
                        >
                          <div className="font-bold leading-tight">{dept.deptName}</div>
                          <div className="text-[10px] font-normal opacity-80 mt-0.5">
                            {dept.matchedRoles.length} Rol
                          </div>
                        </th>
                      ))
                    : roles.map(role => (
                        <th
                          key={role}
                          onClick={() => setSelectedEntityFilter(prev => (prev === role ? null : role))}
                          className={`p-2 border border-[#2D6A4F] text-center min-w-[95px] cursor-pointer transition-colors ${
                            selectedEntityFilter === role ? 'bg-amber-500 text-slate-950' : 'hover:bg-[#2D6A4F]'
                          }`}
                        >
                          {role}
                        </th>
                      ))}
                  <th className="p-2 border border-[#2D6A4F] text-center min-w-[125px]">
                    Yönetişim Kontrolü
                  </th>
                  <th className="p-2 border border-[#2D6A4F] text-center w-10 print:hidden">Sil</th>
                </tr>
              </thead>
              <tbody>
                {filteredTaskIndices.map(taskIdx => {
                  const task = tasks[taskIdx];
                  const health = taskHealth[taskIdx];

                  return (
                    <tr key={taskIdx} className="hover:bg-slate-50 border-b border-slate-200">
                      <td className="p-2.5 border border-slate-300 font-semibold bg-emerald-50/40 text-slate-900">
                        <span className="text-slate-400 font-mono mr-1.5">{taskIdx + 1}.</span>
                        {task}
                      </td>

                      {perspective === 'department'
                        ? departments.map(dept => {
                            const val = getDepartmentRaciForTask(taskIdx, dept);
                            const meta = val ? RACI_META[val] : null;
                            return (
                              <td
                                key={dept.deptId}
                                onClick={() => handleDepartmentCellClick(taskIdx, dept)}
                                title="Tıklayarak R -> A -> C -> I arasında geçiş yapın"
                                className={`p-1.5 border border-slate-300 text-center cursor-pointer select-none transition-colors ${
                                  meta ? `${meta.bg} ${meta.text} font-bold` : 'hover:bg-slate-100 text-slate-400'
                                }`}
                              >
                                {meta ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="text-xs font-black">{val}</span>
                                    <span className="text-[9px] font-medium opacity-85">{meta.short.split('·')[1]}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs">-</span>
                                )}
                              </td>
                            );
                          })
                        : roles.map(role => {
                            const cellKey = `${taskIdx}_${role}`;
                            const val = record.raciValues?.[cellKey] || '';
                            const meta = val ? RACI_META[val] : null;

                            return (
                              <td
                                key={role}
                                className={`p-1 border border-slate-300 text-center transition-colors ${
                                  meta ? `${meta.bg} ${meta.text} font-bold` : ''
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleRoleCellClick(taskIdx, role)}
                                    title="Hızlı değiştirmek için tıklayın"
                                    className="w-6 h-6 rounded text-xs font-black hover:bg-black/5 flex items-center justify-center"
                                  >
                                    {val || '-'}
                                  </button>
                                  <select
                                    value={val}
                                    onChange={e =>
                                      handleRoleSelectChange(taskIdx, role, e.target.value as RACIValue)
                                    }
                                    aria-label={`${task} - ${role} RACI seçimi`}
                                    className="text-[10px] p-0.5 bg-transparent border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 print:hidden"
                                  >
                                    <option value="">-</option>
                                    <option value="R">R</option>
                                    <option value="A">A</option>
                                    <option value="C">C</option>
                                    <option value="I">I</option>
                                  </select>
                                </div>
                              </td>
                            );
                          })}

                      {/* Governance Health Cell */}
                      <td className="p-2 border border-slate-300 text-center">
                        {health?.status === 'healthy' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>R:{health.rCount} · A:{health.aCount}</span>
                          </span>
                        ) : (
                          <span
                            title={health?.note}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span>{health?.note}</span>
                          </span>
                        )}
                      </td>

                      <td className="p-1 border border-slate-300 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(taskIdx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Görevi sil"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Custom RACI Task Row */}
          <div className="flex items-center gap-2 pt-1 print:hidden">
            <input
              type="text"
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTask();
              }}
              placeholder="Matrise yeni süreç veya envanter görevi ekleyin..."
              className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <button
              type="button"
              onClick={handleAddTask}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Görev Ekle
            </button>
          </div>
        </div>
      )}

      {/* SECTION C: DEPARTMENT RESPONSIBILITY CARDS (SYNTHESIZING STEPS 15-19 + RACI) */}
      {(activeSubView === 'dept_cards' || (isModal && activeSubView === 'split_all')) && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              Birim Görev Dağılımı (Maddeler 15-19) ve RACI Sorumluluk Kartları
            </h4>
            <span className="text-[11px] text-slate-500">
              Envanterdeki birim görevleri ile RACI matrisi sorumluluklarının birleşik özeti
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map(dept => {
              const unitTasks = dept.unitKey ? record.birimSecilenGorevler?.[dept.unitKey] || [] : [];
              const rTasks: string[] = [];
              const aTasks: string[] = [];

              tasks.forEach((t, tIdx) => {
                const v = getDepartmentRaciForTask(tIdx, dept);
                if (v === 'R') rTasks.push(t);
                if (v === 'A') aTasks.push(t);
              });

              return (
                <div
                  key={dept.deptId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="border-b border-slate-200 pb-2">
                      <h5 className="text-xs font-extrabold text-[#1B4332]">{dept.deptName}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Roller: {dept.matchedRoles.length > 0 ? dept.matchedRoles.join(', ') : dept.defaultManagerRole}
                      </p>
                    </div>

                    {unitTasks.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Envanter Birim Görevleri (Madde 15-19):
                        </p>
                        <ul className="space-y-1 text-[11px] text-slate-700 list-disc list-inside">
                          {unitTasks.map((ut, idx) => (
                            <li key={idx} className="leading-snug">
                              {ut}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rTasks.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-blue-800 uppercase mb-1">
                          R · Doğrudan İcra Ettiği RACI Süreçleri ({rTasks.length}):
                        </p>
                        <ul className="space-y-1 text-[11px] text-slate-700 list-disc list-inside">
                          {rTasks.map((rt, idx) => (
                            <li key={idx} className="leading-snug">
                              {rt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aTasks.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-amber-800 uppercase mb-1">
                          A · Onay Mercii Olduğu Süreçler ({aTasks.length}):
                        </p>
                        <ul className="space-y-1 text-[11px] text-slate-700 list-disc list-inside">
                          {aTasks.map((at, idx) => (
                            <li key={idx} className="leading-snug">
                              {at}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Birim Görevi: {unitTasks.length}</span>
                    <span>·</span>
                    <span>R (Yapan): {rTasks.length}</span>
                    <span>·</span>
                    <span>A (Onay): {aTasks.length}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
