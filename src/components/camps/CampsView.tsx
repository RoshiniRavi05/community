'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Send, 
  Trash2, 
  X, 
  Calendar, 
  MapPin, 
  Users 
} from 'lucide-react';
import { CampEvent, Campaign } from '@/lib/db/types';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<'coding' | 'sports' | 'art' | 'science' | 'wellness'>('coding');
  const [newStartDate, setNewStartDate] = useState('2026-11-15');
  const [newEndDate, setNewEndDate] = useState('2026-11-22');
  const [newVenue, setNewVenue] = useState('Bangalore Innovation Hub');
  const [newAgeGroup, setNewAgeGroup] = useState('Ages 8-15');
  const [newFee, setNewFee] = useState('₹6,999');
  const [newCapacity, setNewCapacity] = useState(30);
  const [newDescription, setNewDescription] = useState('');

  const handleBroadcastAnnouncement = (camp: CampEvent) => {
    const text = `*${camp.title} is Open for Registration*\n\n${camp.subtitle}\n\nDates: ${camp.startDate} to ${camp.endDate}\nVenue: ${camp.venue}\nTarget: ${camp.ageGroup}\nFee: ${camp.fee}\n\nRSVP link: https://example.com/camps/${camp.id}\n\nOnly ${camp.maxCapacity - camp.registeredCount} spots remaining. Reply STOP to opt out.`;

    onOpenScheduleModal({
      title: `Camp Announcement: ${camp.title.slice(0, 30)}`,
      category: 'camp_event',
      message: text,
      mediaUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
      mediaType: 'image',
      targetSegmentId: 'seg_parents'
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newVenue) {
      alert('Title and Venue are required');
      return;
    }

    await onAddCamp({
      title: newTitle,
      subtitle: newSubtitle,
      category: newCategory,
      startDate: newStartDate,
      endDate: newEndDate,
      venue: newVenue,
      ageGroup: newAgeGroup,
      fee: newFee,
      maxCapacity: Number(newCapacity),
      registeredCount: 0,
      description: newDescription,
      status: 'upcoming'
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewSubtitle('');
    setNewDescription('');
  };

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Camps & Workshops
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage seasonal cohorts, registrations, and trigger WhatsApp broadcast campaigns
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#c2f83a] hover:bg-[#b5ee2e] text-slate-950 text-xs font-semibold transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create Camp</span>
        </button>
      </div>

      {/* Practical Table */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1b2537] bg-[#0e1420] text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Camp Name</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Age Group</th>
                <th className="py-3 px-4">Registration</th>
                <th className="py-3 px-4">Fee</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2537]/50 text-slate-200">
              {camps.map(camp => {
                const occupancyRate = Math.round((camp.registeredCount / camp.maxCapacity) * 100);
                return (
                  <tr key={camp.id} className="hover:bg-[#161f30] transition-colors">
                    <td className="py-3.5 px-4 max-w-xs align-top">
                      <div className="font-semibold text-white text-[13px]">{camp.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{camp.subtitle}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 align-top">
                      {camp.startDate} to {camp.endDate}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 align-top">
                      {camp.venue}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 align-top">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1e293b] text-slate-300 border border-[#2b3952]">
                        {camp.ageGroup}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap align-top">
                      <div className="font-mono text-slate-200 font-medium text-[11px]">
                        {camp.registeredCount} / {camp.maxCapacity} ({occupancyRate}%)
                      </div>
                      <div className="w-28 h-1.5 rounded-full bg-[#1e293b] mt-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${occupancyRate >= 90 ? 'bg-amber-400' : 'bg-[#c2f83a]'}`}
                          style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-white align-top">
                      {camp.fee}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2 align-top">
                      <button
                        onClick={() => handleBroadcastAnnouncement(camp)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#1a2538] hover:bg-[#22314a] text-[#c2f83a] border border-[#c2f83a]/30 transition"
                      >
                        Broadcast RSVP
                      </button>
                      <button
                        onClick={() => onDeleteCamp(camp.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-400 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {camps.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No active camps or workshops configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Camp Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#121826] border border-[#1b2537] rounded-xl w-full max-w-md p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2537] mb-4">
              <h3 className="text-sm font-semibold text-white">
                Create Camp Event
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Camp Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Winter Robotics Bootcamp"
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Subtitle</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="e.g. Build and take home an autonomous bot"
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#c2f83a]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#c2f83a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Venue</label>
                  <input
                    type="text"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. Indiranagar Hub"
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fee</label>
                  <input
                    type="text"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    placeholder="e.g. ₹6,999"
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Age Group</label>
                  <input
                    type="text"
                    value={newAgeGroup}
                    onChange={(e) => setNewAgeGroup(e.target.value)}
                    placeholder="e.g. Ages 9-15"
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#c2f83a]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#1b2537] mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#c2f83a] hover:bg-[#b5ee2e] text-slate-950 font-semibold transition shadow-md"
                >
                  Save Camp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
