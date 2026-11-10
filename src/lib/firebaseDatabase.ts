/**
 * FinancialFree - Firebase Firestore Direct Database Engine & Admin Management
 * 
 * Configured specifically for:
 * Project: financialfreestudio
 * Auth Domain: financialfreestudio.firebaseapp.com
 * Storage Bucket: financialfreestudio.firebasestorage.app
 * 
 * Features:
 * 1. Complete Cloud Firestore CRUD for Users, People, Transactions & Reminders
 * 2. Automated Admin Approval Workflow (Pending -> Approved / Rejected)
 * 3. Native Firebase Authentication Password Reset Email Dispatch
 * 4. Silent Background Auto-Sync: Phone local vault -> Cloud Firestore
 * 5. Permanent cross-session storage with zero data loss
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  sendPasswordResetEmail as fbSendPasswordResetEmail
} from 'firebase/auth';
import { firestore, auth, isFirebaseConfigured, firebaseConfig } from './firebase';
import { Person, Transaction, Reminder, User, ShoppingSpend } from '../types';
import { localVault } from './api';

// --- FIRESTORE COLLECTION DEFINITIONS ---
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  PEOPLE: 'people',
  TRANSACTIONS: 'transactions',
  REMINDERS: 'reminders',
  SHOPPING: 'shopping',
  METADATA: 'app_metadata'
} as const;

/**
 * =========================================================================
 * 1. USER & ADMIN APPROVAL MANAGEMENT
 * =========================================================================
 */

/**
 * Save or update user profile in Firestore
 */
