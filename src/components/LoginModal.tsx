import React, { useState, useEffect } from 'react';
import { 
  Building2, Lock, User as UserIcon, Shield, CheckCircle2, 
  AlertCircle, Sparkles, LogIn, UserPlus, ArrowRight, Check,
  KeyRound, Building, Cloud
} from 'lucide-react';
import { 
  loginUser, registerUser, getAllRegisteredCompanies, 
  INITIAL_DEFAULT_USERS, loginWithGoogleWorkspace, syncUsersFromBackend 
} from '../services/authService';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: User) => void;
  currentUser?: User | null;
  forceRequired?: boolean;
}

export function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  forceRequired = false
}: LoginModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [username, setUsername] = useState('ahmet');
  const [password, setPassword] = useState('123456');
  const [companyName, setCompanyName] = useState('Nova Bilişim ve Yazılım Teknolojileri Anonim Şirketi');
  const [customCompanyInput, setCustomCompanyInput] = useState('');
  const [isCustomCompany, setIsCustomCompany] = useState(false);

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');

  // Status & Error States
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [companiesList, setCompaniesList] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const comps = getAllRegisteredCompanies();
      setCompaniesList(comps);
      setError(null);
      setSuccessMsg(null);
      syncUsersFromBackend().then(() => {
        setCompaniesList(getAllRegisteredCompanies());
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleCloudLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    const selectedCompany = isCustomCompany ? customCompanyInput : companyName;
    const res = await loginWithGoogleWorkspace(selectedCompany);
    if (!res.success || !res.user) {
      setError(res.error || 'Google Bulut girişi yapılamadı.');
      return;
    }
    setSuccessMsg(`Google Bulut Hesabı ile "${res.user.companyName}" veritabanına bağlanıldı!`);
    setTimeout(() => {
      onLoginSuccess(res.user!);
    }, 400);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const selectedCompany = isCustomCompany ? customCompanyInput : companyName;

    if (!username.trim()) {
      setError('Lütfen kullanıcı adınızı veya e-posta adresinizi giriniz.');
      return;
    }
    if (!password) {
      setError('Lütfen şifrenizi giriniz.');
      return;
    }
    if (!selectedCompany.trim()) {
      setError('Lütfen bağlanmak istediğiniz şirket ismini seçiniz veya giriniz.');
      return;
    }

    const res = loginUser({
      usernameOrEmail: username,
      password: password,
      targetCompanyName: selectedCompany
    });

    if (!res.success || !res.user) {
      setError(res.error || 'Giriş başarısız oldu. Lütfen bilgilerinizi kontrol ediniz.');
      return;
    }

    setSuccessMsg(`Hoş geldiniz Sayın ${res.user.fullName}! "${res.user.companyName}" şirket veritabanına bağlanılıyor...`);
    setTimeout(() => {
      onLoginSuccess(res.user!);
    }, 450);
  };

  const handleQuickDemoLogin = (demoUser: typeof INITIAL_DEFAULT_USERS[0]) => {
    setUsername(demoUser.username);
    setPassword(demoUser.password || '123456');
    setCompanyName(demoUser.companyName);
    setIsCustomCompany(false);
    setError(null);

    const res = loginUser({
      usernameOrEmail: demoUser.username,
      password: demoUser.password || '123456',
      targetCompanyName: demoUser.companyName
    });

    if (res.success && res.user) {
      setSuccessMsg(`"${demoUser.companyName}" şirketine başarıyla giriş yapıldı.`);
      setTimeout(() => {
        onLoginSuccess(res.user!);
      }, 400);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regCompanyName.trim()) {
      setError('Lütfen şirketinizin resmi ünvanını giriniz.');
      return;
    }
    if (!regFullName.trim()) {
      setError('Lütfen yetkili adını ve soyadını giriniz.');
      return;
    }
    if (!regUsername.trim()) {
      setError('Lütfen bir kullanıcı adı belirleyiniz.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setError('Şifreniz en az 4 karakterden oluşmalıdır.');
      return;
    }

    const res = registerUser({
      fullName: regFullName,
      username: regUsername,
      email: regEmail,
      password: regPassword,
      companyName: regCompanyName
    });

    if (!res.success || !res.user) {
      setError(res.error || 'Kayıt işlemi gerçekleştirilemedi.');
      return;
    }

    setSuccessMsg(`Tebrikler! "${res.user.companyName}" şirketi ve yönetici hesabı oluşturuldu. Yönlendiriliyorsunuz...`);
    setTimeout(() => {
      onLoginSuccess(res.user!);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Dark Green KVKK Branding */}
        <div className="bg-gradient-to-r from-[#143427] via-[#1B4332] to-[#2D6A4F] text-white p-6 sm:p-7 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner flex-shrink-0">
              <Shield className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  KVKK Kurumsal Şirket Girişi
                </h2>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                  Şirket İzolasyonlu
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-1">
                Kullanıcı adı, şifre ve yetkili olduğunuz şirket ismi ile güvenli oturum açın.
              </p>
            </div>
          </div>

          {/* Close button if optional */}
          {!forceRequired && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-5 bg-black/20 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                tab === 'login' 
                  ? 'bg-emerald-500 text-[#143427] shadow-md' 
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Kullanıcı & Şirket Girişi
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                tab === 'register' 
                  ? 'bg-emerald-500 text-[#143427] shadow-md' 
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Yeni Şirket / Kullanıcı Kaydı
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5 bg-slate-50/50">

          {/* Quick Demo Login Cards (Visible on Login Tab) */}
          {tab === 'login' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Hızlı Demo Şirket Girişleri (Tek Tıkla Giriş):
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Şifre: 123456</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {INITIAL_DEFAULT_USERS.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(demo)}
                    className="p-2.5 bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-500 rounded-xl text-left transition-all group shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-800 truncate">
                          {demo.companyName.split(' ')[0]} {demo.companyName.split(' ')[1] || ''}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {demo.fullName}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded mt-2 inline-block self-start font-medium">
                      user: {demo.username}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Company Selection / Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    Bağlanılacak Şirket İsmi
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomCompany(!isCustomCompany)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold underline"
                  >
                    {isCustomCompany ? 'Listeden Seç' : 'Farklı Şirket Yaz'}
                  </button>
                </label>

                {!isCustomCompany ? (
                  <select
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 shadow-sm"
                  >
                    {companiesList.map((comp, idx) => (
                      <option key={idx} value={comp}>
                        {comp}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customCompanyInput}
                    onChange={e => setCustomCompanyInput(e.target.value)}
                    placeholder="Şirketinizin tam ünvanını yazınız..."
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 shadow-sm"
                  />
                )}
                <p className="text-[10px] text-slate-500">
                  * Kullanıcı sadece yetkili olduğu şirketin envanter ve veri kayıtlarına erişebilir.
                </p>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                  Kullanıcı Adı veya E-Posta
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Örn: ahmet veya ahmet@novabilisim.com"
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 shadow-sm"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  Şifre
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 shadow-sm"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] hover:from-[#143427] hover:to-[#1B4332] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4 text-emerald-300" />
                Şirket Veritabanına Güvenli Giriş Yap
              </button>

              {/* Google Cloud Auth Button */}
              <button
                type="button"
                onClick={handleGoogleCloudLogin}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Cloud className="w-4 h-4 text-blue-600" />
                <span>Google Hesabı ile Bulut Veritabanına Bağlan</span>
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  Şirket Resmi Ünvanı *
                </label>
                <input
                  type="text"
                  value={regCompanyName}
                  onChange={e => setRegCompanyName(e.target.value)}
                  placeholder="Örn: Yıldız Holding Bilişim ve Teknoloji A.Ş."
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 shadow-sm"
                  required
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                  Yetkili Adı ve Soyadı *
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="Örn: Ali Demir (KVK Yöneticisi)"
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 shadow-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                    Kullanıcı Adı *
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="Örn: alidemir"
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 shadow-sm"
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    Giriş Şifresi *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Kurumsal E-Posta Adresi (Opsiyonel)
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="kvk@sirketiniz.com"
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 shadow-sm"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                Şirket ve Yönetici Hesabını Oluştur
              </button>
            </form>
          )}

          {/* Footer Security Notice */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-600" />
              KVKK Madde 12 Veri Güvenliği Standartları
            </span>
            <span>256-bit Şirket İzolasyonu</span>
          </div>

        </div>
      </div>
    </div>
  );
}
