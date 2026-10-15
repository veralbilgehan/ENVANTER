import { User, AuthSession } from '../types';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, doc, getDoc, setDoc, 
  serverTimestamp, handleFirestoreError, OperationType 
} from '../firebase';

const USERS_STORAGE_KEY = 'kvkk_registered_users_v1';
const SESSION_STORAGE_KEY = 'kvkk_active_auth_session_v1';

export const INITIAL_DEFAULT_USERS: User[] = [
  {
    id: 'usr_nova_01',
    username: 'ahmet',
    email: 'ahmet@novabilisim.com',
    fullName: 'Ahmet Kemal Yılmaz',
    companyName: 'Nova Bilişim ve Yazılım Teknolojileri Anonim Şirketi',
    role: 'admin',
    password: '123456',
    phone: '0212 345 67 89'
  },
  {
    id: 'usr_atlas_02',
    username: 'mehmet',
    email: 'mehmet@atlas.com',
    fullName: 'Mehmet Kaya',
    companyName: 'Atlas İmalat ve Sanayi Ticaret Limited Şirketi',
    role: 'admin',
    password: '123456',
    phone: '0216 456 78 90'
  },
  {
    id: 'usr_avrasya_03',
    username: 'zeynep',
    email: 'zeynep@avrasya.com',
    fullName: 'Zeynep Aktaş',
    companyName: 'Avrasya Lojistik ve Taşımacılık Hizmetleri A.Ş.',
    role: 'admin',
    password: '123456',
    phone: '0232 567 89 01'
  }
];

export function getAllRegisteredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_USERS));
      return INITIAL_DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_DEFAULT_USERS;
  } catch {
    return INITIAL_DEFAULT_USERS;
  }
}

export async function syncUsersFromBackend(): Promise<User[]> {
  try {
    const res = await fetch('/api/workspaces');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.users) && data.users.length > 0) {
        const local = getAllRegisteredUsers();
        const map = new Map<string, User>(local.map(u => [u.username.toLowerCase(), u]));
        data.users.forEach((u: User) => {
          const existing = map.get(u.username.toLowerCase());
          map.set(u.username.toLowerCase(), { ...u, password: existing?.password || '123456' });
        });
        const merged = Array.from(map.values());
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch {
    // ignore offline error
  }
  return getAllRegisteredUsers();
}

export function getActiveSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (session && session.user && session.user.companyName) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

export function setActiveSession(session: AuthSession | null): void {
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export function getAllRegisteredCompanies(): string[] {
  const users = getAllRegisteredUsers();
  const companies = new Set<string>();
  users.forEach(u => {
    if (u.companyName && u.companyName.trim()) {
      companies.add(u.companyName.trim());
    }
  });
  return Array.from(companies);
}

export interface LoginParams {
  usernameOrEmail: string;
  password: string;
  targetCompanyName: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}

export function loginUser({ usernameOrEmail, password, targetCompanyName }: LoginParams): LoginResult {
  const users = getAllRegisteredUsers();
  const input = usernameOrEmail.trim().toLowerCase();
  const targetComp = targetCompanyName.trim().toLowerCase();

  const user = users.find(u => 
    (u.username.toLowerCase() === input || u.email.toLowerCase() === input)
  );

  if (!user) {
    return {
      success: false,
      error: 'Kullanıcı bulunamadı. Lütfen kullanıcı adı veya e-posta adresinizi kontrol ediniz.'
    };
  }

  if (user.password && user.password !== password) {
    return {
      success: false,
      error: 'Girilen şifre hatalı. Lütfen şifrenizi kontrol edip tekrar deneyiniz.'
    };
  }

  const userComp = user.companyName.trim().toLowerCase();
  if (targetComp && userComp !== targetComp && !userComp.includes(targetComp) && !targetComp.includes(userComp)) {
    return {
      success: false,
      error: `Yetkisiz Şirket Erişimi: "${user.fullName}" kullanıcısı yalnızca "${user.companyName}" şirketinin veritabanına erişebilir. Farklı bir şirkete giriş izniniz bulunmamaktadır.`
    };
  }

  const session: AuthSession = {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      companyName: user.companyName,
      role: user.role,
      phone: user.phone
    },
    token: `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    loginTime: new Date().toISOString()
  };

  setActiveSession(session);

  // Sync login/workspace with backend
  fetch('/api/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  }).catch(() => {});

  return {
    success: true,
    user: session.user,
    session
  };
}

export interface RegisterParams {
  fullName: string;
  username: string;
  email: string;
  password: string;
  companyName: string;
  phone?: string;
}

export function registerUser(params: RegisterParams): LoginResult {
  const users = getAllRegisteredUsers();
  const cleanUsername = params.username.trim().toLowerCase();
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanCompany = params.companyName.trim();

  if (!cleanCompany) {
    return { success: false, error: 'Lütfen bağlı olduğunuz şirket veya kişi çalışma alanı ismini giriniz.' };
  }

  if (!cleanUsername || !params.password) {
    return { success: false, error: 'Kullanıcı adı ve şifre zorunludur.' };
  }

  const existing = users.find(u => 
    (u.username.toLowerCase() === cleanUsername && u.companyName.toLowerCase() === cleanCompany.toLowerCase())
  );

  if (existing) {
    return {
      success: false,
      error: 'Bu şirket altında aynı kullanıcı adı ile kayıtlı bir hesap zaten bulunmaktadır.'
    };
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: cleanUsername,
    email: cleanEmail || `${cleanUsername}@${cleanCompany.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 10) || 'sirket'}.com`,
    fullName: params.fullName.trim() || cleanUsername,
    companyName: cleanCompany,
    role: 'admin',
    password: params.password,
    phone: params.phone || ''
  };

  const updatedUsers = [...users, newUser];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

  // Register workspace in Express backend
  fetch('/api/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser)
  }).catch(() => {});

  const session: AuthSession = {
    user: newUser,
    token: `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    loginTime: new Date().toISOString()
  };

  setActiveSession(session);

  return {
    success: true,
    user: newUser,
    session
  };
}

