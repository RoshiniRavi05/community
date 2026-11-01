'use client';

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  ExternalLink, 
  Trash2, 
  X,
  Play,
  Share2,
  Copy,
  Check,
  Search,
  Calendar,
  Send,
  Eye,
  Edit2,
  Clock,
  Video,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { SocialMediaPost, Campaign, SocialPostType, SocialSharingStatus } from '@/lib/db/types';

interface SocialMediaViewProps {
  posts: SocialMediaPost[];
  onOpenScheduleModal: (initial?: Partial<Campaign>) => void;
  onAddPost: (post: Partial<SocialMediaPost>) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
}

export const SocialMediaView: React.FC<SocialMediaViewProps> = ({
  posts,
  onOpenScheduleModal,
  onAddPost,
  onDeletePost
}) => {
  // Top Filter States (Wireframe 2 & Section 5: Search, Filter Platform, Filter Date, Add Post)
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'reel' | 'post' | 'short'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7_days' | '30_days' | '90_days'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);
  const [viewingPost, setViewingPost] = useState<SocialMediaPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<SocialMediaPost | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formPostType, setFormPostType] = useState<SocialPostType>('reel');
  const [formUrl, setFormUrl] = useState('');
  const [formThumbnail, setFormThumbnail] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');
  const [formCaption, setFormCaption] = useState('');
  const [formCategory, setFormCategory] = useState('Elderly Health & Care');
  const [formAuthor, setFormAuthor] = useState('@community_hub');
  const [formPublicationDate, setFormPublicationDate] = useState(new Date().toISOString().slice(0, 10));
  const [formSharingStatus, setFormSharingStatus] = useState<SocialSharingStatus>('not_shared');
  const [formError, setFormError] = useState<string | null>(null);

  // Filtering Logic
  const filteredPosts = useMemo(() => {
    const now = new Date();
    return posts.filter(p => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = 
          p.title.toLowerCase().includes(q) ||
          p.caption.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.url.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Platform / Post Type filter
      if (platformFilter !== 'all') {
        const type = p.postType || (p.platform === 'youtube' ? 'short' : p.url.includes('/reel/') ? 'reel' : 'post');
        if (type !== platformFilter) return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const d = new Date(p.publicationDate || p.dateAdded).getTime();
        const diffDays = (now.getTime() - d) / (1000 * 3600 * 24);
        if (dateFilter === '7_days' && diffDays > 7) return false;
        if (dateFilter === '30_days' && diffDays > 30) return false;
        if (dateFilter === '90_days' && diffDays > 90) return false;
      }

      return true;
    });
  }, [posts, search, platformFilter, dateFilter]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingPost(null);
    setFormTitle('');
    setFormPostType('reel');
    setFormUrl('');
    setFormThumbnail('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');
    setFormCaption('Simple daily health & wellness habits for community residents.');
    setFormCategory('Elderly Health & Care');
    setFormAuthor('@community_hub');
    setFormPublicationDate(new Date().toISOString().slice(0, 10));
    setFormSharingStatus('not_shared');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: SocialMediaPost) => {
    setEditingPost(p);
    setFormTitle(p.title);
    setFormPostType(p.postType || (p.platform === 'youtube' ? 'short' : 'reel'));
    setFormUrl(p.url);
    setFormThumbnail(p.thumbnailUrl);
    setFormCaption(p.caption);
    setFormCategory(p.category);
    setFormAuthor(p.authorHandle);
    setFormPublicationDate(p.publicationDate || p.dateAdded.slice(0, 10));
    setFormSharingStatus(p.sharingStatus || 'not_shared');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) {
      setFormError('Post Title and Video/Post URL are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const platform = formPostType === 'short' ? 'youtube' : 'instagram';
      const defaultText = `*New ${formPostType === 'reel' ? 'Reel' : formPostType === 'short' ? 'YouTube Short' : 'Post'} for Community*\n\n${formTitle}\n\n${formCaption}\n\nWatch here: ${formUrl}\n\nReply STOP to opt out.`;

      const payload: Partial<SocialMediaPost> = {
        id: editingPost?.id,
        title: formTitle.trim(),
        platform,
        postType: formPostType,
        sharingStatus: formSharingStatus,
        url: formUrl.trim(),
        thumbnailUrl: formThumbnail.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        caption: formCaption.trim(),
        category: formCategory.trim(),
        authorHandle: formAuthor.trim(),
        publicationDate: formPublicationDate,
        suggestedBroadcastText: defaultText
      };

      await onAddPost(payload);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save social media post');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Schedule Broadcast Workflow
  const handleScheduleBroadcast = (post: SocialMediaPost) => {
    const text = post.suggestedBroadcastText || 
      `*New ${post.postType === 'reel' ? 'Reel' : post.postType === 'short' ? 'Short' : 'Post'} for our Community*\n\n${post.title}\n\n${post.caption}\n\nWatch here: ${post.url}\n\nReply STOP to opt out.`;

    onOpenScheduleModal({
      title: `Social: ${post.title.slice(0, 30)}`,
      category: 'reel_video',
      message: text,
      mediaUrl: post.thumbnailUrl,
      mediaType: 'image',
      linkPreviewUrl: post.url,
      targetSegmentId: 'seg_all'
    });
  };

  // Copy Link
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Administrator-Assisted 1-Click WhatsApp Share
  const handleAdminAssistedShare = (post: SocialMediaPost) => {
    const shareText = `*${post.title}*\n\n${post.caption}\n\nWatch here: ${post.url}`;
    const encoded = encodeURIComponent(shareText);
    navigator.clipboard.writeText(shareText);
    window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Helper for Status Badge
  const getSharingBadge = (status?: SocialSharingStatus) => {
    switch (status) {
      case 'shared_to_community':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#16a34a]/15 text-[#22c55e] border border-[#16a34a]/30">
            Shared to Community
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Scheduled
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Pending Approval
          </span>
        );
      case 'not_shared':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-400 border border-slate-600/50">
            Not Shared
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP CONTROLS (Wireframe 2 bottom & Section 5: Search, Filter Platform, Filter Date, Add Post) */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-md p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search posts by title, caption, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[#090d16] border border-[#1e293b] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#16a34a]"
            />
          </div>

          {/* Add Post Button */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-medium shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Post</span>
          </button>
        </div>

        {/* Filters Row: By Platform & By Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#1e293b] text-xs">
          {/* Filter by Platform: Instagram Reels, Instagram Posts, YouTube Shorts */}
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-1">
              Filter by Platform & Format
            </label>
            <div className="inline-flex rounded-md bg-[#090d16] p-0.5 border border-[#1e293b] text-xs">
              {(['all', 'reel', 'post', 'short'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`px-3 py-1 rounded capitalize font-medium transition ${
                    platformFilter === p
                      ? 'bg-[#16a34a] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p === 'all' ? 'All Platforms' : p === 'reel' ? 'Instagram Reels' : p === 'post' ? 'Instagram Posts' : 'YouTube Shorts'}
                </button>
              ))}
            </div>
          </div>

          {/* Filter by Date */}
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-1">
              Filter by Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full sm:w-48 px-2 py-1 rounded bg-[#090d16] border border-[#1e293b] text-slate-200 text-xs focus:outline-none focus:border-[#16a34a]"
            >
              <option value="all">All Dates</option>
              <option value="7_days">Past 7 Days</option>
              <option value="30_days">Past 30 Days</option>
              <option value="90_days">Past 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. POSTS TABLE / LIST */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-[10px] text-slate-400 uppercase font-semibold border-b border-[#1e293b]">
              <tr>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3">Post Title</th>
                <th className="py-2.5 px-3">Caption</th>
                <th className="py-2.5 px-3">Published Date</th>
                <th className="py-2.5 px-3">WhatsApp Sharing Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No curated social posts found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => {
                  const type = post.postType || (post.platform === 'youtube' ? 'short' : 'reel');
                  const isCopied = copiedId === post.id;

                  return (
                    <tr key={post.id} className="hover:bg-[#151c2c] transition-colors">
                      {/* Platform */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[#162032] border border-[#273549] text-slate-300">
                          {type === 'short' ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-pink-500" />
                          )}
                          <span className="capitalize">{type === 'short' ? 'YouTube Short' : type === 'reel' ? 'Instagram Reel' : 'Instagram Post'}</span>
                        </span>
                      </td>

                      {/* Post Title */}
                      <td className="py-2.5 px-3 font-medium text-slate-100 max-w-[200px]">
                        <div className="truncate font-semibold">{post.title}</div>
                        <div className="text-[10px] text-slate-500 truncate">{post.authorHandle} • {post.category}</div>
                      </td>

                      {/* Caption */}
                      <td className="py-2.5 px-3 text-slate-400 max-w-[220px] truncate" title={post.caption}>
                        {post.caption}
                      </td>

                      {/* Publication Date */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                        {post.publicationDate || new Date(post.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* WhatsApp Sharing Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getSharingBadge(post.sharingStatus)}
                      </td>

                      {/* Actions: Edit, Preview, Schedule, Approve, Cancel, Copy Link, Admin Share */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Schedule Announcement */}
                          <button
                            onClick={() => handleScheduleBroadcast(post)}
                            title="Schedule Announcement in WhatsApp"
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#16a34a]/20 text-[#22c55e] hover:bg-[#16a34a]/30 text-[10px] font-medium transition"
                          >
                            <Send className="w-3 h-3" />
                            <span>Schedule</span>
                          </button>

                          {/* Admin-assisted 1-click WhatsApp Web share */}
                          <button
                            onClick={() => handleAdminAssistedShare(post)}
                            title="Administrator-Assisted 1-Click WhatsApp Share"
                            className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyLink(post.url, post.id)}
                            title="Copy Original Post URL"
                            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#1e293b]"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Preview */}
                          <button
                            onClick={() => setViewingPost(post)}
                            title="Preview Video & WhatsApp Message"
                            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#1e293b]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(post)}
                            title="Edit Post"
                            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#1e293b]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setPostToDelete(post)}
                            title="Delete Post"
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/20"
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
      </div>

      {/* 3. ADD / EDIT POST MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#1e293b] rounded-lg max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[#1e293b] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  {editingPost ? 'Edit Social Post' : 'Add Published Reel / Short'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Prepare short-form media releases for WhatsApp Community dispatches
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-200">
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

              {/* Title & Platform */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Post Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. 5 Daily Elder Care Habits"
                    className="w-full px-2.5 py-1.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-100 text-xs focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Platform / Format</label>
                  <select
                    value={formPostType}
                    onChange={(e) => setFormPostType(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-200 text-xs focus:outline-none focus:border-[#16a34a]"
                  >
                    <option value="reel">Instagram Reel</option>
                    <option value="post">Instagram Post</option>
                    <option value="short">YouTube Short</option>
                  </select>
                </div>
              </div>

              {/* URL & Thumbnail */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Original Video / Post URL *</label>
                  <input
                    type="url"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://instagram.com/reel/..."
                    className="w-full px-2.5 py-1.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-100 text-xs focus:outline-none focus:border-[#16a34a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Thumbnail URL</label>
                  <input
                    type="url"
                    value={formThumbnail}
                    onChange={(e) => setFormThumbnail(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-100 text-xs focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Caption / Summary</label>
                <textarea
                  rows={3}
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  placeholder="Short engaging caption to be sent with the WhatsApp announcement..."
                  className="w-full p-2.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-100 text-xs focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              {/* Category, Date & Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Health & Care"
                    className="w-full px-2.5 py-1.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Publication Date</label>
                  <input
                    type="date"
                    value={formPublicationDate}
                    onChange={(e) => setFormPublicationDate(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-[#090d16] border border-[#1e293b] text-slate-100 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">WhatsApp Status</label>
                  <select
                    value={formSharingStatus}
                    onChange={(e) => setFormSharingStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded bg-[#090d16] border border-[#1e293b] text-slate-200 text-xs"
                  >
                    <option value="not_shared">Not Shared</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="shared_to_community">Shared to Community</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#162032] border border-[#273549] text-slate-300 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-medium shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingPost ? 'Update Post' : 'Save Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PREVIEW MODAL */}
      {viewingPost && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#1e293b] rounded-lg max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-[#1e293b] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-100">{viewingPost.title}</h4>
                <p className="text-[10px] text-slate-400 capitalize">{viewingPost.postType || viewingPost.platform}</p>
              </div>
              <button onClick={() => setViewingPost(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="aspect-video w-full rounded bg-black/50 overflow-hidden relative">
                <img
                  src={viewingPost.thumbnailUrl}
                  alt={viewingPost.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <a
                    href={viewingPost.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-full bg-white/20 backdrop-blur-xs text-white hover:scale-110 transition"
                  >
                    <Play className="w-6 h-6 fill-white" />
                  </a>
                </div>
              </div>

              <div className="bg-[#090d16] p-3 rounded border border-[#1e293b] space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Suggested WhatsApp Announcement:</div>
                <p className="text-slate-200 whitespace-pre-wrap font-sans text-xs">
                  {viewingPost.suggestedBroadcastText || viewingPost.caption}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const p = viewingPost;
                    setViewingPost(null);
                    handleScheduleBroadcast(p);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-medium shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Schedule in Campaign Queue</span>
                </button>

                <button
                  onClick={() => setViewingPost(null)}
                  className="px-3 py-1.5 rounded bg-[#162032] border border-[#273549] text-slate-300 hover:text-white text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#1e293b] rounded-lg max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Delete Post Record</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to delete <strong className="text-slate-200">{postToDelete.title}</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="px-3.5 py-1.5 rounded bg-[#162032] border border-[#273549] text-slate-300 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeletePost(postToDelete.id);
                  setPostToDelete(null);
                }}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
