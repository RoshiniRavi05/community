'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  MessageCircle,
  Clock,
  Tent,
  Copy,
  Check
} from 'lucide-react';
import { Member, AudienceSegment, MessageLog, MembershipStatus } from '@/lib/db/types';
import { formatWhatsAppDate, formatPhoneNumber } from '@/lib/utils';

interface MembersViewProps {
  members: Member[];
  segments: AudienceSegment[];
  messageLogs: MessageLog[];
  onSaveMember: (member: Partial<Member>) => Promise<void>;
  onRemoveMember?: (memberId: string) => Promise<void>;
  onImportCsv: (members: Partial<Member>[]) => Promise<void>;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  segments,
  messageLogs,
  onSaveMember,
  onRemoveMember,
  onImportCsv
}) => {
  // Top Filter States (Recreating Wireframe 2)
  const [search, setSearch] = useState('');
  const [selectedCamp, setSelectedCamp] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [selectedMembershipStatus, setSelectedMembershipStatus] = useState<string>('all');

  // UI state
  const [maskPhones, setMaskPhones] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selection state
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('+91');
  const [formAge, setFormAge] = useState<number | ''>('');
  const [formGender, setFormGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [formLocation, setFormLocation] = useState('');
  const [formPreferredCamp, setFormPreferredCamp] = useState('Tiruppur Central Hub');
  const [formInterests, setFormInterests] = useState('');
  const [formPreferences, setFormPreferences] = useState('WhatsApp Announcements');
  const [formMembershipStatus, setFormMembershipStatus] = useState<MembershipStatus>('invitation_sent');
  const [formConsent, setFormConsent] = useState<'opted_in' | 'opted_out' | 'unspecified'>('opted_in');
  const [formNotes, setFormNotes] = useState('');
  const [formFilterMode, setFormFilterMode] = useState<'camp' | 'referral'>('camp');
  const [formError, setFormError] = useState<string | null>(null);

  // Extract distinct camp locations from existing records for the dropdown filter
  const availableCamps = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      if (m.campLocation) set.add(m.campLocation);
      if (m.preferredCamp) set.add(m.preferredCamp);
    });
    set.add('Tiruppur Central Hub');
    set.add('Palladam Camp Hub');
    set.add('Avinashi STEM Center');
    set.add('Uthukuli Camp Hub');
    set.add('Kangeyam Outreach Center');
    return Array.from(set).sort();
  }, [members]);

  // Filtering Logic
  const filteredMembers = useMemo(() => {
    const now = new Date();
    return members.filter(m => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = 
          m.name.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.location.toLowerCase().includes(q) ||
          (m.campLocation && m.campLocation.toLowerCase().includes(q)) ||
          (m.preferredCamp && m.preferredCamp.toLowerCase().includes(q)) ||
          (m.interests && m.interests.some(i => i.toLowerCase().includes(q)));
        if (!matches) return false;
      }

      // Camp filter
      if (selectedCamp !== 'all') {
        const c1 = (m.campLocation || '').toLowerCase();
        const c2 = (m.preferredCamp || '').toLowerCase();
        const target = selectedCamp.toLowerCase();
        if (!c1.includes(target) && !c2.includes(target)) return false;
      }

      // Age filter
      if (selectedAge !== 'all') {
        const age = m.age;
        if (selectedAge === 'under_18' && (age === undefined || age >= 18)) return false;
        if (selectedAge === '18_25' && (age === undefined || age < 18 || age > 25)) return false;
        if (selectedAge === '26_35' && (age === undefined || age < 26 || age > 35)) return false;
        if (selectedAge === '36_50' && (age === undefined || age < 36 || age > 50)) return false;
        if (selectedAge === '50_plus' && (age === undefined || age <= 50)) return false;
      }

      // Gender filter
      if (selectedGender !== 'all' && m.gender !== selectedGender) {
        return false;
      }

      // Membership Status filter
      if (selectedMembershipStatus !== 'all' && m.membershipStatus !== selectedMembershipStatus) {
        return false;
      }

      // Date filter
      if (selectedDateFilter !== 'all') {
        const added = new Date(m.dateAdded).getTime();
        const diffDays = (now.getTime() - added) / (1000 * 3600 * 24);
        if (selectedDateFilter === '7_days' && diffDays > 7) return false;
        if (selectedDateFilter === '30_days' && diffDays > 30) return false;
        if (selectedDateFilter === '90_days' && diffDays > 90) return false;
      }

      return true;
    });
  }, [members, search, selectedCamp, selectedAge, selectedGender, selectedMembershipStatus, selectedDateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedMemberIds.size === filteredMembers.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(filteredMembers.map(m => m.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedMemberIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMemberIds(next);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormPhone('+91');
    setFormAge('');
    setFormGender('prefer_not_to_say');
    setFormLocation('Tiruppur');
    setFormPreferredCamp('Tiruppur Central Hub');
    setFormInterests('Community, Health');
    setFormPreferences('WhatsApp Announcements');
    setFormMembershipStatus('invitation_sent');
    setFormConsent('opted_in');
    setFormNotes('');
    setFormFilterMode('camp');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormPhone(m.phone);
    setFormAge(m.age || '');
    setFormGender(m.gender);
    setFormLocation(m.location);
    setFormPreferredCamp(m.preferredCamp || m.campLocation || 'Tiruppur Central Hub');
    setFormInterests(m.interests.join(', '));
    setFormPreferences(m.communicationPreferences?.join(', ') || 'WhatsApp Announcements');
    setFormMembershipStatus(m.membershipStatus || 'registered');
    setFormConsent(m.consentStatus);
    setFormNotes(m.notes || '');
    setFormFilterMode(m.preferredCamp === 'Referral' || m.campLocation === 'Referral' ? 'referral' : 'camp');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Submit Member Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Full name is required');
      return;
    }
    const cleanPhone = formPhone.replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid WhatsApp phone number (with country code)');
      return;
    }

    // Check duplicate phone if creating
    if (!editingMember) {
      const isDup = members.some(m => m.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''));
      if (isDup) {
        setFormError('A member with this WhatsApp phone number already exists.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const interestsArray = formInterests
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const prefArray = formPreferences
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload: Partial<Member> = {
        id: editingMember?.id,
        name: formName.trim(),
        phone: cleanPhone,
        age: formAge === '' ? undefined : Number(formAge),
        ageRange: formAge === '' ? undefined : Number(formAge) < 18 ? '<18' : Number(formAge) <= 25 ? '18-25' : Number(formAge) <= 35 ? '26-35' : Number(formAge) <= 50 ? '36-50' : '50+',
        gender: formGender,
        location: formLocation.trim() || 'Unknown',
        preferredCamp: formFilterMode === 'camp' ? formPreferredCamp : 'Referral',
        campLocation: formFilterMode === 'camp' ? formPreferredCamp : 'Referral',
        interests: interestsArray.length > 0 ? interestsArray : ['General Community'],
        communicationPreferences: prefArray,
        membershipStatus: formMembershipStatus,
        consentStatus: formConsent,
        verificationStatus: formMembershipStatus === 'joined_community' ? 'verified' : editingMember?.verificationStatus || 'unverified',
        notes: formNotes.trim()
      };

      await onSaveMember(payload);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save member record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Member Confirm
  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setIsSubmitting(true);
    try {
      if (onRemoveMember) {
        await onRemoveMember(memberToDelete.id);
      } else {
        await onSaveMember({ id: memberToDelete.id, isUnsubscribed: true, membershipStatus: 'left_community' });
      }
      setMemberToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'ID', 'Name', 'Phone', 'Age', 'Gender', 'Location', 'Camp', 'MembershipStatus', 'ConsentStatus', 'DateAdded'
    ];
    const rows = filteredMembers.map(m => [
      m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      m.phone,
      m.age ?? '',
      m.gender,
      `"${m.location.replace(/"/g, '""')}"`,
      `"${(m.preferredCamp || m.campLocation || '').replace(/"/g, '""')}"`,
      m.membershipStatus || 'registered',
      m.consentStatus,
      m.dateAdded
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `community_members_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import CSV Submit
  const handleImportCsvSubmit = async () => {
    if (!csvText.trim()) return;
    setIsSubmitting(true);
    try {
      const lines = csvText.split('\n').filter(l => l.trim().length > 0);
      const parsed: Partial<Member>[] = [];
      const isHeader = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('phone');
      const dataLines = isHeader ? lines.slice(1) : lines;

      for (const line of dataLines) {
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 2) {
          const name = parts[0];
          const phone = parts[1];
          if (name && phone) {
            parsed.push({
              name,
              phone: phone.startsWith('+') ? phone : `+${phone}`,
              age: parts[2] ? Number(parts[2]) : undefined,
              gender: (parts[3] as any) || 'prefer_not_to_say',
              location: parts[4] || 'Tiruppur',
              preferredCamp: parts[5] || 'Tiruppur Central Hub',
              membershipStatus: 'invitation_sent',
              consentStatus: 'opted_in'
            });
          }
        }
      }

      await onImportCsv(parsed);
      setIsCsvModalOpen(false);
      setCsvText('');
    } catch (err: any) {
      alert(err.message || 'Failed to import CSV');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for Status Badges
  const renderMembershipStatusBadge = (status?: MembershipStatus) => {
    switch (status) {
      case 'joined_community':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#263323] hover:bg-[#1a2318]/15 text-[#27833A] border border-[#87936C]/30">
            Joined Community
          </span>
        );
      case 'invitation_sent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Invitation Sent
          </span>
        );
      case 'registered':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Registered
          </span>
        );
      case 'not_joined':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-[var(--text-main)] border border-slate-600/50">
            Not Joined
          </span>
        );
      case 'left_community':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-500/15 text-orange-300 border border-orange-500/30">
            Left Community
          </span>
        );
      case 'unverified':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            Unverified
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP CONTROLS (Wireframe 2) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-md p-3.5 space-y-3">
        {/* Top search & Add Button Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[var(--text-sub)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search members by name, phone, location, camp, or interests..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[var(--bg-app)] border border-[var(--border-card)] text-xs text-[var(--text-main)] placeholder:text-[var(--text-sub)] focus:outline-none focus:border-[#87936C]"
            />
          </div>

          {/* Action buttons: Export, Import, Add */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMaskPhones(!maskPhones)}
              title={maskPhones ? 'Show unmasked phone numbers' : 'Mask phone numbers for privacy'}
              className="p-1.5 rounded-md bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition text-xs"
            >
              {maskPhones ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-white transition text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-white transition text-xs font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#263323] hover:bg-[#1a2318] hover:bg-[#15803d] text-white text-xs font-medium shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Filters Row: By Camp, By Age, By Gender, By Date, By Status */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[var(--border-card)] text-xs">
          {/* Filter by Camp */}
          <div>
            <label className="block text-[10px] text-[var(--text-sub)] font-medium mb-1">
              By Camp
            </label>
            <select
              value={selectedCamp}
              onChange={(e) => {
                setSelectedCamp(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
            >
              <option value="all">All Camps</option>
              {availableCamps.map(camp => (
                <option key={camp} value={camp}>{camp}</option>
              ))}
            </select>
          </div>

          {/* Filter by Age */}
          <div>
            <label className="block text-[10px] text-[var(--text-sub)] font-medium mb-1">
              By Age
            </label>
            <select
              value={selectedAge}
              onChange={(e) => {
                setSelectedAge(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
            >
              <option value="all">All Ages</option>
              <option value="under_18">&lt; 18 yrs</option>
              <option value="18_25">18 – 25 yrs</option>
              <option value="26_35">26 – 35 yrs</option>
              <option value="36_50">36 – 50 yrs</option>
              <option value="50_plus">50+ yrs (Seniors)</option>
            </select>
          </div>

          {/* Filter by Gender */}
          <div>
            <label className="block text-[10px] text-[var(--text-sub)] font-medium mb-1">
              By Gender
            </label>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Unspecified</option>
            </select>
          </div>

          {/* Filter by Date */}
          <div>
            <label className="block text-[10px] text-[var(--text-sub)] font-medium mb-1">
              By Date
            </label>
            <select
              value={selectedDateFilter}
              onChange={(e) => {
                setSelectedDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
            >
              <option value="all">All Dates</option>
              <option value="7_days">Past 7 Days</option>
              <option value="30_days">Past 30 Days</option>
              <option value="90_days">Past 90 Days</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <label className="block text-[10px] text-[var(--text-sub)] font-medium mb-1">
              Membership Status
            </label>
            <select
              value={selectedMembershipStatus}
              onChange={(e) => {
                setSelectedMembershipStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
            >
              <option value="all">All Statuses</option>
              <option value="joined_community">Joined Community</option>
              <option value="invitation_sent">Invitation Sent</option>
              <option value="registered">Registered</option>
              <option value="left_community">Left Community</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        {/* Selection Bar */}
        {selectedMemberIds.size > 0 && (
          <div className="pt-2 border-t border-[var(--border-card)] flex items-center justify-between text-xs bg-[var(--bg-muted)]/60 px-3 py-1.5 rounded">
            <span className="text-[var(--text-main)] font-medium">
              {selectedMemberIds.size} of {filteredMembers.length} members selected for targeted audience
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedMemberIds(new Set())}
                className="text-[var(--text-sub)] hover:text-[var(--text-main)] underline text-[11px]"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. MEMBERS TABLE (Wireframe 2) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-app)] text-[10px] text-[var(--text-sub)] uppercase font-semibold border-b border-[var(--border-card)]">
              <tr>
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.size === filteredMembers.length && filteredMembers.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded bg-[var(--bg-card)] border-[var(--border-card)] text-[#16a34a] focus:ring-0"
                  />
                </th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">WhatsApp Number</th>
                <th className="py-2.5 px-3">Age</th>
                <th className="py-2.5 px-3">Gender</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Camp</th>
                <th className="py-2.5 px-3">Membership Status</th>
                <th className="py-2.5 px-3">Consent</th>
                <th className="py-2.5 px-3">Date Added</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-card)]/60">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[var(--text-sub)] text-xs">
                    No community members found matching the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const isSelected = selectedMemberIds.has(member.id);
                  const displayPhone = maskPhones
                    ? member.phone.slice(0, 5) + '••••' + member.phone.slice(-2)
                    : member.phone;

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-[var(--bg-card-hover)] transition-colors ${isSelected ? 'bg-[#263323] hover:bg-[#1a2318]/5' : ''}`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(member.id)}
                          className="rounded bg-[var(--bg-card)] border-[var(--border-card)] text-[#16a34a] focus:ring-0"
                        />
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3 font-medium text-[var(--text-main)] whitespace-nowrap">
                        {member.name}
                      </td>

                      {/* Phone */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--text-main)] whitespace-nowrap">
                        {displayPhone}
                      </td>

                      {/* Age */}
                      <td className="py-2.5 px-3 text-[var(--text-sub)] font-mono">
                        {member.age ?? '—'}
                      </td>

                      {/* Gender */}
                      <td className="py-2.5 px-3 text-[var(--text-sub)] capitalize whitespace-nowrap">
                        {member.gender.replace(/_/g, ' ')}
                      </td>

                      {/* Location */}
                      <td className="py-2.5 px-3 text-[var(--text-main)] max-w-[120px] truncate" title={member.location}>
                        {member.location}
                      </td>

                      {/* Camp */}
                      <td className="py-2.5 px-3 text-[var(--text-main)] max-w-[140px] truncate" title={member.preferredCamp || member.campLocation}>
                        <div className="flex items-center gap-1 truncate">
                          <Tent className="w-3 h-3 text-[#27833A] shrink-0" />
                          <span className="truncate">{member.preferredCamp || member.campLocation || '—'}</span>
                        </div>
                      </td>

                      {/* Membership Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {renderMembershipStatusBadge(member.membershipStatus)}
                      </td>

                      {/* Consent Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {member.consentStatus === 'opted_in' ? (
                          <span className="inline-flex items-center text-[10px] text-emerald-400 gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Opted In</span>
                          </span>
                        ) : member.consentStatus === 'opted_out' ? (
                          <span className="inline-flex items-center text-[10px] text-rose-400 gap-1 font-medium">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>Opted Out</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-sub)]">Unspecified</span>
                        )}
                      </td>

                      {/* Date Added */}
                      <td className="py-2.5 px-3 font-mono text-[10px] text-[var(--text-sub)] whitespace-nowrap">
                        {new Date(member.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingMember(member)}
                            title="View Details"
                            className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(member)}
                            title="Edit Member"
                            className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)] transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMemberToDelete(member)}
                            title="Remove Member"
                            className="p-1 rounded text-[var(--text-sub)] hover:text-rose-400 hover:bg-rose-950/20 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-4 py-2.5 border-t border-[var(--border-card)] bg-[var(--bg-app)] flex items-center justify-between text-xs text-[var(--text-sub)]">
          <div>
            Showing {filteredMembers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredMembers.length)} of {filteredMembers.length} members
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs px-2 text-[var(--text-main)]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] disabled:opacity-40 transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. ADD / EDIT MEMBER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-[var(--border-card)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  {editingMember ? 'Edit Community Member' : 'Add Community Member'}
                </h3>
                <p className="text-[11px] text-[var(--text-sub)]">
                  {editingMember ? 'Update member details and consent tracking' : 'Register a new member with camp affiliation and WhatsApp invite'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--text-sub)] hover:text-[var(--text-main)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  />
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">
                    WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs font-mono focus:outline-none focus:border-[#87936C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Age */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 28"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs font-mono focus:outline-none focus:border-[#87936C]"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">
                    Gender
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Tiruppur"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  />
                </div>
              </div>

              {/* Registration Mode / Filter Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <label className="flex items-center text-xs text-[var(--text-main)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formFilterMode === 'camp'}
                      onChange={() => setFormFilterMode('camp')}
                      className="mr-1.5 rounded accent-[#16a34a]"
                    />
                    By Camp
                  </label>
                  <label className="flex items-center text-xs text-[var(--text-main)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formFilterMode === 'referral'}
                      onChange={() => setFormFilterMode('referral')}
                      className="mr-1.5 rounded accent-[#16a34a]"
                    />
                    By Referral
                  </label>
                </div>

                {/* Conditional Camp Selection */}
                {formFilterMode === 'camp' && (
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">
                      Preferred Camp / Center
                    </label>
                    <select
                      value={formPreferredCamp}
                      onChange={(e) => setFormPreferredCamp(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                    >
                      {availableCamps.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Membership Status & Consent */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border-card)]">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">
                    Membership Status
                  </label>
                  <select
                    value={formMembershipStatus}
                    onChange={(e) => setFormMembershipStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  >
                    <option value="registered">Registered</option>
                    <option value="invitation_sent">Invitation Sent</option>
                    <option value="joined_community">Joined Community</option>
                    <option value="not_joined">Not Joined</option>
                    <option value="left_community">Left Community</option>
                    <option value="unverified">Unverified</option>
                  </select>
                  <p className="text-[10px] text-[var(--text-sub)] mt-1">
                    Note: Only set to Joined Community upon actual confirmation.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">
                    Communication Consent
                  </label>
                  <select
                    value={formConsent}
                    onChange={(e) => setFormConsent(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  >
                    <option value="opted_in">Opted In (Voluntary consent)</option>
                    <option value="opted_out">Opted Out (Do not message)</option>
                    <option value="unspecified">Unspecified</option>
                  </select>
                </div>
              </div>

              {/* Form buttons */}
              <div className="pt-3 border-t border-[var(--border-card)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-white transition text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-[#263323] hover:bg-[#1a2318] hover:bg-[#15803d] text-white transition text-xs font-medium shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingMember ? 'Update Member' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. REMOVE MEMBER CONFIRMATION DIALOG (Wireframe 2) */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  Confirm Member Removal
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">
                  Are you sure you want to remove <strong className="text-[var(--text-main)]">{memberToDelete.name}</strong> ({memberToDelete.phone})?
                </p>
              </div>
            </div>

            <div className="bg-[var(--bg-app)] p-3 rounded border border-[var(--border-card)] text-[11px] text-[var(--text-sub)] space-y-1">
              <p className="font-semibold text-[var(--text-main)]">Effect of Removal:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Deletes record from community management database.</li>
                <li>Haults future automated campaign broadcasts.</li>
                <li>Creates an audit trail entry for this removal.</li>
              </ul>
              <p className="text-amber-400/90 pt-1 text-[10px]">
                Note: Removal from the live WhatsApp Community group requires admin removal in WhatsApp.
              </p>
            </div>

            {/* Wireframe 2 shows explicit Yes / No confirmation buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-1.5 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-white transition text-xs font-medium"
              >
                No, Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white transition text-xs font-medium shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW DETAILS MODAL */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[var(--border-card)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  Member Details
                </h3>
                <p className="text-[11px] text-[var(--text-sub)] font-mono">
                  {viewingMember.id}
                </p>
              </div>
              <button
                onClick={() => setViewingMember(null)}
                className="text-[var(--text-sub)] hover:text-[var(--text-main)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[var(--bg-app)] p-3 rounded border border-[var(--border-card)]">
                <div>
                  <span className="text-[10px] text-[var(--text-sub)] block">Name</span>
                  <span className="font-semibold text-[var(--text-main)]">{viewingMember.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-sub)] block">WhatsApp Number</span>
                  <span className="font-mono text-[var(--text-main)]">{viewingMember.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-sub)] block">Age & Gender</span>
                  <span className="text-[var(--text-main)]">{viewingMember.age ? `${viewingMember.age} yrs` : '—'} • {viewingMember.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-sub)] block">Location</span>
                  <span className="text-[var(--text-main)]">{viewingMember.location}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-sub)] block">Camp Affiliation</span>
                  <span className="text-[var(--text-main)]">{viewingMember.preferredCamp || viewingMember.campLocation || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-sub)] block">Membership Status</span>
                  <div className="mt-0.5">{renderMembershipStatusBadge(viewingMember.membershipStatus)}</div>
                </div>
              </div>

              {/* Interests & Communication */}
              <div className="space-y-1">
                <span className="text-[11px] text-[var(--text-sub)] font-medium block">Interests</span>
                <div className="flex flex-wrap gap-1">
                  {viewingMember.interests.map(i => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] text-[10px]">
                      {i}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {viewingMember.notes && (
                <div>
                  <span className="text-[11px] text-[var(--text-sub)] font-medium block">Notes & Details</span>
                  <p className="text-[var(--text-main)] bg-[var(--bg-app)] p-2.5 rounded border border-[var(--border-card)] text-xs">
                    {viewingMember.notes}
                  </p>
                </div>
              )}

              {/* WhatsApp Invitation Helper */}
              <div className="p-3 rounded bg-[#263323] hover:bg-[#1a2318]/10 border border-[#87936C]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#27833A] flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Community Invitation</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://chat.whatsapp.com/sampleInvite-${viewingMember.id}`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#263323] hover:bg-[#1a2318]/20 text-[#27833A] hover:bg-[#263323] hover:bg-[#1a2318]/30 transition"
                  >
                    {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-sub)]">
                  Send this invite link directly to {viewingMember.name} to welcome them into the community.
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--border-card)] flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-sub)] font-mono">
                  Added on {new Date(viewingMember.dateAdded).toLocaleString()}
                </span>
                <button
                  onClick={() => setViewingMember(null)}
                  className="px-3 py-1.5 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-white transition text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. CSV IMPORT MODAL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">Import Members from CSV</h3>
                <p className="text-[11px] text-[var(--text-sub)]">Paste CSV data (Name, Phone, Age, Gender, Location, Camp)</p>
              </div>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Name,Phone,Age,Gender,Location,Camp\nArun Kumar,+919842100111,28,male,Tiruppur,Tiruppur Central Hub\nDivya S,+919842200222,32,female,Palladam,Palladam Camp Hub`}
              className="w-full p-3 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs font-mono focus:outline-none focus:border-[#87936C]"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-[var(--text-sub)]">
                Duplicates with existing phone numbers will be safely skipped.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-white transition text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !csvText.trim()}
                  onClick={handleImportCsvSubmit}
                  className="px-4 py-1.5 rounded bg-[#263323] hover:bg-[#1a2318] hover:bg-[#15803d] text-white transition text-xs font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Importing...' : 'Upload & Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
