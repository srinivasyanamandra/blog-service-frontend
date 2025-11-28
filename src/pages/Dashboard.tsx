import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { SunflowerIcon } from '../components/SunflowerIcon';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../components/ui/ToastProvider';

interface PostItem {
  id: number;
  title: string;
  slug: string;
  shareToken?: string;
  status: string;
  excerpt?: string;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
  authorName?: string;
  metrics?: { views?: number; likes?: number; comments?: number };
}

interface DashboardMetrics {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments?: number;
  totalFavorites?: number;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const { toast } = useToast();

  // Pagination & Filters
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'RECENT' | 'TOP_VIEWS' | 'TOP_LIKES' | 'TOP_COMMENTS'>('RECENT');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [filterTitle, setFilterTitle] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [createdFrom, setCreatedFrom] = useState<string | undefined>(undefined);
  const [createdTo, setCreatedTo] = useState<string | undefined>(undefined);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    try {
      setError(null);
      setLoading(true);
      await Promise.all([loadDashboard(0, pageSize)]);
    } catch (err) {
      console.error('Error loading dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async (page = 0, size = pageSize) => {
    try {
      setLoadingPosts(true);
      setError(null);

      const params: any = { page, size, sortBy, favoritesOnly };
      if (filterTitle) params.search = filterTitle;
      if (filterStatus) params.status = filterStatus;
      if (createdFrom) params.fromDate = new Date(createdFrom).toISOString();
      if (createdTo) params.toDate = new Date(createdTo).toISOString();

      const res: any = await apiClient.dashboard.get(params);
      // metrics
      setMetrics({
        totalPosts: res.totalPosts,
        publishedPosts: res.publishedPosts,
        draftPosts: res.draftPosts,
        totalViews: res.totalViews,
        totalLikes: res.totalLikes,
        totalComments: res.totalComments,
        totalFavorites: res.totalFavorites,
      });
      const pageRes = res.filteredPosts && res.filteredPosts.content && res.filteredPosts.content.length > 0 ? res.filteredPosts : res.recentPosts;
      setPosts(pageRes.content || []);
      setPageNumber(pageRes.pageNumber ?? page);
      setPageSize(pageRes.pageSize ?? size);
      setTotalElements(pageRes.totalElements ?? 0);
      setTotalPages(pageRes.totalPages ?? 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load posts';
      setError(message);
      console.error('Failed to load dashboard', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadPosts = async (page = 0, size = pageSize) => {
    try {
      setLoadingPosts(true);
      setError(null);

      const params: any = { page, size, sortBy, favoritesOnly };
      if (filterTitle) params.search = filterTitle;
      if (filterStatus) params.status = filterStatus;
      if (createdFrom) params.fromDate = new Date(createdFrom).toISOString();
      if (createdTo) params.toDate = new Date(createdTo).toISOString();

      const res: any = await apiClient.dashboard.get(params);
      const pageRes = res.filteredPosts && res.filteredPosts.content && res.filteredPosts.content.length > 0 ? res.filteredPosts : res.recentPosts;
      setPosts(pageRes.content || []);
      setPageNumber(pageRes.pageNumber ?? page);
      setPageSize(pageRes.pageSize ?? size);
      setTotalElements(pageRes.totalElements ?? 0);
      setTotalPages(pageRes.totalPages ?? 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load posts';
      setError(message);
      console.error('Failed to load posts', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // (Instagram link was removed from dashboard; used in public post pages)

  const handlePublish = async (postId: number) => {
    try {
      await apiClient.posts.publish(postId);
      await loadDashboard(pageNumber, pageSize);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      await apiClient.posts.delete(postId);
      await loadDashboard(pageNumber, pageSize);
      setShowDeleteConfirm(null);
      const deletedPost = posts.find((p) => p.id === postId);
      const combined = `${deletedPost?.title || ''} ${deletedPost?.excerpt || ''}`.trim();
      const wc = combined ? combined.split(/\s+/).filter(Boolean).length : 0;
      toast(wc > 10 ? 'Post deleted successfully. Nice work — you are doing good!' : 'Post deleted successfully.', 'success');
    } catch (err) {
      setError((err as Error).message);
      toast((err as Error).message || 'Failed to delete post', 'error', 4500);
    }
  };

  const handleDeleteWithLoading = async (postId: number) => {
    setDeletingPostId(postId);
    try {
      await handleDelete(postId);
    } finally {
      setDeletingPostId(null);
    }
  };

  const copyShareLink = (shareToken?: string) => {
    if (!shareToken) return;
    const url = `${window.location.origin}/posts/${shareToken}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast('Share link copied to clipboard!', 'success');
      })
      .catch((e) => {
        toast('Failed to copy share link', 'error');
        console.error('Failed to copy share link', e);
      });
  };

  // Close the delete modal with escape key
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setShowDeleteConfirm(null);
  }, []);

  useEffect(() => {
    if (showDeleteConfirm !== null) {
      document.addEventListener('keydown', onKeyDown);
    } else {
      document.removeEventListener('keydown', onKeyDown);
    }
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showDeleteConfirm, onKeyDown]);

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center">
        <div className="text-center">
          <SunflowerIcon className="w-12 h-12 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo className="text-[#521a5b]" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-semibold text-gray-800">{user?.name}</span>
            </span>
            <Button onClick={handleLogout} variant="outline" className="text-sm">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-600">Manage your blog posts and track performance</p>
          </div>
          <Button
            onClick={() => navigate('/create')}
            className="bg-[#FFC312] hover:bg-[#e6af10] text-gray-800 font-semibold"
          >
            <SunflowerIcon className="w-4 h-4 mr-2 transform transition-transform hover:scale-110" />
            Create New Post
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Total Posts</div>
            <div className="text-3xl font-bold text-gray-800">{metrics?.totalPosts || 0}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Published</div>
            <div className="text-3xl font-bold text-green-600">{metrics?.publishedPosts || 0}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Drafts</div>
            <div className="text-3xl font-bold text-yellow-600">{metrics?.draftPosts || 0}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Total Views</div>
            <div className="text-3xl font-bold text-blue-600">{metrics?.totalViews || 0}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Total Likes</div>
            <div className="text-3xl font-bold text-red-600">{metrics?.totalLikes || 0}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Total Comments</div>
            <div className="text-3xl font-bold text-indigo-600">{metrics?.totalComments || 0}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Favorites</div>
            <div className="text-3xl font-bold text-pink-600">{metrics?.totalFavorites || 0}</div>
          </div>
        </div>
        {metrics?.totalPosts && metrics.totalPosts > 5 && (
          <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <SunflowerIcon className="w-6 h-6 text-yellow-400" />
            <div className="text-sm text-gray-700">Nice progress — you've created {metrics.totalPosts} posts already. Keep up the great work!</div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-800">Your Posts</h2>
            <div className="text-sm text-gray-500">{totalElements} posts — Page {pageNumber + 1}/{totalPages}</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search title or content"
                value={filterTitle}
                onChange={(e) => setFilterTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPageNumber(0);
                    loadPosts(0, pageSize);
                  }
                }}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={favoritesOnly}
                  onChange={(e) => setFavoritesOnly(e.target.checked)}
                  className="form-checkbox"
                />
                Favorites only
              </label>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">All</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'RECENT' | 'TOP_VIEWS' | 'TOP_LIKES' | 'TOP_COMMENTS')}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="RECENT">Recent</option>
                <option value="TOP_VIEWS">Top Views</option>
                <option value="TOP_LIKES">Top Likes</option>
                <option value="TOP_COMMENTS">Top Comments</option>
              </select>
              <Button
                onClick={() => {
                  setPageNumber(0);
                  loadPosts(0, pageSize);
                }}
                className="text-sm"
              >
                <SunflowerIcon className={`w-4 h-4 mr-2 ${loadingPosts ? 'animate-spin' : ''}`} />
                Apply
              </Button>
              <Button
                onClick={() => {
                  setFilterTitle('');
                  setFilterStatus('');
                  setCreatedFrom(undefined);
                  setCreatedTo(undefined);
                  setSortBy('RECENT');
                  setFavoritesOnly(false);
                  setPageNumber(0);
                  loadPosts(0, pageSize);
                }}
                variant="outline"
                className="text-sm"
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <label>From</label>
              <input
                type="datetime-local"
                value={createdFrom || ''}
                onChange={(e) => setCreatedFrom(e.target.value || undefined)}
                className="px-2 py-1 border rounded"
              />
              <label>To</label>
              <input
                type="datetime-local"
                value={createdTo || ''}
                onChange={(e) => setCreatedTo(e.target.value || undefined)}
                className="px-2 py-1 border rounded"
              />
            </div>
          </div>

          {loadingPosts ? (
            <div className="text-center py-12">
              <SunflowerIcon className="w-16 h-16 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 mb-4">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <SunflowerIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-gray-600 mb-4">No posts yet. Create your first blog post!</p>
              <Button onClick={() => navigate('/create')} className="bg-[#521a5b] hover:bg-[#6b2278]">
                Create Post
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-gray-50 transition cursor-pointer transform transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() => {
                        if (post.status === 'PUBLISHED' && post.shareToken) {
                          const params = new URLSearchParams();
                          params.set('referrer', 'dashboard');
                          // preserve some filters for analytics if desired
                          if (filterTitle) params.set('search', filterTitle);
                          if (filterStatus) params.set('status', filterStatus);
                          if (favoritesOnly) params.set('favoritesOnly', String(favoritesOnly));
                          params.set('sortBy', sortBy);
                          params.set('page', String(pageNumber));
                          params.set('size', String(pageSize));
                          navigate(`/posts/${post.shareToken}?${params.toString()}`);
                        } else {
                          navigate(`/edit/${post.id}`);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Support keyboard activation
                        if (e.key === 'Enter') {
                          if (post.status === 'PUBLISHED' && post.shareToken) {
                            navigate(`/posts/${post.shareToken}`);
                          } else {
                            navigate(`/edit/${post.id}`);
                          }
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {post.coverImageUrl && (
                            <img src={post.coverImageUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                          )}
                          <div>
                            <div className="font-semibold text-gray-800">{post.title}</div>
                            <div className="text-sm text-gray-500">{post.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            post.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800'
                              : post.status === 'DRAFT'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {post.status}
                          {post.status === 'PUBLISHED' && (
                            <SunflowerIcon className="w-3 h-3 ml-2 text-yellow-400 animate-pulse" />
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <div>Views: {post.metrics?.views || 0}</div>
                          <div>Likes: {post.metrics?.likes || 0}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(post.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button onClick={(e) => { e.stopPropagation(); navigate(`/edit/${post.id}`); }} variant="outline" size="sm">
                            Edit
                          </Button>
                          {post.status === 'DRAFT' && (
                            <Button onClick={(e) => { e.stopPropagation(); handlePublish(post.id); }} size="sm" className="bg-green-600 hover:bg-green-700">
                              Publish
                            </Button>
                          )}
                          {post.status === 'PUBLISHED' && post.shareToken && (
                            <Button onClick={(e) => { e.stopPropagation(); copyShareLink(post.shareToken); }} variant="outline" size="sm">
                              Share
                            </Button>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(post.id);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={deletingPostId === post.id}
                            title="Delete post"
                            aria-label={`Delete ${post.title}`}
                          >
                            {deletingPostId === post.id ? (
                              <span className="flex items-center gap-2"><SunflowerIcon className="w-4 h-4 animate-spin" />Deleting</span>
                            ) : (
                              'Delete'
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-600">Showing {posts.length} of {totalElements} posts</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newPage = Math.max(0, pageNumber - 1);
                  setPageNumber(newPage);
                  loadPosts(newPage, pageSize);
                }}
                disabled={pageNumber === 0}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <div className="text-sm">Page {pageNumber + 1} / {totalPages}</div>
              <button
                onClick={() => {
                  const newPage = Math.min(totalPages - 1, pageNumber + 1);
                  setPageNumber(newPage);
                  loadPosts(newPage, pageSize);
                }}
                disabled={pageNumber >= totalPages - 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPageSize(newSize);
                  setPageNumber(0);
                  loadPosts(0, newSize);
                }}
                className="px-2 py-1 border rounded"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={showDeleteConfirm !== null}
        title="Do you really want to delete?"
        description="This action will permanently delete the post. Please confirm you want to continue."
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        loading={deletingPostId !== null}
        praiseMessage={(() => {
          const post = posts.find((p) => p.id === showDeleteConfirm);
          const combined = `${post?.title || ''} ${post?.excerpt || ''}`.trim();
          const wc = combined ? combined.split(/\s+/).filter(Boolean).length : 0;
          return wc > 10 ? "Nice work! Your post is detailed — you're doing good. Are you sure you want to delete?" : null;
        })()}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={async () => {
          const toDelete = showDeleteConfirm;
          if (toDelete === null) return;
          await handleDeleteWithLoading(toDelete);
        }}
      >
        {(() => {
          const post = posts.find((p) => p.id === showDeleteConfirm);
          if (!post) return null;
          return (
            <div className="mb-3 text-gray-700 text-sm">
              <div className="font-semibold">{post.title}</div>
              <div className="text-xs text-gray-500">{post.slug}</div>
            </div>
          );
        })()}
      </ConfirmModal>

      {/* Toasts handled by ToastProvider */}
      </div>
    </div>
  );
};

export default Dashboard;