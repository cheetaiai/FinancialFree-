import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  SyncStatus,
  IntegrityServerReport,
  DiscrepancyDetails,
  Person,
  Transaction
} from '../types';
import { api, localVault, subscribeSyncEvents } from '../lib/api';

export interface CloudBackupInfo {
  hasBackup: boolean;
  timestamp?: string;
  peopleCount: number;
  txCount: number;
  reminderCount: number;
  totalGiven?: number;
  totalReturned?: number;
  provider: string;
}

interface SyncContextType {
  syncState: SyncStatus;
  lastSavedTime: Date | null;
  statusMessage: string;
  integrityReport: IntegrityServerReport | null;
  discrepancyDetails: DiscrepancyDetails | null;
  isIntegrityModalOpen: boolean;
  isReconciling: boolean;
  backupStatus: CloudBackupInfo | null;
  isBackingUp: boolean;
  isRestoring: boolean;
  setIsIntegrityModalOpen: (open: boolean) => void;
  runIntegrityCheck: (promptIfDiscrepancy?: boolean) => Promise<DiscrepancyDetails | null>;
  resolveDiscrepancy: (action: 'merge' | 'push_local' | 'pull_remote') => Promise<boolean>;
  forceCloudSync: () => Promise<boolean>;
  fetchBackupStatus: () => Promise<CloudBackupInfo | null>;
  triggerCloudBackup: () => Promise<{ success: boolean; message: string }>;
  restoreFromCloud: () => Promise<{ success: boolean; message: string }>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [syncState, setSyncState] = useState<SyncStatus>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(() => {
    const saved = localVault.getLastSync();
    return saved ? new Date(saved) : new Date();
  });
  const [statusMessage, setStatusMessage] = useState<string>('All records secured');
  const [integrityReport, setIntegrityReport] = useState<IntegrityServerReport | null>(null);
  const [discrepancyDetails, setDiscrepancyDetails] = useState<DiscrepancyDetails | null>(null);
  const [isIntegrityModalOpen, setIsIntegrityModalOpen] = useState<boolean>(false);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [backupStatus, setBackupStatus] = useState<CloudBackupInfo | null>(null);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Subscribe to real-time events triggered by API CRUD operations
  useEffect(() => {
    const unsubscribe = subscribeSyncEvents((event) => {
      if (event.type === 'start') {
        setSyncState('syncing');
        setStatusMessage(event.operation);
      } else if (event.type === 'success') {
        setSyncState('saved');
        setLastSavedTime(event.timestamp);
        setStatusMessage(event.operation);
      } else if (event.type === 'error') {
        // If offline or network issue, acknowledge local vault safety
        setSyncState('offline');
        setStatusMessage(`Saved in local vault (${event.error})`);
      } else if (event.type === 'discrepancy') {
        setSyncState('discrepancy');
        setDiscrepancyDetails(event.details);
      }
    });

    return () => unsubscribe();
  }, []);

