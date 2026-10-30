'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  ExternalLink, 
  Trash2, 
  X,
  Play
} from 'lucide-react';
import { SocialMediaPost, Campaign } from '@/lib/db/types';

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
  const [platformFilter, setPlatformFilter] = useState<'all' | 'instagram' | 'youtube'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPlatform, setNewPlatform] = useState<'instagram' | 'youtube'>('instagram');
  const [newUrl, setNewUrl] = useState('');
  const [newThumbnail, setNewThumbnail] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newCategory, setNewCategory] = useState('Tech Tutorials');
  const [newAuthor, setNewAuthor] = useState('@community_channel');

  const filteredPosts = posts.filter(p => platformFilter === 'all' || p.platform === platformFilter);

  const handleCreateBroadcast = (post: SocialMediaPost) => {
    const defaultBroadcastText = post.suggestedBroadcastText || 
      `*New ${post.platform === 'instagram' ? 'Reel' : 'Short'} for our Community*\n\n${post.title}\n\nWatch here: ${post.url}\n\nReply STOP to opt out.`;

    onOpenScheduleModal({
      title: `Video: ${post.title.slice(0, 35)}`,
      category: 'reel_video',
      message: defaultBroadcastText,
      mediaUrl: post.thumbnailUrl,
      mediaType: 'image',
      linkPreviewUrl: post.url,
      targetSegmentId: 'seg_tech'
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) {
      alert('Title and Video URL are required');
      return;
    }

    await onAddPost({
      title: newTitle,
      platform: newPlatform,
      url: newUrl,
      thumbnailUrl: newThumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      caption: newCaption,
      category: newCategory,
      authorHandle: newAuthor,
      viewsCount: '1.2K',
      likesCount: '140'
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewUrl('');
    setNewCaption('');
  };

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Curated Reels & YouTube Shorts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Format short-form video releases for community broadcasts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-lg bg-[#0e1420] border border-[#1b2537] text-xs">
            {(['all', 'instagram', 'youtube'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition ${
                  platformFilter === p
                    ? 'bg-[#c2f83a] text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#c2f83a] hover:bg-[#b5ee2e] text-slate-950 text-xs font-semibold transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Video</span>
          </button>
        </div>
      </div>

      {/* Practical Table / List */}
      <div className="bg-[#121826] border border-[#1b2537] rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1b2537] bg-[#0e1420] text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Video Details</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Engagement</th>
                <th className="py-3 px-4">Source Link</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2537]/50 text-slate-200">
              {filteredPosts.map(post => (
                <tr key={post.id} className="hover:bg-[#161f30] transition-colors">
                  <td className="py-3.5 px-4 max-w-sm align-top">
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.thumbnailUrl}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover border border-[#223049] shrink-0 bg-[#141c2c]"
                      />
                      <div>
                        <div className="font-semibold text-white text-[13px] line-clamp-1">{post.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{post.caption}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{post.category}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap align-top">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#1e293b] text-slate-300 border border-[#2b3952] capitalize">
                      {post.platform === 'instagram' ? 'Instagram Reel' : 'YouTube Short'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px] align-top">
                    {post.authorHandle}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px] align-top">
                    {post.viewsCount || '—'} views · {post.likesCount || '—'} likes
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap align-top">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 font-medium transition"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2 align-top">
                    <button
                      onClick={() => handleCreateBroadcast(post)}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#1a2538] hover:bg-[#22314a] text-[#c2f83a] border border-[#c2f83a]/30 transition"
                    >
                      Broadcast to WA
                    </button>
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No video records found for this filter.
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
                Add Short Video Resource
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as 'instagram' | 'youtube')}
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#c2f83a]"
                  >
                    <option value="instagram">Instagram Reel</option>
                    <option value="youtube">YouTube Short</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Tutorials"
                    className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Video Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Building Voice AI in 15 Minutes"
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Video URL *</label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Thumbnail Image URL</label>
                <input
                  type="url"
                  value={newThumbnail}
                  onChange={(e) => setNewThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#141c2c] border border-[#223049] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c2f83a]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Caption / Summary</label>
                <textarea
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Brief summary..."
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
                  Save Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
