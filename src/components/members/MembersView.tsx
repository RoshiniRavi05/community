'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Filter, 
  Eye, 
  EyeOff, 
  FileEdit, 
  History, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  MapPin
} from 'lucide-react';
import { Member, AudienceSegment, MessageLog } from '@/lib/db/types';
import { formatWhatsAppDate, formatPhoneNumber } from '@/lib/utils';

interface MembersViewProps {
  members: Member[];
  segments: AudienceSegment[];
  messageLogs: MessageLog[];
  onSaveMember: (member: Partial<Member>) => Promise<void>;
  onImportCsv: (members: Partial<Member>[]) => Promise<void>;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  segments,
  messageLogs,
  onSaveMember,
  onImportCsv
}) => {
  const [search, setSearch] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('all');
  const [selectedCampLocation, setSelectedCampLocation] = useState<string>('all');
  const [selectedConsent, setSelectedConsent] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'age' | 'gender' | 'campLocation' | 'lastMessageDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [maskPhones, setMaskPhones] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<Member>>({});
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Helper to detect if a member was generated from Tiruppur district
  const isTiruppurDistrict = (m: Member) => {
    const d = (m.district || '').toLowerCase();
    const c = (m.campLocation || '').toLowerCase();
    const l = (m.location || '').toLowerCase();
    const tiruppurKeywords = [
      'tiruppur', 
      'thirupur', 
      'tirupur', 
      'palladam', 
      'avinashi', 
      'dharapuram', 
      'kangeyam', 
      'udumalpet', 
      'uthukuli', 
      'vellakoil', 
      'madathukulam'
    ];
    return tiruppurKeywords.some(k => d.includes(k) || c.includes(k) || l.includes(k));
  };

  // Filter members by search, gender, age, camp location (Tirupur District), consent, and verification status
  const filteredMembers = members.filter(m => {
    if (search) {
      const q = search.toLowerCase();
      const match = m.name.toLowerCase().includes(q) || 
                    m.phone.includes(q) || 
                    m.location.toLowerCase().includes(q) ||
                    (m.campLocation && m.campLocation.toLowerCase().includes(q)) ||
                    (m.district && m.district.toLowerCase().includes(q)) ||
                    (m.leadSource && m.leadSource.toLowerCase().includes(q)) ||
                    m.interests.some(i => i.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Gender filter
    if (selectedGender !== 'all' && m.gender !== selectedGender) {
      return false;
    }

    // Age filter
    if (selectedAgeRange !== 'all') {
      const age = m.age;
      const range = m.ageRange;
      if (selectedAgeRange === 'under_18') {
        const match = (age !== undefined && age < 18) || range === '<18' || range === 'under_18';
        if (!match) return false;
      } else if (selectedAgeRange === '18_25') {
        const match = (age !== undefined && age >= 18 && age <= 25) || range === '18-25';
        if (!match) return false;
      } else if (selectedAgeRange === '26_35') {
        const match = (age !== undefined && age >= 26 && age <= 35) || range === '26-35';
        if (!match) return false;
      } else if (selectedAgeRange === '36_50') {
        const match = (age !== undefined && age >= 36 && age <= 50) || range === '36-50';
        if (!match) return false;
      } else if (selectedAgeRange === '50_plus') {
        const match = (age !== undefined && age > 50) || range === '50+' || range === '50_plus';
        if (!match) return false;
      }
    }

    // Camp Location in Tirupur District filter
    if (selectedCampLocation !== 'all') {
      if (selectedCampLocation === 'tiruppur_all') {
        if (!isTiruppurDistrict(m)) return false;
      } else if (selectedCampLocation === 'palladam') {
        const text = `${m.campLocation || ''} ${m.location || ''}`.toLowerCase();
        if (!text.includes('palladam')) return false;
      } else if (selectedCampLocation === 'avinashi') {
        const text = `${m.campLocation || ''} ${m.location || ''}`.toLowerCase();
        if (!text.includes('avinashi')) return false;
      } else if (selectedCampLocation === 'tiruppur_central') {
        const text = `${m.campLocation || ''} ${m.location || ''}`.toLowerCase();
        if (!text.includes('central') && !text.includes('kumaran') && !text.includes('tiruppur city')) return false;
      } else if (selectedCampLocation === 'dharapuram') {
        const text = `${m.campLocation || ''} ${m.location || ''}`.toLowerCase();
        if (!text.includes('dharapuram')) return false;
      } else if (selectedCampLocation === 'kangeyam') {
        const text = `${m.campLocation || ''} ${m.location || ''}`.toLowerCase();
        if (!text.includes('kangeyam')) return false;
      } else if (selectedCampLocation === 'udumalpet') {
        const text = `${m.campLocation || ''} ${m.location || ''}`.toLowerCase();
        if (!text.includes('udumalpet')) return false;
      } else if (selectedCampLocation === 'uthukuli') {
        const text = `${m.campLocation || ''} ${m.location || ''}`.toLowerCase();
        if (!text.includes('uthukuli')) return false;
      } else if (selectedCampLocation === 'non_tiruppur') {
        if (isTiruppurDistrict(m)) return false;
      }
    }

    if (selectedConsent !== 'all' && m.consentStatus !== selectedConsent) return false;
    if (selectedVerification !== 'all' && m.verificationStatus !== selectedVerification) return false;
    return true;
  });

  // Sort members
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortField === 'age') {
      const ageA = a.age ?? 0;
      const ageB = b.age ?? 0;
      return sortOrder === 'asc' ? ageA - ageB : ageB - ageA;
    }
    if (sortField === 'gender') {
      return sortOrder === 'asc' 
        ? a.gender.localeCompare(b.gender) 
        : b.gender.localeCompare(a.gender);
    }
    if (sortField === 'campLocation') {
      const locA = a.campLocation || a.location || '';
      const locB = b.campLocation || b.location || '';
      return sortOrder === 'asc' ? locA.localeCompare(locB) : locB.localeCompare(locA);
    }
    if (sortField === 'lastMessageDate') {
      const dateA = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
      const dateB = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }
    return sortOrder === 'asc'
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name);
  });

  const totalPages = Math.ceil(sortedMembers.length / pageSize) || 1;
  const paginatedMembers = sortedMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasActiveFilters = 
    search !== '' || 
    selectedGender !== 'all' || 
    selectedAgeRange !== 'all' || 
    selectedCampLocation !== 'all' || 
    selectedConsent !== 'all' || 
    selectedVerification !== 'all';

  const resetFilters = () => {
    setSearch('');
    setSelectedGender('all');
    setSelectedAgeRange('all');
    setSelectedCampLocation('all');
    setSelectedConsent('all');
    setSelectedVerification('all');
    setCurrentPage(1);
  };

  const handleSort = (field: 'name' | 'age' | 'gender' | 'campLocation' | 'lastMessageDate') => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatDisplayPhone = (phone: string) => {
    if (!maskPhones) return phone;
    // Mask middle digits: +91 98765 ••••
    if (phone.length > 8) {
      return phone.slice(0, 8) + ' ••••';
    }
    return phone;
  };

  const handleOpenAdd = () => {
    setEditingMember({
      name: '',
      phone: '+91',
      gender: 'prefer_not_to_say',
      age: 25,
      location: '',
      interests: [],
      preferredCategories: ['announcement'],
      verificationStatus: 'verified',
      consentStatus: 'opted_in',
      preferredChannel: 'whatsapp'
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember({ ...m });
    setIsEditing(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember.name || !editingMember.phone) {
      alert('Name and Phone number are required.');
      return;
    }
    const age = editingMember.age !== undefined && editingMember.age !== null && String(editingMember.age).trim() !== ''
      ? Number(editingMember.age) 
      : undefined;
    let computedRange = editingMember.ageRange;
    if (age !== undefined && !isNaN(age)) {
      if (age < 18) computedRange = '<18';
      else if (age <= 25) computedRange = '18-25';
      else if (age <= 35) computedRange = '26-35';
      else if (age <= 50) computedRange = '36-50';
      else computedRange = '50+';
    }
    await onSaveMember({ ...editingMember, age, ageRange: computedRange });
    setIsEditing(false);
  };

  const handleExportCsv = () => {
    const headers = ['Name', 'Phone', 'Age', 'Gender', 'Location', 'Camp Location', 'District', 'Lead Source', 'Consent Status', 'Verification', 'Last Contacted'];
    const rows = sortedMembers.map(m => [
      `"${m.name}"`,
      `"${m.phone}"`,
      m.age || '',
      m.gender,
      `"${m.location || ''}"`,
      `"${m.campLocation || ''}"`,
      `"${m.district || ''}"`,
      `"${m.leadSource || ''}"`,
      m.consentStatus,
      m.verificationStatus,
      m.lastMessageDate || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `community_members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Compact Toolbar in Dark Theme */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Filter by name, phone, camp location..."
              className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]/60 transition-colors"
            />
          </div>

          {/* Camp Location (Tirupur District Leads) Filter */}
          <div className="relative">
            <select
              value={selectedCampLocation}
              onChange={(e) => { setSelectedCampLocation(e.target.value); setCurrentPage(1); }}
              className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none transition-all font-medium cursor-pointer ${
                selectedCampLocation !== 'all'
                  ? 'bg-[#182738] border-[#c2f83a]/60 text-[#c2f83a] shadow-[0_0_10px_rgba(194,248,58,0.15)]'
                  : 'bg-[#141c2c] border-[#1e2a3c] text-slate-200 focus:border-[#c2f83a]/60'
              }`}
            >
              <option value="all">📍 All Camp Locations</option>
              <optgroup label="Tirupur District Camps (Lead Sources)">
                <option value="tiruppur_all">★ All Tirupur District Leads</option>
                <option value="palladam">Palladam Camp Hub</option>
                <option value="avinashi">Avinashi STEM Center</option>
                <option value="tiruppur_central">Tiruppur Central Hub</option>
                <option value="dharapuram">Dharapuram Camp Hub</option>
                <option value="kangeyam">Kangeyam Tech Camp</option>
                <option value="udumalpet">Udumalpet Innovation Camp</option>
                <option value="uthukuli">Uthukuli Camp Hub</option>
              </optgroup>
              <optgroup label="Other Regional Camps">
                <option value="non_tiruppur">Outside Tirupur District</option>
              </optgroup>
            </select>
          </div>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => { setSelectedGender(e.target.value); setCurrentPage(1); }}
            className="bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#c2f83a]/60"
          >
            <option value="all">All genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>

          {/* Age Filter */}
          <select
            value={selectedAgeRange}
            onChange={(e) => { setSelectedAgeRange(e.target.value); setCurrentPage(1); }}
            className="bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#c2f83a]/60"
          >
            <option value="all">All ages</option>
            <option value="under_18">Under 18</option>
            <option value="18_25">18 – 25 yrs</option>
            <option value="26_35">26 – 35 yrs</option>
            <option value="36_50">36 – 50 yrs</option>
            <option value="50_plus">50+ yrs</option>
          </select>

          {/* Consent Filter */}
          <select
            value={selectedConsent}
            onChange={(e) => { setSelectedConsent(e.target.value); setCurrentPage(1); }}
            className="bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#c2f83a]/60"
          >
            <option value="all">All consent</option>
            <option value="opted_in">Opted in</option>
            <option value="opted_out">Opted out (STOP)</option>
            <option value="unspecified">Unspecified</option>
          </select>

          {/* Verification Filter */}
          <select
            value={selectedVerification}
            onChange={(e) => { setSelectedVerification(e.target.value); setCurrentPage(1); }}
            className="bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#c2f83a]/60"
          >
            <option value="all">All verification</option>
            <option value="verified">Verified only</option>
            <option value="unverified">Unverified</option>
          </select>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-[#1a253a] transition"
              title="Reset all active filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Privacy Toggle */}
          <button
            onClick={() => setMaskPhones(!maskPhones)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition ${
              maskPhones 
                ? 'bg-[#1a253a] border-[#253650] text-[#c2f83a]' 
                : 'bg-[#141c2c] border-[#1e2a3c] text-slate-400 hover:bg-[#1a253a] hover:text-white'
            }`}
            title="Privacy mask for telephone numbers"
          >
            {maskPhones ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{maskPhones ? 'Masked' : 'Plain'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141c2c] hover:bg-[#1a253a] border border-[#1e2a3c] text-slate-200 text-xs font-semibold transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141c2c] hover:bg-[#1a253a] border border-[#1e2a3c] text-slate-200 text-xs font-semibold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black text-xs font-extrabold transition shadow-[0_0_15px_rgba(194,248,58,0.3)] active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add member</span>
          </button>
        </div>
      </div>

      {/* Camp Location / Tirupur District Filter Banner */}
      {selectedCampLocation !== 'all' && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#121f2d] border border-[#233d59] text-xs shadow-md">
          <div className="flex items-center gap-2 text-[#c2f83a]">
            <MapPin className="w-4 h-4 text-[#c2f83a] shrink-0" />
            <span className="font-bold">
              {selectedCampLocation === 'tiruppur_all' 
                ? 'Tirupur District Camp Leads Filter'
                : `Camp Lead Location: ${selectedCampLocation.toUpperCase()}`}
            </span>
            <span className="text-slate-300">
              — {filteredMembers.length} {filteredMembers.length === 1 ? 'lead identified' : 'leads identified'} from this outreach camp location
            </span>
          </div>
          <button
            onClick={() => setSelectedCampLocation('all')}
            className="text-slate-400 hover:text-white text-xs underline font-medium"
          >
            Clear Location Filter
          </button>
        </div>
      )}

      {/* Proper Data Table in Dark Theme */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1b2537] bg-[#0c121e]/80 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-white select-none transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'name' ? 'text-[#c2f83a]' : 'text-slate-600'}`} />
                  </div>
                </th>
                <th className="py-3 px-4">Phone number</th>
                <th 
                  onClick={() => handleSort('age')}
                  className="py-3 px-4 cursor-pointer hover:text-white select-none transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Age</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'age' ? 'text-[#c2f83a]' : 'text-slate-600'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('gender')}
                  className="py-3 px-4 cursor-pointer hover:text-white select-none transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Gender</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'gender' ? 'text-[#c2f83a]' : 'text-slate-600'}`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('campLocation')}
                  className="py-3 px-4 cursor-pointer hover:text-white select-none transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#c2f83a]" />
                    <span>Camp / Lead Origin</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'campLocation' ? 'text-[#c2f83a]' : 'text-slate-600'}`} />
                  </div>
                </th>
                <th className="py-3 px-4">Membership</th>
                <th className="py-3 px-4">Messaging consent</th>
                <th 
                  onClick={() => handleSort('lastMessageDate')}
                  className="py-3 px-4 cursor-pointer hover:text-white select-none transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Last contacted</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'lastMessageDate' ? 'text-[#c2f83a]' : 'text-slate-600'}`} />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2537] text-slate-300">
              {paginatedMembers.map(member => (
                <tr 
                  key={member.id} 
                  className={`hover:bg-[#162032]/70 transition-colors ${
                    member.isUnsubscribed ? 'opacity-60 bg-rose-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-4 whitespace-nowrap font-semibold text-white">
                    <div>{member.name}</div>
                    {member.location && (
                      <div className="text-[10px] text-slate-500 font-normal">{member.location}</div>
                    )}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300 text-[11px]">
                    {formatDisplayPhone(member.phone)}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono">
                    {member.age ? `${member.age}` : '—'}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-slate-300 capitalize">
                    {member.gender.replace('_', ' ')}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-200 text-xs">
                        {member.campLocation || member.location || 'Direct Lead'}
                      </span>
                      {isTiruppurDistrict(member) && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#c2f83a]/20 text-[#c2f83a] border border-[#c2f83a]/40 tracking-tight uppercase">
                          Tirupur
                        </span>
                      )}
                    </div>
                    {member.leadSource && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Lead: {member.leadSource}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {member.verificationStatus === 'verified' ? (
                      <span className="text-[#38bdf8] text-[11px] font-medium">Verified</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Unverified</span>
                    )}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {member.consentStatus === 'opted_in' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#c2f83a]/15 text-[#c2f83a] border border-[#c2f83a]/30">
                        Opted in
                      </span>
                    ) : member.consentStatus === 'opted_out' || member.isUnsubscribed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        Opted out
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Unspecified</span>
                    )}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                    {member.lastMessageDate ? formatWhatsAppDate(member.lastMessageDate) : 'Never'}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                    <button
                      onClick={() => setSelectedMember(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a253a] transition"
                      title="View history"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#c2f83a] hover:bg-[#1a253a] transition"
                      title="Edit member"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedMembers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div>No community members found matching current filters.</div>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#c2f83a] hover:underline"
                      >
                        Reset active filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="p-3.5 border-t border-[#1b2537] bg-[#0c121e]/50 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {paginatedMembers.length} of {filteredMembers.length} members
            {filteredMembers.length !== members.length && (
              <span className="text-slate-500 ml-1.5">({members.length} total)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#1e2a3c] bg-[#141c2c] hover:bg-[#1a253a] text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#1e2a3c] bg-[#141c2c] hover:bg-[#1a253a] text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Member History Drawer in Dark Theme */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-[#101726] border-l border-[#1b2537] p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#1b2537] mb-4">
                <div>
                  <h3 className="font-bold text-white text-base">{selectedMember.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedMember.phone}</p>
                </div>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a253a]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Details */}
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#0c121e] border border-[#1b2537]">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">City / Location</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{selectedMember.location || 'Not provided'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c121e] border border-[#1b2537]">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Camp / Lead Origin</span>
                    <span className="font-semibold text-[#c2f83a] mt-0.5 block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#c2f83a]" />
                      <span>{selectedMember.campLocation || 'Direct / Web'}</span>
                    </span>
                    {isTiruppurDistrict(selectedMember) && (
                      <span className="text-[10px] text-[#38bdf8] block font-mono mt-0.5">Tirupur District</span>
                    )}
                  </div>
                </div>

                {selectedMember.leadSource && (
                  <div className="p-3 rounded-xl bg-[#0c121e] border border-[#1b2537] text-xs">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Lead Source Event</span>
                    <span className="font-medium text-slate-300 mt-0.5 block">{selectedMember.leadSource}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#0c121e] border border-[#1b2537]">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">District</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{selectedMember.district || 'Not specified'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c121e] border border-[#1b2537]">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Consent status</span>
                    <span className="font-semibold text-[#c2f83a] capitalize mt-0.5 block">{selectedMember.consentStatus.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0c121e] border border-[#1b2537] text-xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold mb-1.5">Interests</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMember.interests.map((i, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-[#162032] border border-[#223046] text-slate-200 text-[11px]">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Communication Logs */}
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Message history
              </h4>

              <div className="space-y-2">
                {messageLogs.filter(l => l.recipientPhone === selectedMember.phone).length === 0 ? (
                  <div className="text-xs text-slate-500 p-4 text-center bg-[#0c121e] rounded-xl border border-[#1b2537]">
                    No messages sent to this recipient.
                  </div>
                ) : (
                  messageLogs.filter(l => l.recipientPhone === selectedMember.phone).map(log => (
                    <div key={log.id} className="p-3 rounded-xl bg-[#0c121e] border border-[#1b2537] text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span className="truncate max-w-[200px]">{log.campaignTitle}</span>
                        <span className="text-[10px] font-mono text-[#c2f83a] capitalize">{log.status}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{formatWhatsAppDate(log.timestamp)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedMember(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-[#162032] hover:bg-[#1f2b40] text-xs font-semibold text-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit / Add Modal in Dark Theme */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#101726] border border-[#1b2537] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2537] mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight">
                {editingMember.id ? 'Edit Member Record' : 'Add Community Member'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingMember.name || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#c2f83a]/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp Phone *</label>
                  <input
                    type="text"
                    required
                    value={editingMember.phone || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#c2f83a]/60"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gender</label>
                  <select
                    value={editingMember.gender || 'prefer_not_to_say'}
                    onChange={(e) => setEditingMember({ ...editingMember, gender: e.target.value as any })}
                    className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[#c2f83a]/60"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Age</label>
                  <input
                    type="number"
                    value={editingMember.age || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, age: Number(e.target.value) })}
                    placeholder="e.g. 28"
                    className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#c2f83a]/60"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City / Location</label>
                  <input
                    type="text"
                    value={editingMember.location || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, location: e.target.value })}
                    placeholder="e.g. Palladam / Bangalore"
                    className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#c2f83a]/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Camp Location (Lead Origin)</label>
                  <input
                    type="text"
                    value={editingMember.campLocation || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, campLocation: e.target.value })}
                    placeholder="e.g. Palladam Camp Hub"
                    list="camp-location-presets"
                    className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#c2f83a]/60"
                  />
                  <datalist id="camp-location-presets">
                    <option value="Palladam Camp Hub" />
                    <option value="Avinashi STEM Center" />
                    <option value="Tiruppur Central Hub" />
                    <option value="Dharapuram Camp Hub" />
                    <option value="Kangeyam Tech Camp" />
                    <option value="Udumalpet Innovation Camp" />
                    <option value="Uthukuli Camp Hub" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    value={editingMember.district || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, district: e.target.value })}
                    placeholder="e.g. Tiruppur"
                    list="district-presets"
                    className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#c2f83a]/60"
                  />
                  <datalist id="district-presets">
                    <option value="Tiruppur" />
                    <option value="Coimbatore" />
                    <option value="Erode" />
                    <option value="Salem" />
                    <option value="Bangalore Urban" />
                    <option value="Chennai" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lead Source Event / Drive</label>
                <input
                  type="text"
                  value={editingMember.leadSource || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, leadSource: e.target.value })}
                  placeholder="e.g. Palladam Robotics Workshop Registration"
                  className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#c2f83a]/60"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Interests (Comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editingMember.interests) ? editingMember.interests.join(', ') : ''}
                  onChange={(e) => setEditingMember({ ...editingMember, interests: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="Coding, AI, Camps"
                  className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#c2f83a]/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Messaging Consent</label>
                  <select
                    value={editingMember.consentStatus || 'opted_in'}
                    onChange={(e) => setEditingMember({ ...editingMember, consentStatus: e.target.value as any })}
                    className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[#c2f83a]/60"
                  >
                    <option value="opted_in">Opted in</option>
                    <option value="opted_out">Opted out</option>
                    <option value="unspecified">Unspecified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Membership Status</label>
                  <select
                    value={editingMember.verificationStatus || 'verified'}
                    onChange={(e) => setEditingMember({ ...editingMember, verificationStatus: e.target.value as any })}
                    className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[#c2f83a]/60"
                  >
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#1b2537] mt-5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#162032] font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black font-extrabold shadow-[0_0_15px_rgba(194,248,58,0.3)] transition"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal in Dark Theme */}
      {isCsvModalOpen && (
        <CsvImportModal
          isOpen={isCsvModalOpen}
          onClose={() => setIsCsvModalOpen(false)}
          onImport={onImportCsv}
        />
      )}
    </div>
  );
};

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (members: Partial<Member>[]) => Promise<void>;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [csvText, setCsvText] = useState(`Full Name,Phone Number,Age,Gender,Location,Camp Location,District,Lead Source,Interests
Vigneshwaran P,+919876510001,23,male,Palladam,Palladam Camp Hub,Tiruppur,Palladam Tech Camp Stall,Robotics;Coding
Deepa Pillai,+919876500002,29,female,Avinashi,Avinashi STEM Center,Tiruppur,District Education Expo,Kids Camps;Art
Ramesh Gupta,+919876500003,45,male,Mumbai,,,Direct Referral,Sports;Offers`);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessImport = async () => {
    setIsProcessing(true);
    try {
      const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        alert('CSV must contain a header line and at least one data row.');
        setIsProcessing(false);
        return;
      }

      const dataRows = lines.slice(1);
      const imported: Partial<Member>[] = [];

      for (const row of dataRows) {
        const parts = row.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          const hasExtendedCampFields = parts.length >= 8;
          imported.push({
            name: parts[0],
            phone: parts[1],
            age: parts[2] ? Number(parts[2]) : undefined,
            gender: (parts[3] as any) || 'prefer_not_to_say',
            location: parts[4] || 'Unknown',
            campLocation: hasExtendedCampFields && parts[5] ? parts[5] : undefined,
            district: hasExtendedCampFields && parts[6] ? parts[6] : undefined,
            leadSource: hasExtendedCampFields && parts[7] ? parts[7] : undefined,
            interests: (hasExtendedCampFields ? parts[8] : parts[5])
              ? (hasExtendedCampFields ? parts[8] : parts[5]).split(';').map(s => s.trim())
              : ['General'],
            consentStatus: 'opted_in',
            verificationStatus: 'verified'
          });
        }
      }

      await onImport(imported);
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error processing CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#101726] border border-[#1b2537] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2537] mb-3">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Import Members via CSV
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-slate-400">
            Paste CSV text with columns: <code className="text-[#c2f83a] font-mono">Full Name, Phone Number, Age, Gender, Location, Camp Location, District, Lead Source, Interests</code>.
          </p>

          <textarea
            rows={7}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full bg-[#141c2c] border border-[#1e2a3c] rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-[#c2f83a]/60"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#1b2537] mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition">
            Cancel
          </button>
          <button
            onClick={handleProcessImport}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-[#c2f83a] hover:bg-[#b0e82e] text-black text-xs font-extrabold shadow-[0_0_15px_rgba(194,248,58,0.3)] transition disabled:opacity-50"
          >
            {isProcessing ? 'Importing...' : 'Validate & Import'}
          </button>
        </div>
      </div>
    </div>
  );
};
