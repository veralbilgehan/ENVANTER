import React, { useState, useEffect, useRef } from 'react';
import { InventoryRecord, ChatMessage, StepConfig } from '../types';
import { 
  STEPS, POZISYON_HAVUZU, BIRIM_TASK_LIST, DEPARTMAN_TUR_LISTESI 
} from '../data/initialData';
import { 
  Send, Bot, Check, Plus, 
  RotateCcw, Sparkles, CheckCircle2, Save, Layers, ListOrdered, MessageSquare, 
  ChevronRight, Bookmark, Filter, Users, Building, Building2, CheckSquare, Square,
  ArrowRight, ArrowLeft, Edit3, ChevronLeft, Undo2, Eye, Scale
} from 'lucide-react';

interface ChatAssistantProps {
  record: InventoryRecord;
  onUpdateRecord: (partial: Partial<InventoryRecord>) => void;
  onSaveToDatabase: () => void;
  onOpenFastEditor: () => void;
  onOpenPreview?: () => void;
  onOpenCompliance?: () => void;
}

// Helper to ensure text ends with a period if non-empty
const ensurePeriod = (text: string): string => {
  const t = text ? text.trim() : '';
  if (!t) return '';
  if (['.', '!', '?', ':', ';'].some(char => t.endsWith(char))) {
    return t;
  }
  return `${t}.`;
};

