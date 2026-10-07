import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import { Transaction, UserFirebaseConfig, MonthlyBudget } from '../types/finance';

const CONFIG_STORAGE_KEY = 'moneytracker_firebase_config';

export function getSavedFirebaseConfig(): UserFirebaseConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse saved firebase config', e);
  }

  return {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    collectionName: 'transactions',
    isEnabled: false,
  };
}

export function saveFirebaseConfig(config: UserFirebaseConfig) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

let activeFirebaseApp: FirebaseApp | null = null;
let activeFirestore: Firestore | null = null;

export function initFirebase(config: UserFirebaseConfig): { app: FirebaseApp; db: Firestore } | null {
  if (!config.projectId || !config.apiKey) {
    return null;
  }

  try {
    const appName = `moneytracker_${config.projectId}`;
    const existingApps = getApps();
    const existing = existingApps.find((a) => a.name === appName);

    if (existing) {
      activeFirebaseApp = existing;
    } else {
      activeFirebaseApp = initializeApp(
        {
          apiKey: config.apiKey,
          authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
          projectId: config.projectId,
          storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
        },
        appName
      );
    }

    activeFirestore = getFirestore(activeFirebaseApp);
    return { app: activeFirebaseApp, db: activeFirestore };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
}

export async function testFirebaseConnection(config: UserFirebaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    if (!config.projectId) {
      return { success: false, message: 'กรุณากรอก Project ID' };
    }
    if (!config.apiKey) {
      return { success: false, message: 'กรุณากรอก API Key' };
    }

    const fb = initFirebase(config);
    if (!fb) {
      return { success: false, message: 'ไม่สามารถสร้างการเชื่อมต่อ Firebase ได้ กรุณาตรวจสอบข้อมูล' };
    }

    // Try reading collection
    const collName = config.collectionName || 'transactions';
    const collRef = collection(fb.db, collName);
    const snap = await getDocs(collRef);

    return {
      success: true,
      message: `เชื่อมต่อ Firebase โปรเจกต์ "${config.projectId}" สำเร็จ! (พบ ${snap.size} รายการใน Firestore)`,
    };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes('permission-denied') || errorMsg.includes('Missing or insufficient permissions')) {
      return {
        success: false,
        message: 'เชื่อมต่อได้ แต่ถูกปฏิเสธสิทธิ์ (Permission Denied): กรุณาตรวจสอบ Firestore Security Rules ให้เปิด allow read, write',
      };
    }
    if (errorMsg.includes('unavailable') || errorMsg.includes('offline')) {
      return {
        success: false,
        message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Firestore ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือว่าเปิดใช้งาน Cloud Firestore ใน Firebase Console แล้วหรือไม่',
      };
    }
    return {
      success: false,
      message: `เกิดข้อผิดพลาด: ${errorMsg}`,
    };
  }
}

export async function syncUploadToFirebase(
  config: UserFirebaseConfig,
  transactions: Transaction[],
  budgets: MonthlyBudget[]
): Promise<{ success: boolean; message: string; count: number }> {
  const fb = initFirebase(config);
  if (!fb) {
    return { success: false, message: 'ยังไม่ได้กำหนดค่า Firebase', count: 0 };
  }

  try {
    const collName = config.collectionName || 'transactions';
    const batch = writeBatch(fb.db);

    transactions.forEach((tx) => {
      const docRef = doc(fb.db, collName, tx.id);
      batch.set(docRef, tx);
    });

    budgets.forEach((b) => {
      const docRef = doc(fb.db, 'budgets', b.month);
      batch.set(docRef, b);
    });

    await batch.commit();
    return {
      success: true,
      message: `ซิงค์ข้อมูล ${transactions.length} รายการขึ้น Firebase สำเร็จแล้ว!`,
      count: transactions.length,
    };
  } catch (err: any) {
    console.error('Upload to Firebase error:', err);
    return {
      success: false,
      message: `ซิงค์ขึ้น Firebase ล้มเหลว: ${err?.message || String(err)}`,
      count: 0,
    };
  }
}

export async function syncDownloadFromFirebase(
  config: UserFirebaseConfig
): Promise<{ success: boolean; transactions?: Transaction[]; budgets?: MonthlyBudget[]; message: string }> {
  const fb = initFirebase(config);
  if (!fb) {
    return { success: false, message: 'ยังไม่ได้กำหนดค่า Firebase' };
  }

  try {
    const collName = config.collectionName || 'transactions';
    const txSnap = await getDocs(collection(fb.db, collName));
    const loadedTransactions: Transaction[] = [];

    txSnap.forEach((d) => {
      const data = d.data() as Transaction;
      loadedTransactions.push({ ...data, id: d.id });
    });

    const budgetSnap = await getDocs(collection(fb.db, 'budgets'));
    const loadedBudgets: MonthlyBudget[] = [];
    budgetSnap.forEach((d) => {
      loadedBudgets.push(d.data() as MonthlyBudget);
    });

    return {
      success: true,
      transactions: loadedTransactions,
      budgets: loadedBudgets,
      message: `ดึงข้อมูลจาก Firebase สำเร็จ (${loadedTransactions.length} รายการ)`,
    };
  } catch (err: any) {
    console.error('Download from Firebase error:', err);
    return {
      success: false,
      message: `ดึงข้อมูลจาก Firebase ล้มเหลว: ${err?.message || String(err)}`,
    };
  }
}
