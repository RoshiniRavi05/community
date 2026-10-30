'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Send, 
  Trash2, 
  X, 
  Copy, 
  Check, 
  Clock,
  Tag
} from 'lucide-react';
import { DiscountOffer, Campaign } from '@/lib/db/types';
import { formatWhatsAppDate } from '@/lib/utils';

interface DiscountsViewProps {
  discounts: DiscountOffer[];
  onOpenScheduleModal: (initial?: Partial<Campaign>) => void;
  onAddDiscount: (disc: Partial<DiscountOffer>) => Promise<void>;
  onDeleteDiscount: (discId: string) => Promise<void>;
}

export const DiscountsView: React.FC<DiscountsViewProps> = ({
  discounts,
  onOpenScheduleModal,
  onAddDiscount,
  onDeleteDiscount
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed'>('percentage');
  const [newValue, setNewValue] = useState(20);
  const [newValidUntil, setNewValidUntil] = useState('2026-11-05T23:59');
  const [newLimit, setNewLimit] = useState(50);
  const [newDescription, setNewDescription] = useState('');

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleBroadcastDiscount = (disc: DiscountOffer) => {
    const text = `*Community Discount: ${disc.title}*\n\nEnjoy ${disc.discountType === 'percentage' ? `${disc.discountValue}% off` : `₹${disc.discountValue} flat discount`} on upcoming workshops.\n\nPromo code: ${disc.code}\nValid until: ${formatWhatsAppDate(disc.validUntil)}\n\nClaim here: https://example.com/offers\n\nLimited to first ${disc.usageLimit} redemptions. Reply STOP to opt out.`;

    onOpenScheduleModal({
      title: `Promo: ${disc.code} (${disc.discountValue}% Off)`,
      category: 'discount_offer',
      message: text,
      mediaUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
      mediaType: 'image',
      targetSegmentId: 'seg_discount'
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCode) {
      alert('Title and Promo Code are required');
      return;
    }

    await onAddDiscount({
      title: newTitle,
      code: newCode.toUpperCase().trim(),
      discountType: newType,
      discountValue: Number(newValue),
      validUntil: new Date(newValidUntil).toISOString(),
      usageLimit: Number(newLimit),
      usedCount: 0,
      description: newDescription,
      status: 'active'
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewCode('');
    setNewDescription('');
  };

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Discounts & Community Offers
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure member coupons, redemption limits, and promotional broadcasts
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#c2f83a] hover:bg-[#b5ee2e] text-slate-950 text-xs font-semibold transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Code</span>
        </button>
      </div>

      {/* Practical Table */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1b2537] bg-[#0e1420] text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Promo Code</th>
                <th className="py-3 px-4">Offer Title</th>
                <th className="py-3 px-4">Discount Rate</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4">Usage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2537]/50 text-slate-200">
              {discounts.map(disc => {
                const isExpired = new Date(disc.validUntil).getTime() < Date.now();
                return (
                  <tr key={disc.id} className="hover:bg-[#161f30] transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap align-top">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-[#c2f83a] bg-[#141d2c] px-2 py-1 rounded-md border border-[#23334d]">
                          {disc.code}
                        </span>
                        <button
                          onClick={() => handleCopy(disc.code)}
                          className="text-slate-400 hover:text-white p-1 rounded transition"
                          title="Copy code"
                        >
                          {copiedCode === disc.code ? (
                            <Check className="w-3.5 h-3.5 text-[#c2f83a]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs align-top">
                      <div className="font-semibold text-white text-[13px]">{disc.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{disc.description}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[#38bdf8] align-top">
                      {disc.discountType === 'percentage' ? `${disc.discountValue}% OFF` : `₹${disc.discountValue} OFF`}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px] align-top">
                      {formatWhatsAppDate(disc.validUntil)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300 align-top">
                      {disc.usedCount} / {disc.usageLimit}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap align-top">
                      {isExpired ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#1e293b] text-slate-400 border border-[#2b3952]">
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#162725] text-[#c2f83a] border border-[#c2f83a]/30">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2 align-top">
                      <button
                        onClick={() => handleBroadcastDiscount(disc)}
                        disabled={isExpired}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#1a2538] hover:bg-[#22314a] text-[#c2f83a] border border-[#c2f83a]/30 transition disabled:opacity-40"
                      >
                        Broadcast Promo
                      </button>
                      <button
                        onClick={() => onDeleteDiscount(disc.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-400 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {discounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No discount codes created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#121826] border border-[#1b2537] rounded-xl w-full max-w-md p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2537] mb-4">
              <h3 className="text-sm font-semibold text-white">
                Create Discount Code
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Offer Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Early Bird Camp Discount"
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FLASH25"
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-[#c2f83a]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#c2f83a]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#c2f83a]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Redemption Limit</label>
                  <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(Number(e.target.value))}
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#c2f83a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Valid Until *</label>
                <input
                  type="datetime-local"
                  required
                  value={newValidUntil}
                  onChange={(e) => setNewValidUntil(e.target.value)}
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#c2f83a]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Terms / Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Terms or conditions..."
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                />
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
                  Create Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
