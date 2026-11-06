'use client';

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Send, 
  Trash2, 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  Search,
  Edit2,
  Eye,
  Tent,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { CampEvent, Campaign, CampStatus } from '@/lib/db/types';

interface CampsViewProps {
  camps: CampEvent[];
  onOpenScheduleModal: (initial?: Partial<Campaign>) => void;
  onAddCamp: (camp: Partial<CampEvent>) => Promise<void>;
  onDeleteCamp: (campId: string) => Promise<void>;
}

export const CampsView: React.FC<CampsViewProps> = ({
  camps,
  onOpenScheduleModal,
  onAddCamp,
  onDeleteCamp
}) => {
  // Top Filter States (Wireframe 4)
  const [search, setSearch] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<CampEvent | null>(null);
  const [viewingCamp, setViewingCamp] = useState<CampEvent | null>(null);
  const [campToDelete, setCampToDelete] = useState<CampEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State (Wireframe 4 & Section 8 requirements)
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'wellness' | 'coding' | 'sports' | 'art' | 'science'>('wellness');
  const [formDescription, setFormDescription] = useState('');
  const [formStartDate, setFormStartDate] = useState('2026-11-06');
  const [formEndDate, setFormEndDate] = useState('2026-11-08');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('17:00');
  const [formLocation, setFormLocation] = useState('Tiruppur Central Community Hall');
  const [formArea, setFormArea] = useState('Kumaran Road, Tiruppur');
  const [formRegLink, setFormRegLink] = useState('https://example.com/camps/tiruppur');
  const [formEligibility, setFormEligibility] = useState('Open to all community members & elderly seniors');
  const [formCapacity, setFormCapacity] = useState<number>(150);
  const [formFee, setFormFee] = useState('Free');
  const [formPromoImage, setFormPromoImage] = useState('https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80');
  const [formStatus, setFormStatus] = useState<CampStatus>('upcoming');
  const [formError, setFormError] = useState<string | null>(null);

  // Locations list extracted from camps
  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    camps.forEach(c => {
      if (c.venue) set.add(c.venue.includes('Tiruppur') ? 'Tiruppur' : c.venue.includes('Bangalore') ? 'Bangalore' : c.venue);
      if (c.area) set.add(c.area.includes('Tiruppur') ? 'Tiruppur' : c.area);
    });
    set.add('Tiruppur');
    set.add('Bangalore');
    set.add('Palladam');
    return Array.from(set);
  }, [camps]);

  // Filtering Logic
  const filteredCamps = useMemo(() => {
    const now = new Date();
    return camps.filter(camp => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = 
          camp.title.toLowerCase().includes(q) ||
          camp.subtitle.toLowerCase().includes(q) ||
          camp.venue.toLowerCase().includes(q) ||
          (camp.area && camp.area.toLowerCase().includes(q)) ||
          camp.description.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Location filter
      if (selectedLocation !== 'all') {
        const loc = selectedLocation.toLowerCase();
        const v = camp.venue.toLowerCase();
        const a = (camp.area || '').toLowerCase();
        if (!v.includes(loc) && !a.includes(loc)) return false;
      }

      // Camp Type filter
      if (selectedType !== 'all' && camp.category !== selectedType) {
        return false;
      }

      // Date filter
      if (selectedDateFilter !== 'all') {
        const start = new Date(camp.startDate);
        if (selectedDateFilter === 'upcoming' && start < now) return false;
        if (selectedDateFilter === 'this_month') {
          if (start.getMonth() !== now.getMonth() || start.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [camps, search, selectedLocation, selectedType, selectedDateFilter]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingCamp(null);
    setFormName('Free Blood Test & Health Screening Camp');
    setFormCategory('wellness');
    setFormDescription('Free diagnostic blood checkup, diabetic screening, and vitals checkup for community residents.');
    setFormStartDate('2026-11-06');
    setFormEndDate('2026-11-08');
    setFormStartTime('09:00');
    setFormEndTime('17:00');
    setFormLocation('Tiruppur Central Community Hall');
    setFormArea('Kumaran Road, Tiruppur');
    setFormRegLink('https://example.com/camps/tiruppur');
    setFormEligibility('Open to all community members & elderly seniors');
    setFormCapacity(150);
    setFormFee('Free');
    setFormPromoImage('https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80');
    setFormStatus('upcoming');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (c: CampEvent) => {
    setEditingCamp(c);
    setFormName(c.title);
    setFormCategory(c.category);
    setFormDescription(c.description);
    setFormStartDate(c.startDate);
    setFormEndDate(c.endDate);
    setFormStartTime(c.startTime || '09:00');
    setFormEndTime(c.endTime || '17:00');
    setFormLocation(c.venue);
    setFormArea(c.area || 'Tiruppur Area');
    setFormRegLink(c.registrationLink || 'https://example.com/camps');
    setFormEligibility(c.eligibilityCriteria || c.ageGroup);
    setFormCapacity(c.maxCapacity);
    setFormFee(c.fee);
    setFormPromoImage(c.promotionalImageUrl || '');
    setFormStatus(c.status);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formLocation.trim()) {
      setFormError('Camp Name and Location are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<CampEvent> = {
        id: editingCamp?.id,
        title: formName.trim(),
        subtitle: formDescription.slice(0, 80),
        category: formCategory,
        startDate: formStartDate,
        endDate: formEndDate,
        startTime: formStartTime,
        endTime: formEndTime,
        venue: formLocation.trim(),
        area: formArea.trim(),
        registrationLink: formRegLink.trim(),
        eligibilityCriteria: formEligibility.trim(),
        ageGroup: formEligibility.trim(),
        fee: formFee.trim(),
        maxCapacity: Number(formCapacity),
        promotionalImageUrl: formPromoImage.trim(),
        description: formDescription.trim(),
        status: formStatus
      };

      await onAddCamp(payload);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save camp');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Schedule WhatsApp Announcement for this camp
  const handleScheduleAnnouncement = (camp: CampEvent) => {
    const text = `*${camp.title}*\n\n${camp.description}\n\nDates: ${camp.startDate} to ${camp.endDate} (${camp.startTime || '09:00'} – ${camp.endTime || '17:00'})\nVenue: ${camp.venue}${camp.area ? `, ${camp.area}` : ''}\nEligibility: ${camp.eligibilityCriteria || camp.ageGroup}\nFee: ${camp.fee}\n\nRegister: ${camp.registrationLink || 'https://example.com/camps'}\n\nReply STOP to opt out.`;

    onOpenScheduleModal({
      title: `Camp Announcement: ${camp.title.slice(0, 30)}`,
      category: 'camp_event',
      message: text,
      mediaUrl: camp.promotionalImageUrl || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
      mediaType: 'image',
      targetSegmentId: 'seg_all'
    });
  };

  // Status Badge Helper
  const getCampStatusBadge = (status: CampStatus) => {
    switch (status) {
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E7EBD8] text-[#263323] border border-[#87936C]/30">
            Upcoming
          </span>
        );
      case 'registration_open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E7EBD8] text-[#27833A] border border-[#87936C]/40">
            Registration Open
          </span>
        );
      case 'full':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
            Full
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EAE8E3] text-[#85877F] border border-[var(--border-card)]">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EAE8E3] text-[#85877F] border border-[var(--border-card)]">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP TOOLBAR (Wireframe 4: Search Camps, Filter Date, Location, Type, +Add Camp) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-md p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[var(--text-sub)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search camps by name, venue, area (e.g. Tiruppur)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[var(--bg-app)] border border-[var(--border-card)] text-xs text-[var(--text-main)] placeholder:text-[var(--text-sub)] focus:outline-none focus:border-[#87936C]"
            />
          </div>

          {/* + Add Camp Button */}
          <button
            onClick={openAddModal}
            data-action="add-camp" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#87936C] hover:bg-[#77835c] text-white text-xs font-medium shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Camp</span>
          </button>
        </div>

        {/* Filters Row: By Date, Location, Camp Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[var(--border-card)] text-xs">
          {/* Filter by Date */}
          <div>
            <label className="block text-[10px] text-[var(--text-sub)] font-medium mb-1">
              Filter by Date
            </label>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming Camps Only</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          {/* Filter by Location */}
          <div>
            <label className="block text-[10px] text-[var(--text-sub)] font-medium mb-1">
              Filter by Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
            >
              <option value="all">All Locations</option>
              {availableLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Filter by Camp Type */}
          <div>
            <label className="block text-[10px] text-[var(--text-sub)] font-medium mb-1">
              Filter by Camp Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
            >
              <option value="all">All Types</option>
              <option value="wellness">Health & Diagnostic</option>
              <option value="coding">Coding & STEM</option>
              <option value="sports">Athletic & Sports</option>
              <option value="art">Digital Arts</option>
              <option value="science">Science</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. CAMPS TABLE (Wireframe 4) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs table-auto">
            <thead className="bg-[var(--bg-app)] text-[11px] text-[var(--text-sub)] uppercase font-semibold border-b border-[var(--border-card)]">
              <tr>
                <th className="py-3 px-4 w-[260px]">Camp Name</th>
                <th className="py-3 px-3 w-[100px]">Type</th>
                <th className="py-3 px-3 w-[160px]">Date & Time</th>
                <th className="py-3 px-4 min-w-[180px]">Location & Area</th>
                <th className="py-3 px-3 w-[110px]">Capacity</th>
                <th className="py-3 px-3 w-[110px]">Status</th>
                <th className="py-3 px-4 text-right w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-card)]/60">
              {filteredCamps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-sub)] text-xs">
                    No scheduled camps found matching filter parameters.
                  </td>
                </tr>
              ) : (
                filteredCamps.map((camp) => (
                  <tr key={camp.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    {/* Camp Name */}
                    <td className="py-3 px-4 font-medium text-[var(--text-main)]">
                      <div className="flex items-start gap-2.5">
                        <Tent className="w-4 h-4 text-[#87936C] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--text-main)] text-[12px] leading-snug line-clamp-1">{camp.title}</div>
                          <div className="text-[11px] text-[var(--text-sub)] leading-snug line-clamp-1 mt-0.5">{camp.subtitle}</div>
                        </div>
                      </div>
                    </td>

                    {/* Camp Type */}
                    <td className="py-3 px-3 text-[var(--text-main)] capitalize whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[10px] font-medium text-[var(--text-main)]">
                        {camp.category}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-3 text-[var(--text-main)] text-[11px] whitespace-nowrap">
                      <div className="font-medium text-[var(--text-main)]">{camp.startDate}</div>
                      <div className="text-[11px] text-[var(--text-sub)] mt-0.5">
                        {camp.startTime || '09:00'} – {camp.endTime || '17:00'}
                      </div>
                    </td>

                    {/* Location & Area */}
                    <td className="py-3 px-4 text-[var(--text-main)]">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#87936C] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--text-main)] text-[12px] leading-snug truncate">{camp.venue}</div>
                          {camp.area && <div className="text-[11px] text-[var(--text-sub)] truncate mt-0.5">{camp.area}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Capacity */}
                    <td className="py-3 px-3 text-[var(--text-main)] text-[11px] whitespace-nowrap">
                      <div className="font-semibold text-[var(--text-main)]">{camp.registeredCount} / {camp.maxCapacity}</div>
                      <div className="text-[10px] text-[var(--text-sub)] mt-0.5">Fee: {camp.fee}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getCampStatusBadge(camp.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleScheduleAnnouncement(camp)}
                          title="Schedule WhatsApp Announcement for this Camp"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--kpi-icon-bg)] hover:bg-[var(--bg-muted)] text-[var(--text-main)] border border-[var(--border-card)] text-[11px] font-medium transition cursor-pointer shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Announce</span>
                        </button>

                        <button
                          onClick={() => setViewingCamp(camp)}
                          title="View Camp Details"
                          className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(camp)}
                          title="Edit Camp"
                          className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-[var(--bg-muted)]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setCampToDelete(camp)}
                          title="Delete Camp"
                          className="p-1 rounded text-[var(--text-sub)] hover:text-rose-400 hover:bg-rose-950/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. ADD / EDIT CAMP MODAL (Wireframe 4 Form Fields) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-[var(--border-card)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  {editingCamp ? 'Edit Camp Event' : 'Add Camp Location & Details'}
                </h3>
                <p className="text-[11px] text-[var(--text-sub)]">
                  Configure outreach venue, schedule, and WhatsApp broadcast parameters
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Camp Name & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">Camp Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Free Blood Test Camp"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">Camp Type</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  >
                    <option value="wellness">Health & Diagnostic</option>
                    <option value="coding">Coding & STEM</option>
                    <option value="sports">Athletic & Sports</option>
                    <option value="art">Digital Arts</option>
                    <option value="science">Science</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Comprehensive diagnostic blood checkup, diabetic screening..."
                  className="w-full p-2 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                />
              </div>

              {/* Location & Area (Wireframe 4: Tiruppur, Area, Need to add camp location) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">Location / Venue *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Tiruppur Central Community Hall"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">Area / Landmark</label>
                  <input
                    type="text"
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    placeholder="e.g. Kumaran Road, Tiruppur"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  />
                </div>
              </div>

              {/* Dates & Times */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-sub)] mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-sub)] mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-sub)] mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-sub)] mb-1">End Time</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs font-mono"
                  />
                </div>
              </div>

              {/* Registration Link & Eligibility */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">Registration Link</label>
                  <input
                    type="text"
                    value={formRegLink}
                    onChange={(e) => setFormRegLink(e.target.value)}
                    placeholder="https://example.com/camps/tiruppur"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">Eligibility Criteria</label>
                  <input
                    type="text"
                    value={formEligibility}
                    onChange={(e) => setFormEligibility(e.target.value)}
                    placeholder="e.g. All community members & seniors"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  />
                </div>
              </div>

              {/* Capacity, Fee & Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs font-mono focus:outline-none focus:border-[#87936C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">Fee</label>
                  <input
                    type="text"
                    value={formFee}
                    onChange={(e) => setFormFee(e.target.value)}
                    placeholder="Free or ₹499"
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-main)] mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-card)] text-[var(--text-main)] text-xs focus:outline-none focus:border-[#87936C]"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="registration_open">Registration Open</option>
                    <option value="full">Full</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
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
                  className="px-4 py-1.5 rounded bg-[#87936C] hover:bg-[#77835c] hover:bg-[#15803d] text-white transition text-xs font-medium shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingCamp ? 'Update Camp' : 'Save Camp Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. VIEW CAMP DETAILS MODAL */}
      {viewingCamp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[var(--border-card)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">{viewingCamp.title}</h3>
                <p className="text-[11px] text-[var(--text-sub)] capitalize">{viewingCamp.category} Camp Event</p>
              </div>
              <button onClick={() => setViewingCamp(null)} className="text-[var(--text-sub)] hover:text-[var(--text-main)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-[var(--bg-app)] p-3 rounded border border-[var(--border-card)] space-y-2">
                <div>
                  <span className="text-[10px] text-[var(--text-sub)] block">Description</span>
                  <p className="text-[var(--text-main)] text-xs mt-0.5">{viewingCamp.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-card)]">
                  <div>
                    <span className="text-[10px] text-[var(--text-sub)] block">Venue & Location</span>
                    <span className="text-[var(--text-main)] font-medium">{viewingCamp.venue}</span>
                    {viewingCamp.area && <span className="text-[var(--text-sub)] block text-[10px]">{viewingCamp.area}</span>}
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-sub)] block">Schedule & Timings</span>
                    <span className="text-[var(--text-main)] font-mono text-[11px]">{viewingCamp.startDate} to {viewingCamp.endDate}</span>
                    <span className="text-[var(--text-sub)] block text-[10px]">{viewingCamp.startTime || '09:00'} – {viewingCamp.endTime || '17:00'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-card)]">
                  <div>
                    <span className="text-[10px] text-[var(--text-sub)] block">Attendance</span>
                    <span className="text-[var(--text-main)] font-mono">{viewingCamp.registeredCount} / {viewingCamp.maxCapacity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-sub)] block">Fee</span>
                    <span className="text-[var(--text-main)] font-medium">{viewingCamp.fee}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-sub)] block">Status</span>
                    <div className="mt-0.5">{getCampStatusBadge(viewingCamp.status)}</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const c = viewingCamp;
                    setViewingCamp(null);
                    handleScheduleAnnouncement(c);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#87936C] hover:bg-[#77835c] hover:bg-[#15803d] text-white text-xs font-medium shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Camp Announcement</span>
                </button>

                <button
                  onClick={() => setViewingCamp(null)}
                  className="px-3 py-1.5 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-white text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DELETE CAMP CONFIRMATION */}
      {campToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">Delete Camp Record</h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">
                  Are you sure you want to delete <strong className="text-[var(--text-main)]">{campToDelete.title}</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCampToDelete(null)}
                className="px-3.5 py-1.5 rounded bg-[var(--bg-muted)] border border-[var(--border-card)] text-[var(--text-main)] hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteCamp(campToDelete.id);
                  setCampToDelete(null);
                }}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-xs"
              >
                Delete Camp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