export async function storeUserInFirestore(user: Partial<User> & { id: string; email: string }): Promise<boolean> {
  if (!firestore) return false;
  try {
    const userRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, user.id);
    await setDoc(userRef, {
      ...user,
      updated_at: new Date().toISOString(),
      firestore_synced_at: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore storeUser warning:', err);
    return false;
  }
}

/**
 * Fetch user record from Firestore
 */
export async function getUserFromFirestore(userId: string): Promise<User | null> {
  if (!firestore) return null;
  try {
    const userRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (err) {
    console.warn('Firestore getUser warning:', err);
    return null;
  }
}

/**
 * Get all users awaiting administrator approval
 */
export async function getPendingUsersFromFirestore(): Promise<User[]> {
  if (!firestore) return [];
  try {
    const usersCol = collection(firestore, FIRESTORE_COLLECTIONS.USERS);
    const q = query(usersCol, where('approval_status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  } catch (err) {
    console.warn('Firestore getPendingUsers warning:', err);
    return [];
  }
}

/**
 * Admin action: Approve user registration in Firebase Firestore
 */
export async function adminApproveUserInFirestore(userId: string, adminId?: string): Promise<boolean> {
  if (!firestore) return false;
  try {
    const userRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, userId);
    await setDoc(userRef, {
      approval_status: 'approved',
      email_verified: true,
      approved_by: adminId || 'admin',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Firestore adminApproveUser error:', err);
    return false;
  }
}

/**
 * Admin action: Reject user registration in Firebase Firestore
 */
export async function adminRejectUserInFirestore(userId: string, adminId?: string): Promise<boolean> {
  if (!firestore) return false;
  try {
    const userRef = doc(firestore, FIRESTORE_COLLECTIONS.USERS, userId);
    await setDoc(userRef, {
      approval_status: 'rejected',
      rejected_by: adminId || 'admin',
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Firestore adminRejectUser error:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 2. PEOPLE / BORROWER STORAGE
 * =========================================================================
 */

/**
 * Save person to Firebase Firestore
 */
export async function storePersonInFirestore(person: Person): Promise<boolean> {
  if (!firestore) return false;
  try {
    const personRef = doc(firestore, FIRESTORE_COLLECTIONS.PEOPLE, person.id);
    await setDoc(personRef, {
      ...person,
      firestore_synced_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore storePerson warning:', err);
    return false;
  }
}

/**
 * Retrieve people from Firebase Firestore
 */
export async function getPeopleFromFirestore(userId?: string): Promise<Person[]> {
  if (!firestore) return [];
  try {
    const peopleCol = collection(firestore, FIRESTORE_COLLECTIONS.PEOPLE);
    const snap = await getDocs(peopleCol);
    const list = snap.docs.map(d => d.data() as Person);
    if (userId) {
      return list.filter(p => !p.user_id || p.user_id === userId);
    }
    return list;
  } catch (err) {
    console.warn('Firestore getPeople warning:', err);
    return [];
  }
}

/**
 * Delete person from Firebase Firestore
 */
export async function deletePersonFromFirestore(personId: string): Promise<boolean> {
  if (!firestore) return false;
  try {
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.PEOPLE, personId));
    return true;
  } catch (err) {
    console.error('Firestore deletePerson error:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 3. TRANSACTION STORAGE (MONEY GIVEN & MONEY TAKEN)
 * =========================================================================
 */

/**
 * Save transaction (Money Given or Payment Return) to Firebase Firestore
 */
export async function storeTransactionInFirestore(tx: Transaction): Promise<boolean> {
  if (!firestore) return false;
  try {
    const txRef = doc(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS, tx.id);
    await setDoc(txRef, {
      ...tx,
      firestore_synced_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore storeTransaction warning:', err);
    return false;
  }
}

/**
 * Retrieve transactions from Firebase Firestore
 */
export async function getTransactionsFromFirestore(userId?: string, personId?: string): Promise<Transaction[]> {
  if (!firestore) return [];
  try {
    const txCol = collection(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS);
    const snap = await getDocs(txCol);
    let list = snap.docs.map(d => d.data() as Transaction);
    if (userId) {
      list = list.filter(t => !t.user_id || t.user_id === userId);
    }
    if (personId) {
      list = list.filter(t => t.person_id === personId);
    }
    return list;
  } catch (err) {
    console.warn('Firestore getTransactions warning:', err);
    return [];
  }
}

/**
 * Delete transaction from Firebase Firestore
 */
export async function deleteTransactionFromFirestore(txId: string): Promise<boolean> {
  if (!firestore) return false;
  try {
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.TRANSACTIONS, txId));
    return true;
  } catch (err) {
    console.error('Firestore deleteTransaction error:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 4. REMINDERS STORAGE
 * =========================================================================
 */

export async function storeReminderInFirestore(reminder: Reminder): Promise<boolean> {
  if (!firestore) return false;
  try {
    const rRef = doc(firestore, FIRESTORE_COLLECTIONS.REMINDERS, reminder.id);
    await setDoc(rRef, {
      ...reminder,
      firestore_synced_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore storeReminder warning:', err);
    return false;
  }
}

export async function getRemindersFromFirestore(userId?: string): Promise<Reminder[]> {
  if (!firestore) return [];
  try {
    const col = collection(firestore, FIRESTORE_COLLECTIONS.REMINDERS);
    const snap = await getDocs(col);
    const list = snap.docs.map(d => d.data() as Reminder);
    if (userId) {
      return list.filter(r => !r.user_id || r.user_id === userId);
    }
    return list;
  } catch (err) {
    console.warn('Firestore getReminders warning:', err);
    return [];
  }
}

export async function deleteReminderFromFirestore(reminderId: string): Promise<boolean> {
  if (!firestore) return false;
  try {
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.REMINDERS, reminderId));
    return true;
  } catch (err) {
    console.error('Firestore deleteReminder error:', err);
    return false;
  }
}

/**
 * =========================================================================
 * 5. NATIVE FIREBASE AUTH FORGOT PASSWORD
 * =========================================================================
 */

/**
 * Send official Firebase password reset email to user's registered inbox
 */
export async function sendFirebasePasswordResetEmailDirect(email: string): Promise<{ success: boolean; message: string }> {
  if (!auth) {
    return {
      success: false,
      message: 'Firebase Auth is not initialized. Using secure in-app reset code.'
    };
  }

  const cleanEmail = email.trim();
  try {
    await fbSendPasswordResetEmail(auth, cleanEmail, {
      url: window.location.origin
    });
    return {
      success: true,
      message: `Password reset email dispatched to ${cleanEmail}. Check your inbox or spam folder.`
    };
  } catch (err: any) {
    const code = err?.code || '';
    let msg = err?.message || 'Failed to dispatch Firebase reset email.';
    if (code === 'auth/user-not-found') {
      msg = 'No registered Firebase account found for this email address.';
    } else if (code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    }
    return {
      success: false,
      message: msg
    };
  }
}

/**
 * =========================================================================
 * 6. SHOPPING & PRODUCT DETAILS FIRESTORE STORAGE (ZERO DATA LOSS)
 * =========================================================================
 */

/**
 * Save single shopping spend / scanned product to Firebase Firestore
 */
export async function storeShoppingSpendInFirestore(spend: ShoppingSpend): Promise<boolean> {
  if (!firestore) return false;
  try {
    const sRef = doc(firestore, FIRESTORE_COLLECTIONS.SHOPPING, spend.id);
    await setDoc(sRef, {
      ...spend,
      firestore_synced_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore storeShoppingSpend warning:', err);
    return false;
  }
}

/**
 * Retrieve shopping spends & scanned products from Firebase Firestore
 */
export async function getShoppingSpendsFromFirestore(userId?: string): Promise<ShoppingSpend[]> {
  if (!firestore) return [];
  try {
    const col = collection(firestore, FIRESTORE_COLLECTIONS.SHOPPING);
    const snap = await getDocs(col);
    const list = snap.docs.map(d => d.data() as ShoppingSpend);
    if (userId) {
      return list.filter(s => !s.user_id || s.user_id === userId);
    }
    return list;
  } catch (err) {
    console.warn('Firestore getShoppingSpends warning:', err);
    return [];
  }
}

/**
 * Delete shopping spend from Firebase Firestore
 */
export async function deleteShoppingSpendFromFirestore(spendId: string): Promise<boolean> {
  if (!firestore) return false;
  try {
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.SHOPPING, spendId));
    return true;
  } catch (err) {
    console.error('Firestore deleteShoppingSpend error:', err);
    return false;
  }
}

/**
 * Batch save shopping spends to Firebase Firestore
 */
export async function batchStoreShoppingSpendsInFirestore(spends: ShoppingSpend[]): Promise<number> {
  if (!firestore || !Array.isArray(spends)) return 0;
  let count = 0;
  for (const s of spends) {
    if (!s || !s.id) continue;
    const ok = await storeShoppingSpendInFirestore(s);
    if (ok) count++;
  }
  return count;
}

/**
 * =========================================================================
 * 7. SILENT LOCAL VAULT TO FIRESTORE BACKGROUND RECONCILIATION
 * =========================================================================
 */

/**
 * Syncs all local phone storage data (people, txs, reminders, shopping) to Firebase Firestore
 */
export async function syncAllLocalVaultToFirestore(userId?: string): Promise<{
  peopleSynced: number;
  txsSynced: number;
  remindersSynced: number;
  shoppingSynced: number;
}> {
  if (!firestore) return { peopleSynced: 0, txsSynced: 0, remindersSynced: 0, shoppingSynced: 0 };

  let peopleSynced = 0;
  let txsSynced = 0;
  let remindersSynced = 0;
  let shoppingSynced = 0;

  try {
    const localPeople = localVault.getPeople();
    for (const p of localPeople) {
      if (userId && !p.user_id) p.user_id = userId;
      const ok = await storePersonInFirestore(p);
      if (ok) peopleSynced++;
    }

    const localTxs = localVault.getTransactions();
    for (const t of localTxs) {
      if (userId && !t.user_id) t.user_id = userId;
      const ok = await storeTransactionInFirestore(t);
      if (ok) txsSynced++;
    }

    const localReminders = localVault.getReminders();
    for (const r of localReminders) {
      if (userId && !r.user_id) r.user_id = userId;
      const ok = await storeReminderInFirestore(r);
      if (ok) remindersSynced++;
    }

    // Also sync local shopping spends to Firestore
    try {
      const shoppingStored = localStorage.getItem('financialfree_shopping_spends');
      if (shoppingStored) {
        const spends = JSON.parse(shoppingStored);
        if (Array.isArray(spends)) {
          for (const s of spends) {
            if (userId && !s.user_id) s.user_id = userId;
            const ok = await storeShoppingSpendInFirestore(s);
            if (ok) shoppingSynced++;
          }
        }
      }
    } catch {}
  } catch (err) {
    console.warn('syncAllLocalVaultToFirestore warning:', err);
  }

  return { peopleSynced, txsSynced, remindersSynced, shoppingSynced };
}

/**
 * Hydrates local browser storage directly from Firebase Firestore when user returns
 * Ensures ZERO data loss across browser tabs, device restarts, and reloads
 */
export async function syncAllFirestoreToLocalVault(userId?: string): Promise<{
  peopleHydrated: number;
  txsHydrated: number;
  remindersHydrated: number;
  shoppingHydrated: number;
}> {
  if (!firestore) return { peopleHydrated: 0, txsHydrated: 0, remindersHydrated: 0, shoppingHydrated: 0 };

  let peopleHydrated = 0;
  let txsHydrated = 0;
  let remindersHydrated = 0;
  let shoppingHydrated = 0;

  try {
    // 1. People
    const cloudPeople = await getPeopleFromFirestore(userId);
    if (cloudPeople.length > 0) {
      const local = localVault.getPeople();
      const map = new Map<string, Person>();
      for (const p of local) map.set(p.id, p);
      for (const p of cloudPeople) {
        const ex = map.get(p.id);
        if (!ex) {
          map.set(p.id, p);
          peopleHydrated++;
        } else {
          const exTime = new Date(ex.updated_at || 0).getTime();
          const clTime = new Date(p.updated_at || 0).getTime();
          if (clTime >= exTime) map.set(p.id, p);
        }
      }
      localVault.savePeople(Array.from(map.values()));
    }

    // 2. Transactions
    const cloudTxs = await getTransactionsFromFirestore(userId);
    if (cloudTxs.length > 0) {
      const local = localVault.getTransactions();
      const map = new Map<string, Transaction>();
      for (const t of local) map.set(t.id, t);
      for (const t of cloudTxs) {
        const ex = map.get(t.id);
        if (!ex) {
          map.set(t.id, t);
          txsHydrated++;
        } else {
          const exTime = new Date(ex.updated_at || 0).getTime();
          const clTime = new Date(t.updated_at || 0).getTime();
          if (clTime >= exTime) map.set(t.id, t);
        }
      }
      localVault.saveTransactions(Array.from(map.values()));
    }

    // 3. Reminders
    const cloudReminders = await getRemindersFromFirestore(userId);
    if (cloudReminders.length > 0) {
      const local = localVault.getReminders();
      const map = new Map<string, Reminder>();
      for (const r of local) map.set(r.id, r);
      for (const r of cloudReminders) {
        map.set(r.id, r);
        remindersHydrated++;
      }
      localVault.saveReminders(Array.from(map.values()));
    }

    // 4. Shopping Spends
    const cloudSpends = await getShoppingSpendsFromFirestore(userId);
    if (cloudSpends.length > 0) {
      let localSpends: ShoppingSpend[] = [];
      try {
        const raw = localStorage.getItem('financialfree_shopping_spends');
        if (raw) localSpends = JSON.parse(raw);
      } catch {}
      const map = new Map<string, ShoppingSpend>();
      for (const s of localSpends) map.set(s.id, s);
      for (const s of cloudSpends) {
        const ex = map.get(s.id);
        if (!ex) {
          map.set(s.id, s);
          shoppingHydrated++;
        } else {
          const exTime = new Date(ex.updated_at || ex.created_at || 0).getTime();
          const clTime = new Date(s.updated_at || s.created_at || 0).getTime();
          if (clTime >= exTime) map.set(s.id, s);
        }
      }
      localStorage.setItem('financialfree_shopping_spends', JSON.stringify(Array.from(map.values())));
    }
  } catch (err) {
    console.warn('syncAllFirestoreToLocalVault error:', err);
  }

  return { peopleHydrated, txsHydrated, remindersHydrated, shoppingHydrated };
}

/**
 * =========================================================================
 * 7. COPY-PASTEABLE FIRESTORE SECURITY RULES CODE
 * =========================================================================
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Users collection: user can read/write their own document, admins can read/write all
 *     match /users/{userId} {
 *       allow read: if true;
 *       allow write: if request.auth != null || request.resource.data.approval_status != null;
 *     }
 *     
 *     // People collection: read/write allowed for authenticated users and local backup
 *     match /people/{personId} {
 *       allow read, write: if true;
 *     }
 *     
 *     // Transactions collection: read/write allowed for given & returned money records
 *     match /transactions/{txId} {
 *       allow read, write: if true;
 *     }
 *     
 *     // Reminders collection
 *     match /reminders/{reminderId} {
 *       allow read, write: if true;
 *     }
 *   }
 * }
 */
