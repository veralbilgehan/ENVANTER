import { useState, useEffect, useCallback } from 'react';
import { InventoryRecord, User } from './types';
import { 
  getAllRecords, getRecordById, saveRecord, 
  deleteRecord, duplicateRecord, createNewEmptyRecord, 
  getActiveRecordId, setActiveRecordId, fetchAllRecordsFromBackendAndCloud 
} from './services/dbStorage';
import { 
  getActiveSession, logoutUser, INITIAL_DEFAULT_USERS, setActiveSession 
} from './services/authService';
import { Navbar } from './components/Navbar';
import { ChatAssistant } from './components/ChatAssistant';
import { LiveReport } from './components/LiveReport';
import { DatabaseModal } from './components/DatabaseModal';
import { TemplateModal } from './components/TemplateModal';
import { FastEditorModal } from './components/FastEditorModal';
import { LoginModal } from './components/LoginModal';
import { ComplianceAnalysisModal } from './components/ComplianceAnalysisModal';
import { RaciAnalyticsPanel } from './components/RaciAnalyticsPanel';
import { ToastContainer, ToastMessage } from './components/Toast';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = getActiveSession();
    return session ? session.user : INITIAL_DEFAULT_USERS[0];
  });
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<InventoryRecord | null>(null);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isFastEditorOpen, setIsFastEditorOpen] = useState<boolean>(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState<boolean>(false);
  const [isRaciModalOpen, setIsRaciModalOpen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'assistant' | 'split' | 'preview'>('split');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshRecordsList = useCallback((companyFilter?: string) => {
    const targetComp = companyFilter !== undefined ? companyFilter : (currentUser?.companyName || '');
    const all = getAllRecords(targetComp);
    setRecords(all);
    return all;
  }, [currentUser?.companyName]);

  // Initialize records and sync with backend + Cloud Firestore on mount or when user changes
  useEffect(() => {
    const company = currentUser?.companyName || '';
    const all = getAllRecords(company);
    setRecords(all);

    const activeId = getActiveRecordId();
    let current: InventoryRecord | null = null;
    if (activeId) {
      current = getRecordById(activeId);
      if (current && company && current.companyName && !current.companyName.toLowerCase().includes(company.toLowerCase()) && !company.toLowerCase().includes(current.companyName.toLowerCase())) {
        current = null;
      }
    }
    if (!current && all.length > 0) {
      current = all[0];
      setActiveRecordId(current.id);
    } else if (!current) {
      current = createNewEmptyRecord(currentUser?.companyName, currentUser?.username);
      saveRecord(current);
      setRecords([current]);
    }
    setActiveRecord(current);

    // Sync with Express Backend & Cloud Firestore in background
    fetchAllRecordsFromBackendAndCloud(company).then(synced => {
      if (synced && synced.length > 0) {
        setRecords(synced);
      }
    }).catch(() => {});
  }, [currentUser]);

  // Handle Login Success
  const handleLoginSuccess = useCallback((user: User) => {
    setCurrentUser(user);
    setIsLoginOpen(false);

    const companyRecords = getAllRecords(user.companyName);
    setRecords(companyRecords);

    let nextActive: InventoryRecord;
    if (companyRecords.length > 0) {
      nextActive = companyRecords[0];
    } else {
      nextActive = createNewEmptyRecord(user.companyName, user.username);
      saveRecord(nextActive, true);
      setRecords([nextActive]);
    }

    setActiveRecord(nextActive);
    setActiveRecordId(nextActive.id);

    showToast(
      'success',
      'Giriş Başarılı',
      `Sayın ${user.fullName}, "${user.companyName}" şirket çalışma alanına bağlandınız.`
    );
  }, [showToast]);

  // Switch or open a different Person / Company Workspace directly
  const handleSwitchWorkspace = useCallback((companyName: string, ownerName?: string) => {
    const cleanCompany = companyName.trim();
    const cleanOwner = (ownerName || currentUser?.fullName || 'Yetkili').trim();
    const cleanUsername = cleanOwner.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yetkili';

    const switchedUser: User = {
      id: currentUser?.id || `usr_${Date.now()}`,
      username: cleanUsername,
      email: currentUser?.email || `${cleanUsername}@sirket.com`,
      fullName: cleanOwner,
      companyName: cleanCompany,
      role: 'admin'
    };

    setActiveSession({
      user: switchedUser,
      token: `token_${Date.now()}`,
      loginTime: new Date().toISOString()
    });
    setCurrentUser(switchedUser);

    const companyRecords = getAllRecords(cleanCompany);
    let nextActive: InventoryRecord;
    if (companyRecords.length > 0) {
      nextActive = companyRecords[0];
      setRecords(companyRecords);
    } else {
      nextActive = createNewEmptyRecord(cleanCompany, cleanUsername);
      saveRecord(nextActive, true);
      setRecords([nextActive]);
    }

    setActiveRecord(nextActive);
    setActiveRecordId(nextActive.id);

    showToast('success', 'Çalışma Alanı Değiştirildi', `"${cleanCompany}" (${cleanOwner}) çalışma alanına geçiş yapıldı.`);
  }, [currentUser, showToast]);

  // Handle Logout
  const handleLogout = useCallback(() => {
    logoutUser();
    setCurrentUser(null);
    setIsLoginOpen(true);
    showToast('info', 'Oturum Kapatıldı', 'Şirket veritabanı oturumu güvenli şekilde kapatıldı.');
  }, [showToast]);

  // Update active record in state, local storage, and backend
  const handleUpdateRecord = useCallback((partial: Partial<InventoryRecord>) => {
    setActiveRecord(prev => {
      if (!prev) return prev;
      const updated: InventoryRecord = {
        ...prev,
        ...partial,
        companyName: currentUser?.companyName || prev.companyName || prev.unvan,
        ownerUsername: currentUser?.username || prev.ownerUsername,
        updatedAt: new Date().toISOString()
      };
      saveRecord(updated, false);
      refreshRecordsList();
      return updated;
    });
  }, [currentUser, refreshRecordsList]);

  // Explicit save to Cloud Firestore + Express Backend + Local Storage
  const handleSaveToDatabase = useCallback(() => {
    if (!activeRecord) return;
    setIsSaving(true);

    const updated = saveRecord({
      ...activeRecord,
      companyName: currentUser?.companyName || activeRecord.companyName || activeRecord.unvan,
      ownerUsername: currentUser?.username || activeRecord.ownerUsername,
      status: 'active'
    }, true);

    setActiveRecord(updated);
    refreshRecordsList();
    setIsSaving(false);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#D8F3DC']
      });
    } catch {
      // ignore
    }

    showToast(
      'success',
      'Veritabanına & Buluta Kaydedildi',
      `"${updated.unvan || updated.title}" kaydı "${currentUser?.companyName || 'Şirket'}" veritabanına kalıcı olarak işlendi.`
    );
  }, [activeRecord, currentUser, refreshRecordsList, showToast]);

  // Create fresh new record for current or specified company/person
  const handleCreateNewRecord = useCallback((customCompanyName?: string, customOwnerName?: string) => {
    const targetCompany = customCompanyName || currentUser?.companyName;
    const targetOwner = customOwnerName || currentUser?.username;
    const fresh = createNewEmptyRecord(targetCompany, targetOwner);
    saveRecord(fresh, true);
    setActiveRecord(fresh);
    refreshRecordsList(targetCompany);
    showToast('info', 'Yeni Form Başlatıldı', `"${targetCompany || 'Şirketiniz'}" için yeni 37 maddelik envanter formu açıldı.`);
  }, [currentUser, refreshRecordsList, showToast]);

  // Select record from database modal
  const handleSelectRecord = useCallback((record: InventoryRecord) => {
    setActiveRecord(record);
    setActiveRecordId(record.id);
    showToast('success', 'Form Yüklendi', `"${record.unvan || record.title}" çalışma alanına aktarıldı.`);
  }, [showToast]);

  // Delete record
  const handleDeleteRecord = useCallback((id: string) => {
    deleteRecord(id);
    refreshRecordsList();
    const activeId = getActiveRecordId();
    if (activeId) {
      setActiveRecord(getRecordById(activeId));
    }
  }, [refreshRecordsList]);

  // Duplicate record
  const handleDuplicateRecord = useCallback((id: string) => {
    const cloned = duplicateRecord(id);
    refreshRecordsList();
    if (cloned) {
      setActiveRecord(cloned);
    }
  }, [refreshRecordsList]);

  // Apply template
  const handleApplyTemplate = useCallback((template: InventoryRecord) => {
    const newFromTemplate: InventoryRecord = {
      ...JSON.parse(JSON.stringify(template)),
      id: `rec_${Date.now()}_tpl`,
      companyName: currentUser?.companyName || template.companyName,
      ownerUsername: currentUser?.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };
    saveRecord(newFromTemplate, true);
    setActiveRecord(newFromTemplate);
    refreshRecordsList();
    showToast('success', 'Hazır Şablon Yüklendi', `"${template.title}" başarıyla şirket çalışma alanınıza ve veritabanınıza uygulandı.`);
  }, [currentUser, refreshRecordsList, showToast]);

  if (!activeRecord) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Veritabanı Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#eef2f5] overflow-hidden text-slate-800 antialiased">
      
      {/* Top Application Bar */}
      <Navbar
        activeRecord={activeRecord}
        recordsCount={records.length}
        currentUser={currentUser}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenDatabase={() => setIsDatabaseOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenFastEditor={() => setIsFastEditorOpen(true)}
        onOpenCompliance={() => setIsComplianceOpen(true)}
        onOpenRaciModal={() => setIsRaciModalOpen(true)}
        onNewRecord={() => handleCreateNewRecord()}
        onSaveRecord={handleSaveToDatabase}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenFullscreenPreview={() => setIsFullscreenPreview(true)}
        isSaving={isSaving}
      />

      {/* Main Workspace: Left Chat Assistant + Right Live Report */}
      <main className="flex-1 p-2 md:p-4 overflow-hidden max-w-[1750px] w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 h-full">
          
          {/* Left Column: Chat Assistant */}
          <div className={`h-full flex flex-col min-h-0 ${
            activeView === 'preview' 
              ? 'hidden' 
              : activeView === 'assistant' 
                ? 'col-span-12' 
                : 'lg:col-span-5 h-[400px] lg:h-full'
          }`}>
            <ChatAssistant
              record={activeRecord}
              onUpdateRecord={handleUpdateRecord}
              onSaveToDatabase={handleSaveToDatabase}
              onOpenFastEditor={() => setIsFastEditorOpen(true)}
              onOpenPreview={() => setActiveView('preview')}
              onOpenCompliance={() => setIsComplianceOpen(true)}
            />
          </div>

          {/* Right Column: Live Report Preview & Document Exporter */}
          <div className={`h-full flex flex-col min-h-0 ${
            activeView === 'assistant' 
              ? 'hidden' 
              : activeView === 'preview' 
                ? 'col-span-12' 
                : 'lg:col-span-7 h-[550px] lg:h-full'
          }`}>
            <LiveReport
              record={activeRecord}
              onUpdateRecord={handleUpdateRecord}
              onSaveToDatabase={handleSaveToDatabase}
              onOpenFastEditor={() => setIsFastEditorOpen(true)}
              onOpenCompliance={() => setIsComplianceOpen(true)}
              onOpenRaciModal={() => setIsRaciModalOpen(true)}
              showToast={showToast}
              onToggleFullscreen={() => setIsFullscreenPreview(prev => !prev)}
              onClosePreview={activeView === 'preview' ? () => setActiveView('assistant') : undefined}
            />
          </div>

        </div>
      </main>

      {/* Fullscreen Preview Modal Overlay */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-1 sm:p-4 md:p-6 flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-full h-full max-w-[1600px] shadow-2xl rounded-2xl overflow-hidden">
            <LiveReport
              record={activeRecord}
              onUpdateRecord={handleUpdateRecord}
              onSaveToDatabase={handleSaveToDatabase}
              onOpenFastEditor={() => setIsFastEditorOpen(true)}
              onOpenCompliance={() => setIsComplianceOpen(true)}
              onOpenRaciModal={() => setIsRaciModalOpen(true)}
              showToast={showToast}
              isFullscreen={true}
              onToggleFullscreen={() => setIsFullscreenPreview(false)}
              onClosePreview={() => setIsFullscreenPreview(false)}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
        forceRequired={!currentUser}
      />

      <DatabaseModal
        isOpen={isDatabaseOpen}
        onClose={() => setIsDatabaseOpen(false)}
        records={records}
        activeRecordId={activeRecord.id}
        currentCompanyName={currentUser?.companyName}
        onSelectRecord={handleSelectRecord}
        onCreateNewRecord={handleCreateNewRecord}
        onDeleteRecord={handleDeleteRecord}
        onDuplicateRecord={handleDuplicateRecord}
        onRefreshRecords={refreshRecordsList}
        onSwitchWorkspace={handleSwitchWorkspace}
        showToast={showToast}
      />

      <TemplateModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      <FastEditorModal
        isOpen={isFastEditorOpen}
        onClose={() => setIsFastEditorOpen(false)}
        record={activeRecord}
        onSave={(updated) => {
          handleUpdateRecord(updated);
          showToast('success', 'Form Değişiklikleri Kaydedildi', 'Rapor ve veritabanı senkronize edildi.');
        }}
      />

      <ComplianceAnalysisModal
        isOpen={isComplianceOpen}
        onClose={() => setIsComplianceOpen(false)}
        record={activeRecord}
        onUpdateRecord={handleUpdateRecord}
        onSaveToDatabase={handleSaveToDatabase}
        showToast={showToast}
      />

      {isRaciModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm p-2 sm:p-5 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
            <RaciAnalyticsPanel
              record={activeRecord}
              onUpdateRecord={handleUpdateRecord}
              showToast={showToast}
              isModal={true}
              onCloseModal={() => setIsRaciModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Toast System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