  // Automated Data Integrity Check
  const runIntegrityCheck = useCallback(async (promptIfDiscrepancy = true): Promise<DiscrepancyDetails | null> => {
    try {
      setSyncState('syncing');
      setStatusMessage('Checking data integrity...');

      const report = await api.getIntegrityCheck();
      setIntegrityReport(report);

      const localPeople = localVault.getPeople();
      const localTxs = localVault.getTransactions();

      const serverPeopleIds = new Set(report.serverPeople.map(p => p.id));
      const serverPeopleNames = new Set(report.serverPeople.map(p => p.full_name.trim().toLowerCase()));
      const localPeopleIds = new Set(localPeople.map(p => p.id));

      const serverTxIds = new Set(report.serverTransactions.map(t => t.id));
      const localTxIds = new Set(localTxs.map(t => t.id));

      // 1. Missing on server (in local vault but not reflected on server/cloud)
      const missingOnServerPeople = localPeople.filter(p =>
        !serverPeopleIds.has(p.id) && !serverPeopleNames.has(p.full_name.trim().toLowerCase())
      );

      // 2. Missing on local (on server/cloud but not in local vault)
      const missingOnLocalPeople = report.serverPeople
        .filter(p => !localPeopleIds.has(p.id))
        .map(p => ({ id: p.id, full_name: p.full_name }));

      // 3. Transactions missing on server
      const missingOnServerTxs = localTxs.filter(t => !serverTxIds.has(t.id));

      // 4. Transactions missing on local
      const missingOnLocalTxs = report.serverTransactions
        .filter(t => !localTxIds.has(t.id))
        .map(t => ({ id: t.id, amount: t.amount, type: t.transaction_type }));

      const hasDiscrepancy =
        missingOnServerPeople.length > 0 ||
        missingOnLocalPeople.length > 0 ||
        missingOnServerTxs.length > 0 ||
        missingOnLocalTxs.length > 0 ||
        localPeople.length !== report.serverPeopleCount ||
        localTxs.length !== report.serverTxCount;

      if (hasDiscrepancy) {
        let summary = 'Data discrepancy detected between local browser vault and remote cloud.';
        if (missingOnServerPeople.length > 0) {
          summary = `${missingOnServerPeople.length} local borrower(s) pending sync to cloud database.`;
        } else if (missingOnServerTxs.length > 0) {
          summary = `${missingOnServerTxs.length} transaction(s) pending sync to cloud database.`;
        } else if (missingOnLocalPeople.length > 0) {
          summary = `${missingOnLocalPeople.length} member(s) available in cloud database.`;
        }

        const details: DiscrepancyDetails = {
          hasDiscrepancy: true,
          localPeopleCount: localPeople.length,
          serverPeopleCount: report.serverPeopleCount,
          localTxCount: localTxs.length,
          serverTxCount: report.serverTxCount,
          missingOnServerPeople,
          missingOnLocalPeople,
          missingOnServerTxs,
          missingOnLocalTxs,
          summaryMessage: summary
        };

        setDiscrepancyDetails(details);
        setSyncState('discrepancy');
        setStatusMessage(summary);

        if (promptIfDiscrepancy) {
          // Open modal to prompt user to resolve
          setIsIntegrityModalOpen(true);
        }

        return details;
      } else {
        // Fully matched
        setDiscrepancyDetails(null);
        setSyncState('saved');
        setLastSavedTime(new Date());
        setStatusMessage('All records verified & 100% synchronized');
        localVault.setLastSync(new Date().toISOString());
        return null;
      }
    } catch (err: any) {
      console.warn('Integrity check warning (operating in local vault mode):', err.message);
      setSyncState('offline');
      setStatusMessage('Local vault active (Cloud offline)');
      return null;
    }
  }, []);

