import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { User } from '../../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  User as UserIcon,
  Trash2,
  RefreshCw,
  Mail,
  Lock,
  Calendar,
  AlertTriangle,
  X,
  CheckCircle2,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidButton } from '../ui/LiquidButton';
import { motion, AnimatePresence } from 'motion/react';

export const AdminUserManagementCard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  // Form states for new user creation
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const [usersRes, pendingRes] = await Promise.all([
        api.adminGetUsers(),
        api.adminGetPendingUsers().catch(() => ({ pendingUsers: [] }))
      ]);
      if (usersRes && usersRes.users) {
        setUsers(usersRes.users);
      }
      if (pendingRes && pendingRes.pendingUsers) {
        setPendingUsers(pendingRes.pendingUsers);
      }
    } catch (err: any) {
      console.warn('Failed to load admin user list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (targetUser: User) => {
    try {
      setIsApprovingId(targetUser.id);
      await api.adminApproveUser(targetUser.id);
      showToast(`Approved registration for ${targetUser.name || targetUser.email}! Login access granted.`, 'success');
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve user account', 'error');
    } finally {
      setIsApprovingId(null);
    }
  };

  const handleRejectUser = async (targetUser: User) => {
    try {
      setIsApprovingId(targetUser.id);
      await api.adminRejectUser(targetUser.id);
      showToast(`Rejected registration for ${targetUser.name || targetUser.email}.`, 'info');
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject user registration', 'error');
    } finally {
      setIsApprovingId(null);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser?.role]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      showToast('Please enter the user full name.', 'error');
      return;
    }
    if (!email.trim()) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.adminCreateUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role
      });
      showToast(`Account for ${res.user.name || res.user.email} created successfully as ${role === 'admin' ? 'Administrator' : 'Standard User'}!`, 'success');
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to create user account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    try {
      await api.adminDeleteUser(targetUser.id);
      showToast(`Account ${targetUser.email} was removed.`, 'success');
      setDeleteConfirmUser(null);
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete account', 'error');
    }
  };

  const handleToggleRole = async (targetUser: User) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      await api.adminUpdateUserRole(targetUser.id, newRole);
      showToast(`Updated ${targetUser.name || targetUser.email} role to ${newRole.toUpperCase()}.`, 'success');
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role', 'error');
    }
  };

  if (currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <LiquidGlassCard variant="primary" className="space-y-4 border border-blue-500/20 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Admin & Account Management
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                <ShieldCheck size={11} />
                Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provision authorized administrator and user accounts directly from your dashboard.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LiquidButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={fetchUsers}
            isLoading={isLoading}
            icon={<RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />}
          >
            Refresh
          </LiquidButton>
          <LiquidButton
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
            icon={<UserPlus size={14} />}
          >
            Create Account
          </LiquidButton>
        </div>
      </div>

      {/* PENDING REGISTRATION APPROVALS QUEUE */}
      {pendingUsers.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Clock size={15} className="text-amber-500" />
                <span>Pending Registration Requests ({pendingUsers.length})</span>
              </h4>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Action Required
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            The following users signed up and are waiting for administrator approval before logging in:
          </p>

          <div className="space-y-2">
            {pendingUsers.map(pUser => (
              <div
                key={pUser.id}
                className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {pUser.name ? pUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{pUser.name || 'Unnamed User'}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                        {pUser.role === 'admin' ? 'Admin Request' : 'Standard User'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {pUser.email}
                      <span className="mx-1 text-slate-300 dark:text-slate-700">•</span>
                      <span>Requested {new Date(pUser.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    disabled={isApprovingId === pUser.id}
                    onClick={() => handleRejectUser(pUser)}
                    className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40"
                  >
                    <UserX size={13} />
                    <span>Reject</span>
                  </button>
                  <button
                    type="button"
                    disabled={isApprovingId === pUser.id}
                    onClick={() => handleApproveUser(pUser)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm shadow-emerald-600/25 disabled:opacity-40"
                  >
                    <UserCheck size={13} />
                    <span>{isApprovingId === pUser.id ? 'Approving...' : 'Approve & Allow Login'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Count Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
          <div className="text-[11px] text-slate-400 font-medium">Total Accounts</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {users.length} Registered
          </div>
        </div>
        <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
          <div className="text-[11px] text-slate-400 font-medium">Administrators</div>
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {users.filter(u => u.role === 'admin').length} Active Admins
          </div>
        </div>
        <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 col-span-2 sm:col-span-1">
          <div className="text-[11px] text-slate-400 font-medium">Standard Accounts</div>
          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            {users.filter(u => u.role !== 'admin').length} Users
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-2 pt-1">
        {users.length === 0 && !isLoading && (
          <div className="text-center py-6 text-xs text-slate-400">
            No accounts found. Click "Create Account" above to provision the first user.
          </div>
        )}

        {users.map(u => {
          const isCurrent = currentUser?.id === u.id;
          const isPrimary = u.email.toLowerCase() === 'startup.cheetaiaistudio.com@gmail.com';
          const isAdmin = u.role === 'admin';

          return (
            <div
              key={u.id}
              className={`p-3 sm:p-3.5 rounded-2xl liquid-glass-secondary border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isCurrent
                  ? 'border-blue-500/40 bg-blue-500/5'
                  : 'border-slate-200/60 dark:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  isAdmin
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {u.name || 'Unnamed Account'}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        You (Active)
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isAdmin
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                    }`}>
                      {isAdmin ? <ShieldCheck size={10} /> : <UserIcon size={10} />}
                      {isAdmin ? 'Admin' : 'User'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    <span className="truncate">{u.email}</span>
                    <span>•</span>
                    <span className="shrink-0 flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                {!isCurrent && !isPrimary && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleRole(u)}
                      title={`Switch to ${isAdmin ? 'Standard User' : 'Administrator'}`}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold liquid-glass-secondary border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                    >
                      Make {isAdmin ? 'User' : 'Admin'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmUser(u)}
                      title="Delete Account"
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                {isPrimary && (
                  <span className="text-[10px] font-bold text-slate-400 px-2 py-1">
                    System Master
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE USER MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="p-6 rounded-3xl liquid-glass-card max-w-md w-full shadow-2xl border border-white/20 relative"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Create New Account
                  </h3>
                  <p className="text-xs text-slate-400">
                    Administrator provisioning for FinancialFree
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Account Holder Name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-white/10 text-white text-sm font-medium glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="account@financialfree.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-white/10 text-white text-sm font-medium glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        role === 'admin'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'liquid-glass-secondary border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck size={14} />
                      <span>Administrator</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        role === 'user'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'liquid-glass-secondary border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserIcon size={14} />
                      <span>Standard User</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="•••••••••••• (min 6 chars)"
                      className="w-full pl-10 pr-12 py-2.5 rounded-2xl liquid-glass-secondary border border-white/10 text-white text-sm font-medium glass-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <LiquidButton
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </LiquidButton>
                  <LiquidButton
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    Create Account
                  </LiquidButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="p-6 rounded-3xl liquid-glass-card max-w-sm w-full shadow-2xl border border-rose-500/30 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Delete Account?
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to remove <strong>{deleteConfirmUser.name || deleteConfirmUser.email}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <LiquidButton
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setDeleteConfirmUser(null)}
                  className="flex-1"
                >
                  Cancel
                </LiquidButton>
                <LiquidButton
                  type="button"
                  variant="destructive"
                  size="md"
                  onClick={() => handleDeleteUser(deleteConfirmUser)}
                  className="flex-1"
                >
                  Confirm Delete
                </LiquidButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LiquidGlassCard>
  );
};
