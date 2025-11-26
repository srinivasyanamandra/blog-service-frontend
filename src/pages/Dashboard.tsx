import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { SunflowerIcon } from '../components/SunflowerIcon';

interface Post {
  id: number;
  title: string;
  slug: string;
  shareToken: string;
  status: string;
  excerpt: string;
  coverImageUrl: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  allowComments: boolean;
  authorName: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
  };
}

interface DashboardMetrics {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  recentPosts: Post[];
  popularPosts: Post[];
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [postsData, metricsData] = await Promise.all([
        apiClient.posts.list(),
        apiClient.dashboard.get(),
      ]);
      setPosts(postsData);
      setMetrics(metricsData);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load dashboard';
      setError(errorMsg);
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handlePublish = async (postId: number) => {
    try {
      await apiClient.posts.publish(postId);
      await loadData();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to publish';
      setError(errorMsg);
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      await apiClient.posts.delete(postId);
      await loadData();
      setShowDeleteConfirm(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete';
      setError(errorMsg);
    }
  };

  const copyShareLink = (shareToken: string) => {
    const url = `${window.location.origin}/posts/${shareToken}`;
    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard!');
  };

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
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-sm"
            >
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
            <SunflowerIcon className="w-4 h-4 mr-2" />
            Create New Post
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Your Posts</h2>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <SunflowerIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-gray-600 mb-4">No posts yet. Create your first blog post!</p>
              <Button
                onClick={() => navigate('/create')}
                className="bg-[#521a5b] hover:bg-[#6b2278]"
              >
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
                    <tr key={post.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {post.coverImageUrl && (
                            <img
                              src={post.coverImageUrl}
                              alt=""
                              className="w-16 h-16 rounded-lg object-cover"
                            />
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
                          <Button
                            onClick={() => navigate(`/edit/${post.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            Edit
                          </Button>
                          {post.status === 'DRAFT' && (
                            <Button
                              onClick={() => handlePublish(post.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Publish
                            </Button>
                          )}
                          {post.status === 'PUBLISHED' && post.shareToken && (
                            <Button
                              onClick={() => copyShareLink(post.shareToken)}
                              variant="outline"
                              size="sm"
                            >
                              Share
                            </Button>
                          )}
                          {showDeleteConfirm === post.id ? (
                            <>
                              <Button
                                onClick={() => handleDelete(post.id)}
                                size="sm"
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Confirm
                              </Button>
                              <Button
                                onClick={() => setShowDeleteConfirm(null)}
                                variant="outline"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => setShowDeleteConfirm(post.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