// Google Cloud / Firebase Authentication with Workspace Assignment
export async function loginWithGoogleWorkspace(customCompanyName?: string): Promise<LoginResult> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const fbUser = cred.user;
    const uid = fbUser.uid;
    const wsRef = doc(db, 'workspaces', uid);
    const path = `workspaces/${uid}`;

    let assignedCompany = (customCompanyName || '').trim();
    let role: 'admin' | 'officer' | 'auditor' = 'admin';
    let username = (fbUser.email ? fbUser.email.split('@')[0] : fbUser.displayName || 'yetkili')
      .replace(/[^a-zA-Z0-9_.-]/g, '')
      .substring(0, 80) || 'yetkili';
    let fullName = (fbUser.displayName || username).substring(0, 140);

    try {
      const snap = await getDoc(wsRef);
      if (snap.exists()) {
        const data = snap.data();
        if (!assignedCompany) {
          assignedCompany = data.companyName || `${fullName} Kurumsal Çalışma Alanı`;
        }
        role = data.role || 'admin';
        await setDoc(wsRef, {
          uid,
          username: username.substring(0, 100),
          fullName: fullName.substring(0, 150),
          companyName: assignedCompany.substring(0, 250),
          role,
          createdAt: data.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        if (!assignedCompany) {
          assignedCompany = `${fullName} Kurumsal Çalışma Alanı`;
        }
        await setDoc(wsRef, {
          uid,
          username: username.substring(0, 100),
          fullName: fullName.substring(0, 150),
          companyName: assignedCompany.substring(0, 250),
          role: 'admin',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (fsErr) {
      handleFirestoreError(fsErr, OperationType.WRITE, path);
    }

    const appUser: User = {
      id: uid,
      username,
      email: fbUser.email || `${username}@kurumsal.com`,
      fullName,
      companyName: assignedCompany,
      role,
      avatarUrl: fbUser.photoURL || undefined
    };

    // Save in local users list & backend
    const users = getAllRegisteredUsers();
    const filtered = users.filter(u => u.id !== uid);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([appUser, ...filtered]));

    fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appUser)
    }).catch(() => {});

    const session: AuthSession = {
      user: appUser,
      token: await fbUser.getIdToken(),
      loginTime: new Date().toISOString()
    };

    setActiveSession(session);
    return { success: true, user: appUser, session };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Google ile bulut oturumu açılamadı.'
    };
  }
}

export function logoutUser(): void {
  setActiveSession(null);
  signOut(auth).catch(() => {});
}