export function ChatAssistant({
  record,
  onUpdateRecord,
  onSaveToDatabase,
  onOpenFastEditor,
  onOpenPreview,
  onOpenCompliance
}: ChatAssistantProps) {
  const [viewMode, setViewMode] = useState<'stepByStep' | 'allQuestions'>('stepByStep');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [customPositionInput, setCustomPositionInput] = useState<string>('');
  const [positionFilterLevel, setPositionFilterLevel] = useState<number | 'all'>('all');
  
  // Temporary state for current active interactive prompt
  const [tempPositions, setTempPositions] = useState<string[]>([]);
  const [tempCommitteeHead, setTempCommitteeHead] = useState<string>('');
  const [tempCommitteeMembers, setTempCommitteeMembers] = useState<string[]>([]);
  const [tempMultiSelect, setTempMultiSelect] = useState<string[]>([]);
  const [tempUnitTasks, setTempUnitTasks] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStep: StepConfig | undefined = STEPS[currentStepIndex];

  // Auto-focus input when moving to a new step or switching back to step-by-step view
  useEffect(() => {
    if (viewMode === 'stepByStep') {
      const timer = setTimeout(() => {
        if (!currentStep?.customType && inputRef.current) {
          inputRef.current.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, viewMode, currentStep?.customType]);

  // Initialize or synchronize assistant when record changes
  useEffect(() => {
    initConversation();
  }, [record.id]);

  const initConversation = () => {
    const initialMsgs: ChatMessage[] = [
      {
        id: 'msg_welcome',
        type: 'bot',
        timestamp: formatTime(),
        content: `
          <div class="font-bold text-sm text-[#1B4332] mb-1">👋 KVKK Görev & Envanter Asistanına Hoş Geldiniz!</div>
          <p class="text-xs text-slate-700 leading-relaxed">
            Bu asistan, <strong>1'den 37'ye kadar</strong> tüm soruları sırayla sorar ve başlıklar geldikçe ilgili bölümleri otomatik olarak ayırarak sağdaki canlı raporu dinamik olarak inşa eder.
          </p>
          <div class="mt-2 text-[11px] text-slate-600 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
            <strong>Kapsam:</strong> 7 Ana Bölüm, 37 Madde (Firma Bilgileri, Şemsiye Şeması, Komite, Birim Görevleri, Kayıt Ortamları, Güvenlik Tedbirleri, Veri Kategorileri, Saklama ve İmha Süreleri).
          </div>
        `
      }
    ];

    setMessages(initialMsgs);
    setCurrentStepIndex(0);
    loadStepPrompt(0, initialMsgs);
  };

  const formatTime = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Load question for step index
  const loadStepPrompt = (stepIdx: number, existingMsgs?: ChatMessage[]) => {
    if (stepIdx >= STEPS.length) {
      // Completed message
      const completedMsg: ChatMessage = {
        id: `msg_comp_${Date.now()}`,
        type: 'bot',
        timestamp: formatTime(),
        stepLabel: '✅ 37/37 TAMAMLANDI',
        interactiveType: 'completed',
        content: `
          <div class="font-bold text-emerald-900 text-sm mb-1">🎉 37 Sorunun Tamamı Başarıyla Tamamlandı!</div>
          <p class="text-xs text-slate-700">Şemsiye Şeması, Komite Yapısı, Birim Yetkileri, RACI Matrisi, Ortamlar ve Saklama-İmha detayları rapora işlendi.</p>
        `
      };
      setMessages(prev => [...(existingMsgs || prev), completedMsg]);
      scrollToBottom();
      return;
    }

    const step = STEPS[stepIdx];
    const prevStep = stepIdx > 0 ? STEPS[stepIdx - 1] : null;
    const isNewCategory = !prevStep || prevStep.category !== step.category;
    const stepLabel = `Soru ${step.id} / 37`;

    // Initialize temporary interactive buffers from current record
    if (step.customType === 'orgSelection') {
      const initialPositions = (record.selectedPositions && record.selectedPositions.length > 0)
        ? [...record.selectedPositions]
        : (tempPositions.length > 0 ? tempPositions : ['Genel Müdür / CEO', 'Direktör', 'Teknik / IT Müdürü', 'İnsan Kaynakları Müdürü', 'Finans ve Muhasebe Müdürü', 'Hukuk Müşaviri / Uyum Yöneticisi', 'KVK Sorumlusu / DPO', 'Sistem ve Ağ Uzmanı']);
      setTempPositions(initialPositions);
    } else if (step.customType === 'committeeSelection') {
      const positionsPool = (record.selectedPositions && record.selectedPositions.length > 0)
        ? record.selectedPositions
        : (tempPositions.length > 0 ? tempPositions : POZISYON_HAVUZU.map(p => p.unvan));
      
      setTempPositions([...positionsPool]);
      setTempCommitteeHead(record.komiteBaskani || positionsPool[0] || 'Genel Müdür / CEO');
      setTempCommitteeMembers(record.komiteUyeleri && record.komiteUyeleri.length > 0 
        ? [...record.komiteUyeleri] 
        : [positionsPool[1] || 'Teknik / IT Müdürü', positionsPool[2] || 'Hukuk Müşaviri / Uyum Yöneticisi', positionsPool[3] || 'İnsan Kaynakları Müdürü'].filter(Boolean)
      );
    } else if (step.customType === 'taskSelection') {
      const defaultTasks = BIRIM_TASK_LIST[step.key as string] || [];
      const existingTasks = record.birimSecilenGorevler?.[step.key as string] || defaultTasks;
      setTempUnitTasks([...existingTasks]);
    } else if (step.customType === 'multiSelect') {
      const existingRaw = (record[step.key as keyof InventoryRecord] as string) || '';
      let existingArr: string[] = [];
      if (existingRaw) {
        existingArr = existingRaw.split(/[;,]/).map(s => s.trim().replace(/\.$/, '')).filter(Boolean);
      } else {
        if (step.id === 9) {
          existingArr = [
            "Genel Müdürlük & İcra Kurulu",
            "Bilgi İşlem ve IT Departmanı",
            "İnsan Kaynakları (İK)",
            "Muhasebe ve Finans",
            "Hukuk Müşavirliği ve Mevzuat Uyum",
            "Satış ve Pazarlama"
          ];
        } else {
          existingArr = step.list ? step.list.slice(0, 5) : [];
        }
      }
      setTempMultiSelect([...existingArr]);
    }

    const msgsToAppend: ChatMessage[] = [];

    // If new category arrives, insert section title banner
    if (isNewCategory) {
      msgsToAppend.push({
        id: `cat_header_${step.categorySectionNumber}_${Date.now()}`,
        type: 'bot',
        timestamp: formatTime(),
        categoryHeader: step.category,
        content: `
          <div class="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wide">
            <span class="p-1 bg-emerald-600 text-white rounded text-[10px]">BÖLÜM ${step.categorySectionNumber}</span>
            <span>${step.category}</span>
          </div>
        `
      });
    }

    // Step Prompt
    msgsToAppend.push({
      id: `msg_step_${step.id}_${Date.now()}`,
      type: 'bot',
      timestamp: formatTime(),
      stepLabel,
      stepId: step.id,
      interactiveType: step.customType,
      content: getStepPromptContent(step)
    });

    setMessages(prev => [...(existingMsgs || prev), ...msgsToAppend]);
    scrollToBottom();
    setTimeout(() => {
      if (!step.customType && inputRef.current) {
        inputRef.current.focus();
      }
    }, 150);
  };

  const getStepPromptContent = (step: StepConfig) => {
    switch (step.customType) {
      case 'orgSelection':
        return `<strong>Soru ${step.id}: ${step.label}</strong><br/><span class="text-xs text-slate-600">Lütfen kurumunuzda yer alan unvan ve pozisyonları aşağıdaki butonlara tıklayarak belirleyin. Seçilen pozisyonlar ters şemsiye ve hiyerarşi şemasına aktarılacaktır:</span>`;
      case 'committeeSelection':
        return `<strong>Soru ${step.id}: ${step.label}</strong><br/><span class="text-xs text-slate-600">Kişisel Verileri Koruma Komitesi Başkanı ve Üyelerini belirleyin:</span>`;
      case 'taskSelection':
        return `<strong>Soru ${step.id}: ${step.label}</strong><br/><span class="text-xs text-slate-600">Bu birim için yetki ve görev tanımlarını seçin veya manuel ekleyin:</span>`;
      case 'multiSelect':
        if (step.id === 9) {
          return `<strong>Soru ${step.id}: ${step.label}</strong><br/><span class="text-xs text-slate-600">Kurumunuz bünyesinde bulunan departman ve birim türlerini aşağıdaki hazır listeden seçin veya özel birim adı ekleyin:</span>`;
        }
        return `<strong>Soru ${step.id}: ${step.label}</strong><br/><span class="text-xs text-slate-600">Kurumunuzda geçerli olan maddeleri işaretleyin veya manuel ekleyin:</span>`;
      default:
        return `<strong>Soru ${step.id}:</strong> Lütfen <strong>${step.label}</strong> bilgisini giriniz:<br/><span class="text-[11px] text-slate-500">${step.description || ''}</span>`;
    }
  };

  // Quick suggestions for text questions (1-9, 12-14) - 1 single standard suggestion per question
  const getQuickSuggestions = (stepId: number): string[] => {
    switch (stepId) {
      case 1:
        return ["Nova Bilişim ve Yazılım Teknolojileri Anonim Şirketi"];
      case 2:
        return ["Büyükdere Cad. Maslak No:142 Plaza Kat:8 Sarıyer / İstanbul"];
      case 3:
        return ["6320984712"];
      case 4:
        return ["Maslak Vergi Dairesi"];
      case 5:
        return ["0632098471200001"];
      case 6:
        return ["0212 345 67 89"];
      case 7:
        return ["kvkk@novabilisim.com.tr"];
      case 8:
        return ["Bulut Bilişim, SaaS Yazılım Geliştirme, Siber Güvenlik Danışmanlığı"];
      case 9:
        return ["Yazılım Geliştirme, Ürün Yönetimi, Bilgi Güvenliği, Satış & Pazarlama, İnsan Kaynakları, Hukuk, Finans"];
      case 12:
        return ["Ahmet Kemal Yılmaz (Yönetim Kurulu Başkanı & CEO)"];
      case 13:
        return [record.unvan || "Nova Bilişim ve Yazılım Teknolojileri Anonim Şirketi"];
      case 14:
        return ["Av. Elif Sönmez (Hukuk & Uyum Müdürü)"];
      default:
        return [];
    }
  };

  // User simple text submit
  const handleTextSubmit = (e?: React.FormEvent, directValue?: string) => {
    if (e) e.preventDefault();
    const rawVal = directValue !== undefined ? directValue.trim() : inputValue.trim();
    if (!rawVal || !currentStep) return;

    // Check if user is asking for preview ("ön izleme", "on izleme", "preview", etc.)
    const normalized = rawVal.toLowerCase()
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .trim();

    if (
      normalized === 'on izleme' || 
      normalized === 'onizleme' ||
      normalized === 'preview' ||
      normalized.includes('on izleme') ||
      normalized.includes('onizleme') ||
      normalized === 'rapor' ||
      normalized === 'raporu goster' ||
      normalized === 'raporu ac'
    ) {
      setInputValue('');
      if (onOpenPreview) {
        onOpenPreview();
      }
      const userMsg: ChatMessage = {
        id: `msg_user_${Date.now()}`,
        type: 'user',
        content: rawVal,
        timestamp: formatTime()
      };
      const botMsg: ChatMessage = {
        id: `msg_bot_preview_${Date.now()}`,
        type: 'bot',
        timestamp: formatTime(),
        content: `
          <div class="font-bold text-sm text-[#1B4332] mb-1">👁️ Canlı Ön İzleme Açıldı!</div>
          <p class="text-xs text-slate-700 leading-relaxed">
            37 maddelik KVKK Görev Tanımı ve Envanter Raporunuzun, Şemsiye Organizasyon Şemasının ve RACI Matrisinin güncel hali ön izleme panelinde gösterilmektedir.
          </p>
          <div class="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900">
            <strong>Kaldığınız Yer:</strong> Soru ${currentStep.id}: <em>${currentStep.label}</em>. İncelemenizi tamamladıktan sonra buradan devam edebilirsiniz.
          </div>
        `
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
      scrollToBottom();
      return;
    }

    const val = ensurePeriod(rawVal);

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      type: 'user',
      content: val,
      timestamp: formatTime()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Update record
    onUpdateRecord({ [currentStep.key]: val });

    // Proceed to next step
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    setTimeout(() => {
      loadStepPrompt(nextIdx);
    }, 200);
  };

  // Position presets for Step 10
  const handleSelectStandardPositions = () => {
    const standardList = [
      'Genel Müdür / CEO', 
      'Direktör', 
      'Teknik / IT Müdürü', 
      'İnsan Kaynakları Müdürü', 
      'Finans ve Muhasebe Müdürü', 
      'Hukuk Müşaviri / Uyum Yöneticisi', 
      'KVK Sorumlusu / DPO', 
      'Bilgi Güvenliği Uzmanı',
      'Sistem ve Ağ Uzmanı',
      'Operasyon / Ofis Personeli'
    ];
    setTempPositions(standardList);
  };

  const handleSelectKobiPositions = () => {
    const kobiList = [
      'Genel Müdür / CEO',
      'İnsan Kaynakları Müdürü',
      'Muhasebe Uzmanı',
      'Sistem ve Ağ Uzmanı',
      'Operasyon / Ofis Personeli'
    ];
    setTempPositions(kobiList);
  };

  const handleSelectAllPositions = () => {
    setTempPositions(POZISYON_HAVUZU.map(p => p.unvan));
  };

  const handleClearPositions = () => {
    setTempPositions([]);
  };

  const handleAddCustomPosition = () => {
    const trimmed = customPositionInput.trim();
    if (!trimmed) return;
    if (!tempPositions.includes(trimmed)) {
      setTempPositions(prev => [...prev, trimmed]);
      setCustomPositionInput('');
    }
  };

  // Committee presets for Step 11
  const handleSelectStandardCommittee = () => {
    setTempCommitteeHead('Genel Müdür / CEO');
    setTempCommitteeMembers([
      'Hukuk Müşaviri / Uyum Yöneticisi',
      'Teknik / IT Müdürü',
      'İnsan Kaynakları Müdürü',
      'KVK Sorumlusu / DPO'
    ]);
  };

  const handleSelectKobiCommittee = () => {
    setTempCommitteeHead('Genel Müdür / CEO');
    setTempCommitteeMembers([
      'İnsan Kaynakları Müdürü',
      'Muhasebe Uzmanı',
      'Sistem ve Ağ Uzmanı'
    ]);
  };

  const handleSelectAllCommittee = () => {
    const all = (tempPositions.length ? tempPositions : record.selectedPositions?.length ? record.selectedPositions : POZISYON_HAVUZU.map(p => p.unvan));
    setTempCommitteeHead(all[0] || 'Genel Müdür / CEO');
    setTempCommitteeMembers(all.slice(1));
  };

  const handleClearCommittee = () => {
    setTempCommitteeHead('');
    setTempCommitteeMembers([]);
  };

  // Task presets for Steps 15-19
  const handleSelectAllTasks = () => {
    if (!currentStep) return;
    const tasks = BIRIM_TASK_LIST[currentStep.key as string] || [];
    setTempUnitTasks([...tasks]);
  };

  const handleClearTasks = () => {
    setTempUnitTasks([]);
  };

  // Multi-select presets for Steps 9, 20-37
  const handleSelectAllMulti = () => {
    if (!currentStep?.list) return;
    setTempMultiSelect([...currentStep.list]);
  };

  const handleSelectDefaultMulti = () => {
    if (!currentStep?.list) return;
    if (currentStep.id === 9) {
      const standard = [
        "Genel Müdürlük & İcra Kurulu",
        "Bilgi İşlem ve IT Departmanı",
        "İnsan Kaynakları (İK)",
        "Muhasebe ve Finans",
        "Hukuk Müşavirliği ve Mevzuat Uyum",
        "Satış ve Pazarlama"
      ];
      setTempMultiSelect(standard.filter(s => currentStep.list?.includes(s)));
      return;
    }
    setTempMultiSelect(currentStep.list.slice(0, 5));
  };

  const handleClearMulti = () => {
    setTempMultiSelect([]);
  };

  // Save interactive step actions
  const handleSaveOrgSelection = () => {
    if (tempPositions.length === 0) {
      alert('Lütfen en az bir pozisyon seçin.');
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      type: 'user',
      content: `Organizasyon Şeması: ${tempPositions.length} pozisyon seçildi. (${tempPositions.join(', ')})`,
      timestamp: formatTime()
    };
    setMessages(prev => [...prev, userMsg]);

    onUpdateRecord({ selectedPositions: tempPositions });
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    setTimeout(() => loadStepPrompt(nextIdx), 200);
  };

  const handleSaveCommittee = () => {
    if (!tempCommitteeHead) {
      alert('Lütfen Komite Başkanı seçin.');
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      type: 'user',
      content: `Komite Başkanı: ${tempCommitteeHead}, Üyeler: ${tempCommitteeMembers.join(', ') || 'Yok'}`,
      timestamp: formatTime()
    };
    setMessages(prev => [...prev, userMsg]);

    onUpdateRecord({
      komiteBaskani: tempCommitteeHead,
      komiteUyeleri: tempCommitteeMembers
    });

    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    setTimeout(() => loadStepPrompt(nextIdx), 200);
  };

  const handleSaveTaskSelection = () => {
    if (!currentStep) return;
    const key = currentStep.key as string;
    const formattedTasks = tempUnitTasks.map(t => ensurePeriod(t));

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      type: 'user',
      content: `${currentStep.label}: ${formattedTasks.join('; ') || 'Görev tanımlanmadı.'}`,
      timestamp: formatTime()
    };
    setMessages(prev => [...prev, userMsg]);

    onUpdateRecord({
      birimSecilenGorevler: {
        ...record.birimSecilenGorevler,
        [key]: formattedTasks
      }
    });

    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    setTimeout(() => loadStepPrompt(nextIdx), 200);
  };

  const handleSaveMultiSelect = () => {
    if (!currentStep) return;
    const key = currentStep.key as keyof InventoryRecord;

    if (tempMultiSelect.length === 0) {
      alert('Lütfen en az bir seçenek belirleyin veya manuel ekleyin.');
      return;
    }

    const formattedList = tempMultiSelect.map(item => ensurePeriod(item));
    const combined = formattedList.join('; ');
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      type: 'user',
      content: `${currentStep.label}: ${formattedList.length} madde kaydedildi.`,
      timestamp: formatTime()
    };
    setMessages(prev => [...prev, userMsg]);

    onUpdateRecord({ [key]: combined });

    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    setTimeout(() => loadStepPrompt(nextIdx), 200);
  };

  const addManualItemToMulti = () => {
    const raw = manualInput.trim();
    if (!raw) return;
    const val = ensurePeriod(raw);
    if (!tempMultiSelect.includes(val)) {
      setTempMultiSelect(prev => [...prev, val]);
      setManualInput('');
    } else {
      alert('Bu öğe zaten listede bulunuyor.');
    }
  };

  const addManualItemToTask = () => {
    const raw = manualInput.trim();
    if (!raw) return;
    const val = ensurePeriod(raw);
    if (!tempUnitTasks.includes(val)) {
      setTempUnitTasks(prev => [...prev, val]);
      setManualInput('');
    } else {
      alert('Bu görev zaten seçili.');
    }
  };

  const jumpToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length) return;
    setCurrentStepIndex(index);
    setViewMode('stepByStep');

    const step = STEPS[index];
    if (!step.customType) {
      const existingVal = (record[step.key as keyof InventoryRecord] as string) || '';
      setInputValue(existingVal);
    } else if (step.customType === 'multiSelect') {
      const existingRaw = (record[step.key as keyof InventoryRecord] as string) || '';
      if (existingRaw) {
        const arr = existingRaw.split(/[;,]/).map(s => s.trim().replace(/\.$/, '')).filter(Boolean);
        setTempMultiSelect(arr);
      }
    } else if (step.customType === 'orgSelection') {
      if (record.selectedPositions && record.selectedPositions.length > 0) {
        setTempPositions([...record.selectedPositions]);
      }
    } else if (step.customType === 'committeeSelection') {
      if (record.komiteBaskani) setTempCommitteeHead(record.komiteBaskani);
      if (record.komiteUyeleri && record.komiteUyeleri.length > 0) {
        setTempCommitteeMembers([...record.komiteUyeleri]);
      }
    } else if (step.customType === 'taskSelection') {
      const existingTasks = record.birimSecilenGorevler?.[step.key as string];
      if (existingTasks && existingTasks.length > 0) {
        setTempUnitTasks([...existingTasks]);
      }
    }

    loadStepPrompt(index);
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      jumpToStep(currentStepIndex - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      jumpToStep(currentStepIndex + 1);
    }
  };

  // Helper to toggle item in multi-select for allQuestions form mode
  const handleToggleMultiInForm = (fieldKey: string, item: string) => {
    const itemWithPeriod = ensurePeriod(item);
    const itemClean = item.trim().replace(/\.$/, '');
    const currentVal = ((record[fieldKey as keyof InventoryRecord] as string) || '')
      .split(/[;,]/)
      .map(s => s.trim().replace(/\.$/, ''))
      .filter(Boolean);
    let updated: string[];
    if (currentVal.includes(itemClean) || currentVal.includes(itemWithPeriod)) {
      updated = currentVal.filter(x => x !== itemClean && x !== itemWithPeriod);
    } else {
      updated = [...currentVal, itemClean];
    }
    onUpdateRecord({ [fieldKey]: updated.map(x => ensurePeriod(x)).join('; ') });
  };

  // Helper to toggle task in form mode
  const handleToggleTaskInForm = (unitKey: string, task: string) => {
    const taskWithPeriod = ensurePeriod(task);
    const currentTasks = record.birimSecilenGorevler?.[unitKey] || [];
    let updated: string[];
    if (currentTasks.includes(taskWithPeriod) || currentTasks.includes(task)) {
      updated = currentTasks.filter(x => x !== taskWithPeriod && x !== task);
    } else {
      updated = [...currentTasks, taskWithPeriod];
    }
    onUpdateRecord({
      birimSecilenGorevler: {
        ...record.birimSecilenGorevler,
        [unitKey]: updated
      }
    });
  };

  const progressPercent = Math.min(100, Math.round(((currentStepIndex) / STEPS.length) * 100));

  // Filtered positions for step 10
  const filteredPositions = POZISYON_HAVUZU.filter(p => {
    if (positionFilterLevel === 'all') return true;
    if (positionFilterLevel === 1) return p.seviye === 1 || p.seviye === 2;
    if (positionFilterLevel === 3) return p.seviye === 3;
    if (positionFilterLevel === 4) return p.seviye === 4 || p.seviye === 5;
    if (positionFilterLevel === 6) return p.seviye === 6;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
      
      {/* Assistant Top Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
            <Bot className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-xs md:text-sm font-bold flex items-center gap-1.5">
              KVKK GÖREV & ENVANTER SİSTEMİ
            </h2>
            <p className="text-[10px] text-emerald-200">
              Soru {Math.min(currentStepIndex + 1, STEPS.length)} / {STEPS.length} ({progressPercent}%)
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Step Jump */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/20">
            <button
              onClick={() => setViewMode('stepByStep')}
              title="Adım Adım Sohbet Akışı"
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                viewMode === 'stepByStep' ? 'bg-white text-[#1B4332] shadow-sm' : 'text-emerald-100 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3 h-3" /> Asistan
            </button>
            <button
              onClick={() => setViewMode('allQuestions')}
              title="Tüm Soruları Alt Alta Göster (1-37)"
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                viewMode === 'allQuestions' ? 'bg-white text-[#1B4332] shadow-sm' : 'text-emerald-100 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3 h-3" /> Tüm Sorular (1-37)
            </button>
          </div>

          {viewMode === 'stepByStep' && (
            <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/20">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStepIndex <= 0}
                title="Önceki Soruya Geri Dön"
                className="px-2 py-1 text-white hover:bg-white/20 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-[11px] font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Geri</span>
              </button>

              <select
                value={currentStepIndex}
                onChange={(e) => jumpToStep(Number(e.target.value))}
                className="text-[11px] bg-emerald-950/80 text-white font-medium rounded px-2 py-1 focus:outline-none focus:bg-white focus:text-slate-800 transition-colors max-w-[130px] sm:max-w-[190px] truncate"
              >
                {STEPS.map((s, idx) => {
                  const isAnswered = Boolean(
                    record[s.key as keyof InventoryRecord] || 
                    (s.id === 10 && record.selectedPositions?.length) || 
                    (s.id === 11 && record.komiteUyeleri?.length)
                  );
                  return (
                    <option key={s.id} value={idx} className="text-slate-800">
                      {s.id}. {s.label} {isAnswered ? '✓' : ''}
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={currentStepIndex >= STEPS.length - 1}
                title="Sonraki Soruya Geç"
                className="px-2 py-1 text-white hover:bg-white/20 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-[11px] font-bold"
              >
                <span className="hidden sm:inline">İleri</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {onOpenCompliance && (
            <button
              type="button"
              onClick={onOpenCompliance}
              title="KVKK Mevzuat ve Yasal Saklama Süreleri Uyum Analizi"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-lg shadow-sm transition-all"
            >
              <Scale className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">KVKK Uyum</span>
            </button>
          )}

          {onOpenPreview && (
            <button
              type="button"
              onClick={onOpenPreview}
              title="Canlı Rapor ve Ön İzlemeyi Aç"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-[#102a1f] font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ön İzleme</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1 flex-shrink-0">
        <div 
          className="bg-emerald-600 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* VIEW MODE 1: STEP BY STEP ASSISTANT */}
      {viewMode === 'stepByStep' && (
        <>
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => {
              // If this is a category header banner
              if (msg.categoryHeader) {
                return (
                  <div key={msg.id} className="py-2.5 px-3 bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 border border-emerald-300/80 rounded-xl shadow-sm text-center animate-in fade-in slide-in-from-top-1">
                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.type === 'bot' ? 'items-start' : 'items-end'} animate-in fade-in-50 slide-in-from-bottom-1`}
                >
                  {/* Bubble */}
                  <div
                    className={`max-w-[95%] rounded-2xl p-3.5 text-xs md:text-sm leading-relaxed shadow-sm ${
                      msg.type === 'bot'
                        ? 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-sm'
                        : 'bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white rounded-br-sm font-medium'
                    }`}
                  >
                    {msg.type === 'bot' && (
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-slate-100 flex-wrap">
                        {msg.stepLabel ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                            {msg.stepLabel}
                          </span>
                        ) : <span />}
                        {msg.stepId && (
                          <button
                            type="button"
                            onClick={() => jumpToStep(msg.stepId! - 1)}
                            className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 hover:bg-[#1B4332] text-emerald-800 hover:text-white border border-emerald-300 rounded-md transition-all flex items-center gap-1 shadow-2xs cursor-pointer ml-auto"
                            title={`Soru ${msg.stepId}'i Düzelt ve Yeniden Düzenle`}
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>✏️ Bu Soruyu Düzelt</span>
                          </button>
                        )}
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />

                    {/* Interactive Controls Rendered Directly inside current Active Bot Bubble */}
                    {msg.id === messages[messages.length - 1]?.id && msg.type === 'bot' && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        
                        {/* TYPE: Org Selection (10. Soru: Şemsiye Modeli Pozisyon Seçimi) */}
                        {msg.interactiveType === 'orgSelection' && (
                          <div className="space-y-3">
                            
                            {/* Hızlı Şablon Butonları */}
                            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 space-y-2">
                              <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                Hızlı Kadro Şablon Butonları:
                              </span>
                              <div className="flex flex-col gap-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={handleSelectStandardPositions}
                                  className="w-full text-left text-[11px] px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-between"
                                >
                                  <span>⭐ Standart KVK Kadrosu (10 Pozisyon)</span>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSelectKobiPositions}
                                  className="w-full text-left text-[11px] px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-between"
                                >
                                  <span>🏢 KOBİ / Çekirdek Kadro (5 Pozisyon)</span>
                                  <Check className="w-3.5 h-3.5 text-teal-300" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSelectAllPositions}
                                  className="w-full text-left text-[11px] px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-between"
                                >
                                  <span>🌐 Tüm Pozisyonlar (17)</span>
                                  <Check className="w-3.5 h-3.5 text-slate-300" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleClearPositions}
                                  className="w-full text-left text-[11px] px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium rounded-lg transition-all"
                                >
                                  🗑️ Seçimleri Temizle
                                </button>
                              </div>
                            </div>

                            {/* Kademe Filtreleme Butonları */}
                            <div className="space-y-1.5 text-[10px]">
                              <span className="text-slate-600 font-bold flex items-center gap-1">
                                <Filter className="w-3 h-3 text-emerald-600" /> Kademe Filtreleri:
                              </span>
                              <div className="flex flex-col gap-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={() => setPositionFilterLevel('all')}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg font-bold transition-all flex items-center justify-between ${
                                    positionFilterLevel === 'all' 
                                      ? 'bg-slate-900 text-white shadow-sm' 
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  <span>Tüm Kademeler</span>
                                  {positionFilterLevel === 'all' && <Check className="w-3 h-3" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPositionFilterLevel(1)}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg font-bold transition-all flex items-center justify-between ${
                                    positionFilterLevel === 1 
                                      ? 'bg-amber-800 text-white shadow-sm' 
                                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                  }`}
                                >
                                  <span>K1-K2 (Üst Yönetim)</span>
                                  {positionFilterLevel === 1 && <Check className="w-3 h-3" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPositionFilterLevel(3)}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg font-bold transition-all flex items-center justify-between ${
                                    positionFilterLevel === 3 
                                      ? 'bg-blue-800 text-white shadow-sm' 
                                      : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                                  }`}
                                >
                                  <span>K3 (Müdürler)</span>
                                  {positionFilterLevel === 3 && <Check className="w-3 h-3" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPositionFilterLevel(4)}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg font-bold transition-all flex items-center justify-between ${
                                    positionFilterLevel === 4 
                                      ? 'bg-emerald-800 text-white shadow-sm' 
                                      : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                                  }`}
                                >
                                  <span>K4-K5 (Uzmanlar)</span>
                                  {positionFilterLevel === 4 && <Check className="w-3 h-3" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPositionFilterLevel(6)}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg font-bold transition-all flex items-center justify-between ${
                                    positionFilterLevel === 6 
                                      ? 'bg-purple-800 text-white shadow-sm' 
                                      : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                                  }`}
                                >
                                  <span>K6 (Operasyon)</span>
                                  {positionFilterLevel === 6 && <Check className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            {/* Pozisyon Butonları Listesi */}
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-800 block">
                                Pozisyonları Seçin ({tempPositions.length} Seçili):
                              </span>
                              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                                {filteredPositions.map(p => {
                                  const isSel = tempPositions.includes(p.unvan);
                                  return (
                                    <button
                                      key={p.unvan}
                                      type="button"
                                      onClick={() => {
                                        setTempPositions(prev => 
                                          isSel ? prev.filter(x => x !== p.unvan) : [...prev, p.unvan]
                                        );
                                      }}
                                      className={`w-full text-[11px] text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                                        isSel
                                          ? 'bg-[#1B4332] text-white border-[#1B4332] font-bold shadow-sm'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                                          isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          K{p.seviye}
                                        </span>
                                        <span>{p.unvan}</span>
                                      </div>
                                      {isSel ? <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" /> : <Plus className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Manuel Özel Pozisyon Ekle */}
                            <div className="space-y-2 pt-1">
                              <label className="text-[11px] font-bold text-slate-700 block">
                                Özel Pozisyon Ekle:
                              </label>
                              <input
                                type="text"
                                value={customPositionInput}
                                onChange={(e) => setCustomPositionInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomPosition(); } }}
                                placeholder="Özel unvan yazın (Örn: Veri Koruma Koordinatörü)..."
                                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomPosition}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                              >
                                + Pozisyon Ekle
                              </button>
                            </div>

                            {/* Seçilen Özeti & Onay Butonu */}
                            <div className="pt-1 flex gap-2">
                              <button
                                type="button"
                                onClick={handlePrevStep}
                                disabled={currentStepIndex <= 0}
                                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition-all disabled:opacity-40"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Geri</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveOrgSelection}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl transition-all shadow-md"
                              >
                                <Check className="w-4 h-4 text-emerald-300" /> 
                                <span>Seçilen {tempPositions.length} Pozisyonu Kaydet ve Soru 11'e Geç</span>
                              </button>
                            </div>

                          </div>
                        )}

                        {/* TYPE: Committee Selection (11. Soru) */}
                        {msg.interactiveType === 'committeeSelection' && (
                          <div className="space-y-3 text-xs">
                            {/* Hızlı Komite Şablon Butonları */}
                            <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 space-y-2">
                              <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                Hızlı Komite Şablon Butonları:
                              </span>
                              <div className="flex flex-col gap-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={handleSelectStandardCommittee}
                                  className="w-full text-left text-[11px] px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-between"
                                >
                                  <span>⭐ Standart KVK Komitesi (Bşk: GM + 4 Üye)</span>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSelectKobiCommittee}
                                  className="w-full text-left text-[11px] px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-between"
                                >
                                  <span>🏢 KOBİ Komitesi (Bşk: GM + 3 Üye)</span>
                                  <Check className="w-3.5 h-3.5 text-teal-300" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSelectAllCommittee}
                                  className="w-full text-left text-[11px] px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-between"
                                >
                                  <span>🌐 Tüm Kadro</span>
                                  <Check className="w-3.5 h-3.5 text-slate-300" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleClearCommittee}
                                  className="w-full text-left text-[11px] px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium rounded-lg transition-all"
                                >
                                  🗑️ Komite Seçimini Temizle
                                </button>
                              </div>
                            </div>

                            <div>
                              <span className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                1. Komite Başkanını Seçin: <span className="text-blue-700 font-extrabold">{tempCommitteeHead || 'Seçilmedi'}</span>
                              </span>
                              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                                {(tempPositions.length > 0 ? tempPositions : ((record.selectedPositions && record.selectedPositions.length > 0) ? record.selectedPositions : POZISYON_HAVUZU.map(p => p.unvan))).map(pos => {
                                  const isHead = tempCommitteeHead === pos;
                                  return (
                                    <button
                                      key={pos}
                                      type="button"
                                      onClick={() => setTempCommitteeHead(pos)}
                                      className={`w-full text-[11px] text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${
                                        isHead
                                          ? 'bg-blue-700 text-white font-bold border-blue-800 shadow-sm ring-2 ring-blue-400/40'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      <span>👑 {pos}</span>
                                      {isHead && <Check className="w-3.5 h-3.5 text-white" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <span className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                2. Komite Üyelerini Seçin ({tempCommitteeMembers.length} Üye Seçildi):
                              </span>
                              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                                {(tempPositions.length > 0 ? tempPositions : ((record.selectedPositions && record.selectedPositions.length > 0) ? record.selectedPositions : POZISYON_HAVUZU.map(p => p.unvan))).map(pos => {
                                  const isUye = tempCommitteeMembers.includes(pos);
                                  const isHead = tempCommitteeHead === pos;
                                  return (
                                    <button
                                      key={pos}
                                      type="button"
                                      onClick={() => {
                                        setTempCommitteeMembers(prev =>
                                          isUye ? prev.filter(x => x !== pos) : [...prev, pos]
                                        );
                                      }}
                                      className={`w-full text-[11px] text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${
                                        isUye
                                          ? 'bg-emerald-700 text-white font-bold border-emerald-800 shadow-sm'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{pos}</span>
                                        {isHead && <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">Başkan</span>}
                                      </div>
                                      {isUye ? <Check className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex gap-2 mt-2">
                              <button
                                type="button"
                                onClick={handlePrevStep}
                                disabled={currentStepIndex <= 0}
                                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition-all disabled:opacity-40"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Geri</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveCommittee}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl transition-all shadow-md"
                              >
                                <Check className="w-4 h-4 text-emerald-300" /> 
                                <span>Komiteyi Onayla (Bşk: {tempCommitteeHead || 'Genel Müdür'}, {tempCommitteeMembers.length} Üye) & Soru 12'ye Geç</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* TYPE: Unit Task Selection (15-19. Sorular) */}
                        {msg.interactiveType === 'taskSelection' && currentStep && (
                          <div className="space-y-3">
                            {/* Hızlı Butonlar */}
                            <div className="space-y-1.5 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                              <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                Hızlı Görev Şablon Butonları:
                              </span>
                              <div className="flex flex-col gap-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={handleSelectAllTasks}
                                  className="w-full text-left text-[11px] px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-between"
                                >
                                  <span>⭐ Tüm Görevleri Seç ({(BIRIM_TASK_LIST[currentStep.key as string] || []).length})</span>
                                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleClearTasks}
                                  className="w-full text-left text-[11px] px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium rounded-lg transition-all"
                                >
                                  🗑️ Görev Seçimlerini Temizle
                                </button>
                              </div>
                            </div>

                            {/* Görev Butonları */}
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-800 block">
                                Birim Görevlerini Seçin ({tempUnitTasks.length} Seçili):
                              </span>
                              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                                {(BIRIM_TASK_LIST[currentStep.key as string] || []).map(t => {
                                  const isSel = tempUnitTasks.includes(t);
                                  return (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => {
                                        setTempUnitTasks(prev =>
                                          isSel ? prev.filter(x => x !== t) : [...prev, t]
                                        );
                                      }}
                                      className={`w-full text-[11px] text-left px-3 py-2 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                                        isSel
                                          ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold shadow-sm'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      <span>{t}</span>
                                      {isSel ? <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0 mt-0.5" /> : <Plus className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Manual Task Adder */}
                            <div className="space-y-2 pt-1">
                              <label className="text-[11px] font-bold text-slate-700 block">
                                Özel Birim Görevi Ekle:
                              </label>
                              <input
                                type="text"
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualItemToTask(); } }}
                                placeholder="Özel birim görevi yazın..."
                                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white shadow-2xs"
                              />
                              <button
                                type="button"
                                onClick={addManualItemToTask}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                              >
                                + Görev Ekle
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handlePrevStep}
                                disabled={currentStepIndex <= 0}
                                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition-all disabled:opacity-40"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Geri</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveTaskSelection}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl transition-all shadow-md"
                              >
                                <Check className="w-4 h-4 text-emerald-300" /> 
                                <span>Seçilen {tempUnitTasks.length} Görevi Kaydet & Devam Et</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* TYPE: MultiSelect List (9. Soru ve 20-37. Sorular) */}
                        {msg.interactiveType === 'multiSelect' && currentStep && (
                          <div className="space-y-3">
                            {currentStep.id === 9 ? (
                              <div className="space-y-2.5">
                                {/* Input Alanı */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                      <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>Seçilen Departmanlar ({tempMultiSelect.length}):</span>
                                    </label>
                                  </div>
                                  <input
                                    type="text"
                                    readOnly
                                    value={tempMultiSelect.join('; ')}
                                    placeholder="Aşağıdaki butonlara tıklayarak departmanları seçin..."
                                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs font-medium"
                                  />
                                </div>

                                {/* DEPARTMAN BUTONLARI (INPUT'UN HEMEN ALTINDA) */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-600 block">
                                    Departman Butonları (Tıklayarak Ekleyin/Kaldırın):
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                                    {(currentStep.list || DEPARTMAN_TUR_LISTESI).map(item => {
                                      const itemClean = item.trim().replace(/\.$/, '');
                                      const isSel = tempMultiSelect.some(s => s.trim().replace(/\.$/, '') === itemClean);
                                      return (
                                        <button
                                          key={item}
                                          type="button"
                                          onClick={() => {
                                            setTempMultiSelect(prev =>
                                              isSel 
                                                ? prev.filter(x => x.trim().replace(/\.$/, '') !== itemClean) 
                                                : [...prev, item]
                                            );
                                          }}
                                          className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-medium shadow-2xs ${
                                            isSel
                                              ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold shadow-xs'
                                              : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                                          }`}
                                        >
                                          <span>{item}</span>
                                          {isSel ? <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" /> : <Plus className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Hızlı Butonlar */}
                                <div className="grid grid-cols-3 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={handleSelectAllMulti}
                                    className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-all text-center truncate"
                                  >
                                    🌐 Tümünü Seç
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSelectDefaultMulti}
                                    className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-all text-center truncate"
                                  >
                                    ⭐ Standart (6)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleClearMulti}
                                    className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg transition-all text-center truncate"
                                  >
                                    🗑️ Temizle
                                  </button>
                                </div>

                                {/* Manuel Departman Ekleme */}
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualItemToMulti(); } }}
                                    placeholder="Listede olmayan özel birim adı yazın..."
                                    className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none shadow-2xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={addManualItemToMulti}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                                  >
                                    + Ekle
                                  </button>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    disabled={currentStepIndex <= 0}
                                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition-all disabled:opacity-40"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Geri</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSaveMultiSelect}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl transition-all shadow-md"
                                  >
                                    <Check className="w-4 h-4 text-emerald-300" /> 
                                    <span>Seçilen {tempMultiSelect.length} Departmanı Kaydet ve Soru 10'a Geç</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {/* Hızlı Butonlar */}
                                <div className="space-y-1.5 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                                  <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                    Hızlı Seçim Butonları:
                                  </span>
                                  <div className="flex flex-col gap-1.5 w-full">
                                    <button
                                      type="button"
                                      onClick={handleSelectAllMulti}
                                      className="w-full text-left text-[11px] px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-between"
                                    >
                                      <span>🌐 Tümünü Seç ({(currentStep.list || []).length} Madde)</span>
                                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleSelectDefaultMulti}
                                      className="w-full text-left text-[11px] px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-between"
                                    >
                                      <span>⭐ Önerilen Standart Maddeleri Seç (5)</span>
                                      <Check className="w-3.5 h-3.5 text-teal-300" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleClearMulti}
                                      className="w-full text-left text-[11px] px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium rounded-lg transition-all"
                                    >
                                      🗑️ Seçimleri Temizle
                                    </button>
                                  </div>
                                </div>

                                {/* Liste Butonları */}
                                <div className="space-y-1.5">
                                  <span className="text-[11px] font-bold text-slate-800 block">
                                    Maddeleri Seçin ({tempMultiSelect.length} Seçili):
                                  </span>
                                  <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                                    {(currentStep.list || []).map(item => {
                                      const itemClean = item.trim().replace(/\.$/, '');
                                      const isSel = tempMultiSelect.some(s => s.trim().replace(/\.$/, '') === itemClean);
                                      return (
                                        <button
                                          key={item}
                                          type="button"
                                          onClick={() => {
                                            setTempMultiSelect(prev =>
                                              isSel 
                                                ? prev.filter(x => x.trim().replace(/\.$/, '') !== itemClean) 
                                                : [...prev, item]
                                            );
                                          }}
                                          className={`w-full text-[11px] text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                                            isSel
                                              ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold shadow-sm'
                                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                          }`}
                                        >
                                          <span>{item}</span>
                                          {isSel ? <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" /> : <Plus className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Manual Item Adder */}
                                <div className="space-y-2 pt-1">
                                  <label className="text-[11px] font-bold text-slate-700 block">
                                    Özel Madde Ekle:
                                  </label>
                                  <input
                                    type="text"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualItemToMulti(); } }}
                                    placeholder="Özel madde yazın..."
                                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white shadow-2xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={addManualItemToMulti}
                                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                                  >
                                    + Madde Ekle
                                  </button>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    disabled={currentStepIndex <= 0}
                                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition-all disabled:opacity-40"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Geri</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSaveMultiSelect}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl transition-all shadow-md"
                                  >
                                    <Check className="w-4 h-4 text-emerald-300" /> 
                                    <span>Seçilen {tempMultiSelect.length} Maddeyi Kaydet & Devam Et</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Direct One-Click Suggestion Buttons for Text Questions (1-9, 12, 13, 14 etc.) */}
                        {!msg.interactiveType && getQuickSuggestions(msg.stepId || currentStep?.id || 1).length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              Önerilen Hızlı Seçenek Butonu (Tıklayarak Cevaplayın):
                            </span>
                            <div className="flex flex-col gap-1.5 w-full">
                              {getQuickSuggestions(msg.stepId || currentStep?.id || 1).map((sug, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => {
                                    setInputValue(sug);
                                    handleTextSubmit(undefined, sug);
                                  }}
                                  className="w-full text-[11px] text-left px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl shadow-2xs transition-all font-medium flex items-center justify-between active:scale-[0.99]"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-emerald-700">👉</span>
                                    <span>{sug}</span>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Completed State Actions */}
                        {msg.interactiveType === 'completed' && (
                          <div className="space-y-2 pt-2">
                            <button
                              type="button"
                              onClick={onSaveToDatabase}
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                            >
                              <Save className="w-4 h-4" /> Raporu Veritabanına Kaydet
                            </button>
                          </div>
                        )}

                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 px-1">
                    <span>{msg.type === 'bot' ? 'Asistan' : 'Kullanıcı'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Strip for Text Questions (1 to 9) */}
          {currentStep && !currentStep.customType && getQuickSuggestions(currentStep.id).length > 0 && (
            <div className="px-3 py-2 bg-emerald-50/60 border-t border-emerald-100 flex flex-col gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Hızlı Örnek Seçenek Butonu:
              </span>
              <div className="flex flex-col gap-1 w-full">
                {getQuickSuggestions(currentStep.id).map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInputValue(sug);
                      handleTextSubmit(undefined, sug);
                    }}
                    className="w-full text-left text-[11px] px-3 py-1.5 bg-white hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-emerald-200 rounded-lg shadow-2xs transition-all font-medium flex items-center justify-between"
                  >
                    <span>{sug}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Floating Info Strip */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-800">
                Soru {currentStep?.id || 1} / 37
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 truncate">
                {currentStep?.category}
              </span>
            </div>

            <button
              onClick={onOpenFastEditor}
              className="flex items-center gap-1 text-emerald-800 hover:underline font-semibold self-start sm:self-auto"
            >
              <Layers className="w-3 h-3" /> Sekmeli Düzenleyici
            </button>
          </div>

          {/* Input & Action Area */}
          {currentStep?.customType ? (
            <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Adım {currentStep.id} Buton Kontrolü ({currentStep.label})
                </span>
                <span className="text-[10px] text-slate-400">
                  Seçimlerinizi yapıp aşağıdaki butonla ilerleyin
                </span>
              </div>

              {/* Step specific bottom bar buttons */}
              {currentStep.customType === 'orgSelection' && (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-700" />
                      <span>10. Organizasyon & Pozisyon Seçimi:</span>
                    </label>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                      {tempPositions.length} Pozisyon Seçili
                    </span>
                  </div>

                  {/* Pozisyonlar Input Alanı */}
                  <input
                    type="text"
                    readOnly
                    value={tempPositions.join('; ')}
                    placeholder="Aşağıdaki butonlara tıklayarak organizasyon pozisyonlarını seçin..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs font-medium"
                  />

                  {/* Kademe Filtre Butonları */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                      <span>Kademeye Göre Filtrele:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { level: null, label: 'Hepsi (26)' },
                        { level: 1, label: 'K1 (Üst Yönetim)' },
                        { level: 2, label: 'K2 (Direktör)' },
                        { level: 3, label: 'K3 (Müdür)' },
                        { level: 4, label: 'K4 (Yönetici)' },
                        { level: 5, label: 'K5 (Uzman)' },
                        { level: 6, label: 'K6 (Operasyon)' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setPositionFilterLevel(item.level)}
                          className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${
                            positionFilterLevel === item.level
                              ? 'bg-emerald-900 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* POZİSYON BUTONLARI (INPUT'UN HEMEN ALTINDA) */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                      <span>Pozisyon Butonları (Tıklayarak Ekleyin/Kaldırın):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {filteredPositions.map((pos) => {
                        const isSel = tempPositions.includes(pos.unvan);
                        return (
                          <button
                            key={pos.unvan}
                            type="button"
                            onClick={() => {
                              setTempPositions(prev =>
                                isSel ? prev.filter(x => x !== pos.unvan) : [...prev, pos.unvan]
                              );
                            }}
                            className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-medium shadow-2xs ${
                              isSel
                                ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                            }`}
                          >
                            <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                              K{pos.seviye}
                            </span>
                            <span>{pos.unvan}</span>
                            {isSel ? <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" /> : <Plus className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hızlı Şablon Butonları */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectStandardPositions}
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-all text-center truncate"
                    >
                      ⭐ Standart (10)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectKobiPositions}
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg transition-all text-center truncate"
                    >
                      🏢 KOBİ (5)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllPositions}
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-all text-center truncate"
                    >
                      🌐 Tümünü Seç (26)
                    </button>
                    <button
                      type="button"
                      onClick={handleClearPositions}
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg transition-all text-center truncate"
                    >
                      🗑️ Temizle
                    </button>
                  </div>

                  {/* Manuel Özel Pozisyon Ekleme */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customPositionInput}
                      onChange={(e) => setCustomPositionInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomPosition(); } }}
                      placeholder="Özel pozisyon/unvan yazın..."
                      className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomPosition}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                    >
                      + Ekle
                    </button>
                  </div>

                  {/* Onay & Devam Et Butonu */}
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={currentStepIndex <= 0}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition-all disabled:opacity-40"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Geri</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveOrgSelection}
                      className="flex-1 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Seçilen ({tempPositions.length}) Pozisyonu Kaydet ve Soru 11'e Geç</span>
                    </button>
                  </div>
                </div>
              )}

              {currentStep.customType === 'committeeSelection' && (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-700" />
                      <span>11. KVKK Komite Yapılandırması:</span>
                    </label>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                      Bşk: {tempCommitteeHead || 'Genel Müdür'} | {tempCommitteeMembers.length} Üye
                    </span>
                  </div>

                  {/* Komite Özeti Input Alanı */}
                  <input
                    type="text"
                    readOnly
                    value={`Başkan: ${tempCommitteeHead || 'Seçilmedi'} | Üyeler: ${tempCommitteeMembers.join(', ') || 'Belirlenmedi'}`}
                    placeholder="Aşağıdaki butonlardan başkan ve üyeleri belirleyin..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs font-medium"
                  />

                  {/* 1. KOMİTE BAŞKANI BUTONLARI */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-blue-900 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        1. Komite Başkanı Butonları (Tıklayarak Seçin):
                      </span>
                      <span className="text-blue-700 font-extrabold">{tempCommitteeHead || 'Seçilmedi'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-blue-50/50 border border-blue-200 rounded-xl">
                      {(tempPositions.length > 0 ? tempPositions : ((record.selectedPositions && record.selectedPositions.length > 0) ? record.selectedPositions : POZISYON_HAVUZU.map(p => p.unvan))).map((pos) => {
                        const isHead = tempCommitteeHead === pos;
                        return (
                          <button
                            key={`head_${pos}`}
                            type="button"
                            onClick={() => setTempCommitteeHead(pos)}
                            className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-medium shadow-2xs ${
                              isHead
                                ? 'bg-blue-700 text-white border-blue-800 font-bold shadow-xs ring-2 ring-blue-400/40'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            <span>👑 {pos}</span>
                            {isHead && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. KOMİTE ÜYELERİ BUTONLARI */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-emerald-950 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        2. Komite Üyeleri Butonları (Tıklayarak Ekleyin/Kaldırın):
                      </span>
                      <span className="text-emerald-800 font-extrabold">{tempCommitteeMembers.length} Üye Seçildi</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {(tempPositions.length > 0 ? tempPositions : ((record.selectedPositions && record.selectedPositions.length > 0) ? record.selectedPositions : POZISYON_HAVUZU.map(p => p.unvan))).map((pos) => {
                        const isUye = tempCommitteeMembers.includes(pos);
                        const isHead = tempCommitteeHead === pos;
                        return (
                          <button
                            key={`member_${pos}`}
                            type="button"
                            onClick={() => {
                              setTempCommitteeMembers(prev =>
                                isUye ? prev.filter(x => x !== pos) : [...prev, pos]
                              );
                            }}
                            className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-medium shadow-2xs ${
                              isUye
                                ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                            }`}
                          >
                            <span>{pos}</span>
                            {isHead && <span className="text-[9px] bg-blue-200 text-blue-950 px-1 py-0.2 rounded font-bold">Başkan</span>}
                            {isUye ? <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" /> : <Plus className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hızlı Şablon Butonları */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectStandardCommittee}
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-all text-center truncate"
                    >
                      ⭐ Standart (Bşk+4)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectKobiCommittee}
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg transition-all text-center truncate"
                    >
                      🏢 KOBİ (Bşk+3)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllCommittee}
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-all text-center truncate"
                    >
                      🌐 Tüm Kadro
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCommittee}
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg transition-all text-center truncate"
                    >
                      🗑️ Temizle
                    </button>
                  </div>

                  {/* Onay & Devam Et Butonu */}
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={currentStepIndex <= 0}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition-all disabled:opacity-40"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Geri</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCommittee}
                      className="flex-1 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Komiteyi Kaydet (Bşk: {tempCommitteeHead || 'Genel Müdür'}, {tempCommitteeMembers.length} Üye) & İlerle</span>
                    </button>
                  </div>
                </div>
              )}

              {currentStep.customType === 'taskSelection' && (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{currentStep.label}:</span>
                    </label>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                      {tempUnitTasks.length} Görev Seçili
                    </span>
                  </div>

                  {/* Görevler Input Alanı */}
                  <input
                    type="text"
                    readOnly
                    value={tempUnitTasks.join('; ')}
                    placeholder="Aşağıdaki butonlara tıklayarak birim görevlerini seçin..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs font-medium"
                  />

                  {/* BİRİM GÖREV BUTONLARI (INPUT'UN HEMEN ALTINDA) */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                      <span>Birim Görev Butonları (Tıklayarak Ekleyin/Kaldırın):</span>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {(BIRIM_TASK_LIST[currentStep.key as string] || []).map((task) => {
                        const isSel = tempUnitTasks.includes(task);
                        return (
                          <button
                            key={task}
                            type="button"
                            onClick={() => {
                              setTempUnitTasks(prev =>
                                isSel ? prev.filter(x => x !== task) : [...prev, task]
                              );
                            }}
                            className={`text-[11px] text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between gap-2 font-medium shadow-2xs ${
                              isSel
                                ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                            }`}
                          >
                            <span>{task}</span>
                            {isSel ? <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" /> : <Plus className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hızlı Şablon Butonları */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAllTasks}
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-all text-center truncate"
                    >
                      ⭐ Tüm Görevleri Seç
                    </button>
                    <button
                      type="button"
                      onClick={handleClearTasks}
                      className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg transition-all text-center truncate"
                    >
                      🗑️ Görev Seçimlerini Temizle
                    </button>
                  </div>

                  {/* Onay & Devam Et Butonu */}
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={currentStepIndex <= 0}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition-all disabled:opacity-40"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Geri</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTaskSelection}
                      className="flex-1 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Seçilen ({tempUnitTasks.length}) Görevi Kaydet & İlerle</span>
                    </button>
                  </div>
                </div>
              )}

              {currentStep.customType === 'multiSelect' && (
                <div className="flex flex-col gap-2 w-full">
                  {currentStep.id === 9 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>9. Departmanlar ve Birimler:</span>
                        </label>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                          {tempMultiSelect.length} Departman Seçili
                        </span>
                      </div>

                      {/* Departmanlar Input Alanı */}
                      <input
                        type="text"
                        readOnly
                        value={tempMultiSelect.join('; ')}
                        placeholder="Aşağıdaki butonlara tıklayarak departmanları seçin..."
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs font-medium"
                      />

                      {/* DEPARTMAN BUTONLARI (INPUT'UN HEMEN ALTINDA) */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                          <span>Departman Butonları (Tıklayarak Ekleyin/Kaldırın):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                          {(currentStep.list || DEPARTMAN_TUR_LISTESI).map((dep) => {
                            const depClean = dep.trim().replace(/\.$/, '');
                            const isSel = tempMultiSelect.some(s => s.trim().replace(/\.$/, '') === depClean);
                            return (
                              <button
                                key={dep}
                                type="button"
                                onClick={() => {
                                  setTempMultiSelect(prev =>
                                    isSel 
                                      ? prev.filter(x => x.trim().replace(/\.$/, '') !== depClean)
                                      : [...prev, dep]
                                  );
                                }}
                                className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-medium shadow-2xs ${
                                  isSel
                                    ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                                }`}
                              >
                                <span>{dep}</span>
                                {isSel ? <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" /> : <Plus className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hızlı Şablon Butonları */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={handleSelectAllMulti}
                          className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-all text-center truncate"
                        >
                          🌐 Tümünü Seç
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectDefaultMulti}
                          className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg transition-all text-center truncate"
                        >
                          ⭐ Standart (6)
                        </button>
                        <button
                          type="button"
                          onClick={handleClearMulti}
                          className="text-[10px] sm:text-[11px] font-semibold px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg transition-all text-center truncate"
                        >
                          🗑️ Temizle
                        </button>
                      </div>

                      {/* Manuel Departman Ekleme */}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={manualInput}
                          onChange={(e) => setManualInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualItemToMulti(); } }}
                          placeholder="Listede olmayan özel birim adı yazın..."
                          className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={addManualItemToMulti}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                        >
                          + Ekle
                        </button>
                      </div>

                      {/* Onay & Devam Et Butonu */}
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          disabled={currentStepIndex <= 0}
                          className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition-all disabled:opacity-40"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Geri</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveMultiSelect}
                          className="flex-1 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Seçilen ({tempMultiSelect.length}) Departmanı Kaydet ve Soru 10'a Geç</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Diğer MultiSelect Soruları İçin Buton Listesi & Butonlar */}
                      <div className="flex flex-col gap-1 max-h-36 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                        {(currentStep.list || []).map(item => {
                          const itemClean = item.trim().replace(/\.$/, '');
                          const isSel = tempMultiSelect.some(s => s.trim().replace(/\.$/, '') === itemClean);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => {
                                setTempMultiSelect(prev =>
                                  isSel 
                                    ? prev.filter(x => x.trim().replace(/\.$/, '') !== itemClean) 
                                    : [...prev, item]
                                );
                              }}
                              className={`w-full text-[11px] text-left px-3 py-1.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                                isSel
                                  ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span>{item}</span>
                              {isSel ? <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" /> : <Plus className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={handleSelectAllMulti}
                          className="text-[10px] font-semibold px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-all text-center truncate"
                        >
                          🌐 Tümünü Seç
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectDefaultMulti}
                          className="text-[10px] font-semibold px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg transition-all text-center truncate"
                        >
                          ⭐ Standart (5)
                        </button>
                        <button
                          type="button"
                          onClick={handleClearMulti}
                          className="text-[10px] font-semibold px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg transition-all text-center truncate"
                        >
                          🗑️ Temizle
                        </button>
                      </div>

                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          disabled={currentStepIndex <= 0}
                          className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-300 transition-all disabled:opacity-40"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Geri</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveMultiSelect}
                          className="flex-1 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Seçilen ({tempMultiSelect.length}) Maddeyi Kaydet & İlerle</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleTextSubmit} className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Soru {currentStep?.id}: {currentStep?.label}
                </label>
                {record[currentStep?.key as keyof InventoryRecord] && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Cevap Kayıtlı (Düzeltilebilir)
                  </span>
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`${currentStep?.label || 'Cevabınızı yazın'}...`}
                className="w-full px-4 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white shadow-2xs"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={currentStepIndex <= 0}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition-all disabled:opacity-40"
                  title="Önceki Soruya Geri Dön"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Geri</span>
                </button>
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  <span>Cevabı Kaydet & Devam Et</span>
                  <Send className="w-4 h-4" />
                </button>
                {onOpenPreview && (
                  <button
                    type="button"
                    onClick={onOpenPreview}
                    title="Canlı Ön İzleme Paneline Geç"
                    className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#1B4332] text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-emerald-300 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden sm:inline">Ön İzleme</span>
                  </button>
                )}
                {currentStepIndex < STEPS.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    title="Sonraki Soruya İlerle"
                    className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center gap-1"
                  >
                    <span>İleri</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>
          )}
        </>
      )}

      {/* VIEW MODE 2: ALL QUESTIONS VERTICALLY (1 TO 37 ALT ALTA) */}
      {viewMode === 'allQuestions' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/60">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
            <strong>📋 1'den 37'ye Kadar Tüm Sorular Alt Alta:</strong> Tüm alanları sırayla doldurabilir veya değiştirebilirsiniz. Yapılan değişiklikler sağdaki raporla anında senkronize olur.
          </div>

          {STEPS.map((step, idx) => {
            const prevStep = idx > 0 ? STEPS[idx - 1] : null;
            const isFirstOfCategory = !prevStep || prevStep.category !== step.category;

            return (
              <div key={step.id} className="space-y-3">
                {/* Category Header Banner between inputs */}
                {isFirstOfCategory && (
                  <div className="mt-4 pt-3 pb-2 border-b-2 border-emerald-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#1B4332] text-white text-[11px] font-bold rounded-md uppercase">
                        Bölüm {step.categorySectionNumber}
                      </span>
                      <h3 className="font-bold text-slate-800 text-xs md:text-sm uppercase tracking-wide">
                        {step.category}
                      </h3>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Adım {step.id} - {STEPS.filter(s => s.category === step.category).slice(-1)[0]?.id}
                    </span>
                  </div>
                )}

                {/* Question Input Card */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-emerald-300 transition-colors">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-200">
                        {step.id}
                      </span>
                      <label className="text-xs md:text-sm font-semibold text-slate-800">
                        {step.label}
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {step.description && (
                        <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                          {step.description}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('stepByStep');
                          jumpToStep(idx);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 hover:bg-[#1B4332] text-emerald-800 hover:text-white border border-emerald-300 rounded-md transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Bu soruyu asistanda aç ve adım adım düzelt"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>Asistanda Düzelt</span>
                      </button>
                    </div>
                  </div>

                  {/* Standard Text Input */}
                  {!step.customType && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={(record[step.key as keyof InventoryRecord] as string) || ''}
                        onChange={(e) => onUpdateRecord({ [step.key]: e.target.value })}
                        placeholder={`${step.label} giriniz...`}
                        className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all"
                      />
                      {getQuickSuggestions(step.id).length > 0 && (
                        <div className="flex flex-col gap-1 pt-0.5">
                          <span className="text-[10px] text-slate-500 font-bold">Örnek Seçenek Butonu:</span>
                          <div className="flex flex-col gap-1 w-full">
                            {getQuickSuggestions(step.id).map((sug, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => onUpdateRecord({ [step.key]: sug })}
                                className="w-full text-left text-[11px] px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-lg transition-all flex items-center justify-between"
                              >
                                <span>{sug}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Org Selection (Step 10) */}
                  {step.customType === 'orgSelection' && (
                    <div className="space-y-2 pt-1">
                      {/* Presets in All Questions View */}
                      <div className="flex flex-col gap-1.5 w-full">
                        <button
                          type="button"
                          onClick={() => {
                            const standardList = [
                              'Genel Müdür / CEO', 'Direktör', 'Teknik / IT Müdürü', 
                              'İnsan Kaynakları Müdürü', 'Finans ve Muhasebe Müdürü', 
                              'Hukuk Müşaviri / Uyum Yöneticisi', 'KVK Sorumlusu / DPO', 
                              'Bilgi Güvenliği Uzmanı', 'Sistem ve Ağ Uzmanı', 'Operasyon / Ofis Personeli'
                            ];
                            onUpdateRecord({ selectedPositions: standardList });
                          }}
                          className="w-full text-left text-[11px] px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-lg transition-all"
                        >
                          ⭐ Standart KVK Kadrosu (10 Pozisyon)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const kobiList = [
                              'Genel Müdür / CEO', 'İnsan Kaynakları Müdürü', 
                              'Muhasebe Uzmanı', 'Sistem ve Ağ Uzmanı', 'Operasyon / Ofis Personeli'
                            ];
                            onUpdateRecord({ selectedPositions: kobiList });
                          }}
                          className="w-full text-left text-[11px] px-3 py-2 bg-teal-100 hover:bg-teal-200 text-teal-900 font-bold rounded-lg transition-all"
                        >
                          🏢 KOBİ Kadrosu (5 Pozisyon)
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateRecord({ selectedPositions: POZISYON_HAVUZU.map(p => p.unvan) })}
                          className="w-full text-left text-[11px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-all"
                        >
                          🌐 Tüm Pozisyonları Seç (26)
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateRecord({ selectedPositions: [] })}
                          className="w-full text-left text-[11px] px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-medium rounded-lg transition-all"
                        >
                          🗑️ Pozisyon Seçimlerini Temizle
                        </button>
                      </div>

                      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                        {POZISYON_HAVUZU.map(p => {
                          const isSel = (record.selectedPositions || []).includes(p.unvan);
                          return (
                            <button
                              key={p.unvan}
                              type="button"
                              onClick={() => {
                                const list = record.selectedPositions || [];
                                const updated = isSel ? list.filter(x => x !== p.unvan) : [...list, p.unvan];
                                onUpdateRecord({ selectedPositions: updated });
                              }}
                              className={`w-full text-left text-[11px] px-3 py-2 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                                isSel
                                  ? 'bg-[#1B4332] text-white border-[#1B4332] font-bold shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                                  isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  K{p.seviye}
                                </span>
                                <span>{p.unvan}</span>
                              </div>
                              {isSel && <Check className="w-3.5 h-3.5 text-emerald-300" />}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-emerald-800 font-bold">
                        Seçilen: {(record.selectedPositions || []).length} unvan
                      </p>
                    </div>
                  )}

                  {/* Committee Selection (Step 11) */}
                  {step.customType === 'committeeSelection' && (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">Komite Başkanı:</label>
                        <select
                          value={record.komiteBaskani || ''}
                          onChange={(e) => onUpdateRecord({ komiteBaskani: e.target.value })}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600"
                        >
                          <option value="">Seçiniz...</option>
                          {((record.selectedPositions && record.selectedPositions.length > 0) ? record.selectedPositions : POZISYON_HAVUZU.map(p => p.unvan)).map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">Komite Üyeleri:</label>
                        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                          {((record.selectedPositions && record.selectedPositions.length > 0) ? record.selectedPositions : POZISYON_HAVUZU.map(p => p.unvan)).map(p => {
                            const isUye = (record.komiteUyeleri || []).includes(p);
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => {
                                  const list = record.komiteUyeleri || [];
                                  const updated = isUye ? list.filter(x => x !== p) : [...list, p];
                                  onUpdateRecord({ komiteUyeleri: updated });
                                }}
                                className={`w-full text-left text-[11px] px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${
                                  isUye ? 'bg-[#1B4332] text-white font-bold' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span>{p}</span>
                                {isUye && <Check className="w-3.5 h-3.5 text-emerald-300" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Task Selection (Steps 15-19) */}
                  {step.customType === 'taskSelection' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                        {(BIRIM_TASK_LIST[step.key as string] || []).map(t => {
                          const isSel = (record.birimSecilenGorevler?.[step.key as string] || []).includes(t);
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleToggleTaskInForm(step.key as string, t)}
                              className={`w-full text-left text-[11px] px-3 py-2 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                                isSel
                                  ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span>{t}</span>
                              {isSel && <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0 mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* MultiSelect (Steps 9, 20-37) */}
                  {step.customType === 'multiSelect' && (
                    <div className="space-y-2 pt-1">
                      {step.id === 9 ? (
                        <>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const standard = [
                                  "Genel Müdürlük & İcra Kurulu",
                                  "Bilgi İşlem ve IT Departmanı",
                                  "İnsan Kaynakları (İK)",
                                  "Muhasebe ve Finans",
                                  "Hukuk Müşavirliği ve Mevzuat Uyum",
                                  "Satış ve Pazarlama"
                                ];
                                onUpdateRecord({ departmanlar: standard.map(s => ensurePeriod(s)).join('; ') });
                              }}
                              className="text-[10px] font-bold px-2.5 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-900 rounded-lg transition-all"
                            >
                              ⭐ Standart Departmanlar (6)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateRecord({ departmanlar: (step.list || DEPARTMAN_TUR_LISTESI).map(s => ensurePeriod(s)).join('; ') });
                              }}
                              className="text-[10px] font-bold px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition-all"
                            >
                              🌐 Tüm Departmanları Seç (21)
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateRecord({ departmanlar: '' })}
                              className="text-[10px] font-bold px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg transition-all"
                            >
                              🗑️ Temizle
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                            {(step.list || DEPARTMAN_TUR_LISTESI).map(item => {
                              const itemClean = item.trim().replace(/\.$/, '');
                              const currentArr = ((record[step.key as keyof InventoryRecord] as string) || '')
                                .split(/[;,]/)
                                .map(s => s.trim().replace(/\.$/, ''))
                                .filter(Boolean);
                              const isSel = currentArr.includes(itemClean);
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => handleToggleMultiInForm(step.key as string, item)}
                                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-medium ${
                                    isSel
                                      ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold shadow-2xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>{item}</span>
                                  {isSel ? <Check className="w-3 h-3 text-emerald-300 flex-shrink-0" /> : <Plus className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                          {(step.list || []).map(item => {
                            const itemClean = item.trim().replace(/\.$/, '');
                            const currentArr = ((record[step.key as keyof InventoryRecord] as string) || '')
                              .split(/[;,]/)
                              .map(s => s.trim().replace(/\.$/, ''))
                              .filter(Boolean);
                            const isSel = currentArr.includes(itemClean);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => handleToggleMultiInForm(step.key as string, item)}
                                className={`w-full text-left text-[11px] px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${
                                  isSel
                                    ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span>{item}</span>
                                {isSel && <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {/* Form Bottom Save Button */}
          <div className="pt-4 pb-8">
            <button
              type="button"
              onClick={onSaveToDatabase}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl shadow-lg transition-all"
            >
              <Save className="w-4 h-4" /> 37 Maddelik Envanter & Raporu Veritabanına Kaydet
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