  // Resolve Discrepancy through Safe Merge or Selective Push/Pull
  const resolveDiscrepancy = async (action: 'merge' | 'push_local' | 'pull_remote'): Promise<boolean> => {
    setIsReconciling(true);
    setSyncState('syncing');
    setStatusMessage(`Resolving discrepancy (${action})...`);

    try {
      const localPeople = localVault.getPeople();
      const localTxs = localVault.getTransactions();
      const localReminders = localVault.getReminders();

      const result = await api.reconcileDatabase({
        action,
        localPeople,
        localTransactions: localTxs,
        localReminders
      });

      if (result.success) {
        setDiscrepancyDetails(null);
        setIsIntegrityModalOpen(false);
        setSyncState('saved');
        setLastSavedTime(new Date());
        setStatusMessage(`Reconciled: ${result.peopleCount} members and ${result.txCount} transactions secured!`);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Reconciliation error:', err);
      setSyncState('error');
      setStatusMessage(`Reconciliation failed: ${err.message}`);
      return false;
    } finally {
      setIsReconciling(false);
    }
  };

  // Force Cloud Sync
  const forceCloudSync = async (): Promise<boolean> => {
    setIsReconciling(true);
    setSyncState('syncing');
    setStatusMessage('Syncing with Cloud Firestore...');
    try {
      await api.syncDatabase();
      await runIntegrityCheck(false);
      return true;
    } catch (err: any) {
      setSyncState('error');
      setStatusMessage(`Cloud sync error: ${err.message}`);
      return false;
    } finally {
      setIsReconciling(false);
    }
  };

  // Fetch Cloud Backup Status
  const fetchBackupStatus = useCallback(async (): Promise<CloudBackupInfo | null> => {
    try {
      const status = await api.getCloudBackupStatus();
      setBackupStatus(status);
      return status;
    } catch (err: any) {
      console.warn('Failed to fetch backup status:', err.message);
      return null;
    }
  }, []);

  // Trigger Manual or Scheduled Cloud Backup
  const triggerCloudBackup = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsBackingUp(true);
    setSyncState('syncing');
    setStatusMessage('Pushing backup to Cloud Firestore...');
    try {
      const res = await api.pushCloudBackup();
      const updatedStatus: CloudBackupInfo = {
        hasBackup: true,
        timestamp: res.timestamp,
        peopleCount: res.peopleCount,
        txCount: res.txCount,
        reminderCount: res.reminderCount,
        totalGiven: res.totalGiven,
        totalReturned: res.totalReturned,
        provider: 'Google Cloud Firestore'
      };
      setBackupStatus(updatedStatus);
      setSyncState('saved');
      setLastSavedTime(new Date(res.timestamp));
      setStatusMessage(`Cloud backup secured (${res.peopleCount} members, ${res.txCount} transactions)`);
      return {
        success: true,
        message: `Successfully created cloud backup with ${res.peopleCount} members and ${res.txCount} transactions.`
      };
    } catch (err: any) {
      console.error('Cloud backup failed:', err);
      setSyncState('error');
      setStatusMessage(`Backup error: ${err.message}`);
      return {
        success: false,
        message: err.message || 'Failed to complete cloud backup.'
      };
    } finally {
      setIsBackingUp(false);
    }
  }, []);

  // Restore from Cloud Backup
  const restoreFromCloud = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    setIsRestoring(true);
    setSyncState('syncing');
    setStatusMessage('Restoring records from Cloud Firestore...');
    try {
      const res = await api.restoreFromCloudBackup();
      setSyncState('saved');
      setLastSavedTime(new Date());
      setStatusMessage(`Restored: ${res.restoredPeopleCount} contacts & ${res.restoredTxCount} transactions!`);
      // Update backup status after restore
      await fetchBackupStatus();
      return {
        success: true,
        message: `Successfully restored ${res.restoredPeopleCount} contacts and ${res.restoredTxCount} transactions from cloud backup!`
      };
    } catch (err: any) {
      console.error('Cloud restore failed:', err);
      setSyncState('error');
      setStatusMessage(`Restore error: ${err.message}`);
      return {
        success: false,
        message: err.message || 'Failed to restore from cloud.'
      };
    } finally {
      setIsRestoring(false);
    }
  }, [fetchBackupStatus]);

  // Automated Periodic Backup Routine
  useEffect(() => {
    // Initial fetch of backup status
    fetchBackupStatus();

    // Automated periodic background backup push (every 5 minutes)
    const backupInterval = setInterval(() => {
      // Only run if not currently syncing or reconciling
      if (!isReconciling && !isBackingUp && !isRestoring) {
        api.pushCloudBackup()
          .then((res) => {
            setBackupStatus({
              hasBackup: true,
              timestamp: res.timestamp,
              peopleCount: res.peopleCount,
              txCount: res.txCount,
              reminderCount: res.reminderCount,
              totalGiven: res.totalGiven,
              totalReturned: res.totalReturned,
              provider: 'Google Cloud Firestore'
            });
            setLastSavedTime(new Date(res.timestamp));
          })
          .catch((e) => {
            console.warn('Background automated backup warning:', e.message);
          });
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(backupInterval);
  }, [fetchBackupStatus, isReconciling, isBackingUp, isRestoring]);

  return (
    <SyncContext.Provider
      value={{
        syncState,
        lastSavedTime,
        statusMessage,
        integrityReport,
        discrepancyDetails,
        isIntegrityModalOpen,
        isReconciling,
        backupStatus,
        isBackingUp,
        isRestoring,
        setIsIntegrityModalOpen,
        runIntegrityCheck,
        resolveDiscrepancy,
        forceCloudSync,
        fetchBackupStatus,
        triggerCloudBackup,
        restoreFromCloud
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
