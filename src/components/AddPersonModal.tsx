import React, { useState, useEffect, useRef } from 'react';
import { LiquidModal } from './ui/LiquidModal';
import { LiquidButton } from './ui/LiquidButton';
import { LiquidDropdown } from './ui/LiquidDropdown';
import { Person } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { User, Phone, Mail, MapPin, Camera, Sparkles, X, Image as ImageIcon, Check, Video, CreditCard } from 'lucide-react';
import { CameraCaptureModal } from './camera/CameraCaptureModal';
import { PersonLedgerCard } from './ui/PersonLedgerCard';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (person: Person) => void;
  editPerson?: Person | null;
}

const CATEGORIES = ['Friends', 'Family', 'Business', 'Colleagues', 'Neighbours', 'Other'];
const AVATAR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#6366F1'  // Indigo
];

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editPerson = null
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('Friends');
  const [avatarColor, setAvatarColor] = useState('#3B82F6');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanningCard, setIsScanningCard] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editPerson) {
      setFullName(editPerson.full_name);
      setPhone(editPerson.phone || '');
      setEmail(editPerson.email || '');
      setAddress(editPerson.address || '');
      setNotes(editPerson.notes || '');
      setCategory(editPerson.category || 'Friends');
      setAvatarColor(editPerson.avatar_color || '#3B82F6');
      setAvatarUrl(editPerson.avatar_url || '');
    } else {
      setFullName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setCategory('Friends');
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
      setAvatarUrl('');
    }
    setError('');
  }, [editPerson, isOpen]);

  // Handle avatar image upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile image size should be less than 5MB.');
      return;
    }

    showToast('Local Storage Access: Reading contact photo safely from device storage', 'info');
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      showToast('Avatar photo loaded from device.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Process image for card detection (from Camera or Local Storage)
  const processCardImage = async (base64: string, mimeType: string) => {
    setIsScanningCard(true);
    setError('');
    try {
      const result = await api.scanReceiptOrImage(base64, mimeType);
      if (result.person_name) {
        setFullName(result.person_name);
      }
      if (result.notes) {
        setNotes(prev => prev ? `${prev}\n${result.notes}` : (result.notes || ''));
      }
      setAvatarUrl(base64);
      showToast('Contact details successfully recognized from photo.', 'success');
    } catch (err: any) {
      setError('Could not scan card details. Please fill manually.');
    } finally {
      setIsScanningCard(false);
    }
  };

  // Handle business / contact card scanning via file
  const handleScanCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast('Local Storage Access: Reading visiting card from device storage for auto-fill', 'info');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      await processCardImage(base64, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  // Handle business / contact card capture via live Camera
  const handleCameraCapture = async (imageDataUrl: string) => {
    setIsCameraModalOpen(false);
    showToast('Camera Access: Captured photo. Analyzing contact information...', 'info');
    await processCardImage(imageDataUrl, 'image/jpeg');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!fullName.trim()) {
      setError('Please enter the person\'s full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editPerson) {
        const updated = await api.updatePerson(editPerson.id, {
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          notes: notes.trim(),
          category,
          avatar_color: avatarColor,
          avatar_url: avatarUrl
        });
        showToast('Person updated successfully.', 'success');
        onSuccess(updated);
        onClose();
      } else {
        const created = await api.createPerson({
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          notes: notes.trim(),
          category,
          avatar_color: avatarColor,
          avatar_url: avatarUrl
        });
        showToast('Person added successfully to ledger.', 'success');
        onSuccess(created);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Unable to save person. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LiquidModal
      isOpen={isOpen}
      onClose={onClose}
      title={editPerson ? 'Edit Person Details' : 'Add New Person'}
      subtitle="Maintain personal lending records and contact details"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Holographic Ledger Pass / Account Card Live Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard size={13} className="text-blue-500" />
              <span>Digital Ledger Account Pass</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Preview
            </span>
          </div>

          <PersonLedgerCard
            person={{
              id: editPerson?.id || fullName || '1029',
              full_name: fullName || 'Full Name',
              category: category,
              avatar_color: avatarColor,
              remaining_balance: editPerson?.remaining_balance || 0,
              total_given: editPerson?.total_given || 0
            }}
            size="sm"
            interactive={true}
            showBalance={!!editPerson}
          />
        </div>

        {/* Avatar Photo & Color Picker */}
        <div className="flex items-center gap-4 p-3.5 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
          <div className="relative group">
            {avatarUrl ? (
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-md ring-2 ring-blue-500">
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md transition-all"
                style={{ backgroundColor: avatarColor }}
              >
                {fullName.trim() ? fullName.trim().charAt(0).toUpperCase() : <User size={24} />}
              </div>
            )}

            {/* Hidden Photo file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Profile Photo / Color Accent
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Camera size={13} />
                <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    avatarColor === c && !avatarUrl ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                >
                  {avatarColor === c && !avatarUrl && <Check size={10} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Business card / contact photo scanner option */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/15 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-500 flex-shrink-0" />
            <span>Have a visiting card or contact photo?</span>
          </div>
          <input
            ref={cardInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleScanCard}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isScanningCard}
              onClick={() => {
                showToast('Camera Access: Launching camera to photograph visiting card / person', 'info');
                setIsCameraModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Camera size={13} />
              <span>Camera Scan</span>
            </button>
            <button
              type="button"
              disabled={isScanningCard}
              onClick={() => cardInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl bg-slate-200/60 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <ImageIcon size={13} />
              <span>{isScanningCard ? 'Scanning...' : 'Upload Card'}</span>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
            Full Name *
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Enter contact or borrower name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium glass-input"
            />
          </div>
        </div>

        {/* Phone & Email in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              Email (Optional)
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input"
              />
            </div>
          </div>
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
            Relationship / Category
          </label>
          <LiquidDropdown<string>
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
            value={category}
            onChange={v => setCategory(v)}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
            Address / City (Optional)
          </label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Sector 62, Noida"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
            Personal Notes / Background (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="College friend, business supplier, or repayment preferences..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input resize-none"
          />
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/10">
          <LiquidButton
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </LiquidButton>
          <LiquidButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
          >
            {editPerson ? 'Save Changes' : 'Add Person'}
          </LiquidButton>
        </div>
      </form>

      {/* Live Camera Scanner for Visiting Card / Person Photo */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        title="Photograph Visiting Card or Person"
      />
    </LiquidModal>
  );
};
