import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { SunflowerIcon } from '../components/SunflowerIcon';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImageUrl: string;
  isPublic: boolean;
  allowComments: boolean;
  shareToken: string;
  status: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
  };
}

export const PostEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedToken, setPublishedToken] = useState('');

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const postData = await apiClient.posts.getById(parseInt(id));
      setPost(postData);
      setTitle(postData.title);
      setContent(postData.content);
      setExcerpt(postData.excerpt);
      setCoverImageUrl(postData.coverImageUrl);
      setIsPublic(postData.isPublic);
      setAllowComments(postData.allowComments);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load post';
      setError(errorMsg);
      console.error('Failed to load post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError(null);
    try {
      if (post) {
        await apiClient.posts.update(post.id, {
          title,
          content,
          excerpt,
          coverImageUrl,
          allowComments,
        });
        alert('Draft saved successfully!');
      } else {
        const newPost = await apiClient.posts.create({
          title,
          content,
          excerpt,
          coverImageUrl,
          allowComments,
        });
        navigate(`/edit/${newPost.id}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save draft';
      setError(errorMsg);
      console.error('Failed to save draft:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    setError(null);
    try {
      let postId = post?.id;

      if (!postId) {
        const newPost = await apiClient.posts.create({
          title,
          content,
          excerpt,
          coverImageUrl,
          allowComments,
        });
        postId = newPost.id;
      } else {
        await apiClient.posts.update(postId, {
          title,
          content,
          excerpt,
          coverImageUrl,
          allowComments,
        });
      }

      const response = await apiClient.posts.publish(postId);
      setPublishedToken(response.shareToken);
      setShowPublishModal(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to publish post';
      setError(errorMsg);
      console.error('Failed to publish post:', err);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center">
        <div className="text-center">
          <SunflowerIcon className="w-12 h-12 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-800">
              ← Back
            </button>
            <Logo className="text-[#521a5b]" />
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveDraft}
              disabled={saving}
              variant="outline"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={saving || !title || !content}
              className="bg-[#FFC312] hover:bg-[#e6af10] text-gray-800 font-semibold"
            >
              <SunflowerIcon className="w-4 h-4 mr-2" />
              {saving ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post Title"
                className="w-full text-3xl font-bold text-gray-800 placeholder-gray-400 border-none outline-none mb-4"
              />

              <input
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief excerpt or summary..."
                className="w-full text-lg text-gray-600 placeholder-gray-400 border-none outline-none mb-4"
              />

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#521a5b] focus:border-transparent outline-none"
                />
                {coverImageUrl && (
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="mt-4 w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here... (Supports HTML)"
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#521a5b] focus:border-transparent outline-none resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                You can use HTML tags for formatting: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, etc.
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Post Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Public Post</label>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      isPublic ? 'bg-[#521a5b]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Allow Comments</label>
                  <button
                    onClick={() => setAllowComments(!allowComments)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      allowComments ? 'bg-[#521a5b]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        allowComments ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Live Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Word Count</span>
                    <span className="font-semibold text-gray-800">{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reading Time</span>
                    <span className="font-semibold text-gray-800">{readingTime} min</span>
                  </div>
                  {post && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Views</span>
                        <span className="font-semibold text-gray-800">
                          {Object.values(post.views).reduce((a, b) => a + b, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Likes</span>
                        <span className="font-semibold text-gray-800">
                          {Object.values(post.likes).reduce((a, b) =>
                            a + (typeof b === 'number' ? b : (b ? 1 : 0)), 0
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {post && post.status === 'PUBLISHED' && (
                <div className="border-t border-gray-200 mt-6 pt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Share Token</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {post.shareToken}
                  </p>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(post.shareToken);
                      alert('Token copied!');
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Copy Token
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <SunflowerIcon className="w-16 h-16" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Post Published!
              </h2>
              <p className="text-gray-600 mb-6">
                Your post is now live and ready to be shared with the world.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-600 mb-2">Share Token</p>
                <p className="font-mono text-sm text-gray-800 break-all">
                  {publishedToken}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowPublishModal(false);
                    navigate('/dashboard');
                  }}
                  className="flex-1 bg-[#521a5b] hover:bg-[#6b2278]"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(publishedToken);
                    alert('Token copied!');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Copy Token
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
