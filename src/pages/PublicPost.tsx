import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { getOrCreateGuestId, getOrAskGuestName } from '../lib/utils';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

interface CommentEntry {
  commentId: string;
  userId?: number;
  guestName?: string;
  content: string;
  createdAt: string;
  replies: CommentEntry[];
}

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  coverImageUrl: string;
  authorName: string;
  createdAt: string;
  shareToken: string;
  allowComments?: boolean;
  metrics: {
    views: number;
    likes: number;
    comments: number;
  };
  likes: {
    count: number;
    entries: Array<{ userId?: number; guestName?: string; likedAt: string }>;
  };
  comments: {
    count: number;
    entries: CommentEntry[];
  };
}

const CommentComponent: React.FC<{
  comment: CommentEntry;
  shareToken: string;
  onReply: (parentId: string) => void;
}> = ({ comment, shareToken, onReply }) => {
  const author = comment.userId ? `User ${comment.userId}` : (comment.guestName || 'Guest');
  return (
    <div className="mb-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FFC312] rounded-full flex items-center justify-center text-sm font-bold text-gray-800">
              {author[0].toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">{author}</div>
              <div className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        <p className="text-gray-700 text-sm mb-2">{comment.content}</p>
          <button
          onClick={() => onReply(comment.commentId)}
          className="text-xs text-[#521a5b] hover:underline"
        >
          Reply
        </button>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentComponent
              key={reply.commentId}
              comment={reply}
              shareToken={shareToken}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const PublicPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Ensure guest id and name exist
    getOrCreateGuestId();
    // only prompt if needed
    getOrAskGuestName();
    loadPost();
  }, [slug]);

  const loadPost = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const guestId = localStorage.getItem('blog_guest_id') || getOrCreateGuestId();
      const guestName = localStorage.getItem('blog_guest_name') || getOrAskGuestName();
      const postData = await apiClient.posts.getPublic(slug, guestName, guestId, 'direct', navigator.userAgent);
      setPost(postData);
      setComments(postData.comments?.entries || []);
      // Determine like count and if the current viewer already liked
      let computedLikeCount = 0;
      let alreadyLiked = false;
      if (postData.likes && (postData.likes as any).count !== undefined) {
        computedLikeCount = (postData.likes as any).count;
        const entries = (postData.likes as any).entries || [];
        if (user) {
          alreadyLiked = entries.some((e: any) => e.userId === user.id || e.guestIdentifier === `user_${user.id}`);
        } else {
          const guestIdLocal = localStorage.getItem('blog_guest_id');
          alreadyLiked = entries.some((e: any) => e.guestIdentifier === guestIdLocal);
        }
      } else if (postData.likes && typeof postData.likes === 'object') {
        const likesObj: Record<string, any> = postData.likes as any;
        computedLikeCount = Object.values(likesObj).reduce((sum, v) => sum + (typeof v === 'number' ? v : v ? 1 : 0), 0);
        if (user) {
          alreadyLiked = !!likesObj[`user_${user.id}`];
        } else {
          const guestIdLocal = localStorage.getItem('blog_guest_id');
          alreadyLiked = !!likesObj[guestIdLocal as string];
        }
      }
      setLikeCount(computedLikeCount);
      setLiked(alreadyLiked);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Post not found';
      setError(errorMsg);
      console.error('Failed to load post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    try {
      const data: any = {};
      if (user) {
        data.userId = user.id;
        data.guestName = user.name;
        data.guestIdentifier = `user_${user.id}`;
      } else {
        data.guestName = localStorage.getItem('blog_guest_name') || getOrAskGuestName();
        data.guestIdentifier = localStorage.getItem('blog_guest_id') || getOrCreateGuestId();
      }
      await apiClient.posts.like(post.shareToken, data);
      setLiked(!liked);
      loadPost();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to like post';
      setError(errorMsg);
      console.error('Failed to like post:', err);
    }
  };

  const handleComment = async () => {
    if (!post || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const commentData: any = { content: commentText };
      if (replyingTo) commentData.parentCommentId = replyingTo;
      if (user) {
        commentData.userId = user.id;
        commentData.guestName = user.name;
        commentData.guestIdentifier = `user_${user.id}`;
      } else {
        commentData.guestName = localStorage.getItem('blog_guest_name') || getOrAskGuestName();
        commentData.guestIdentifier = localStorage.getItem('blog_guest_id') || getOrCreateGuestId();
      }
      if (replyingTo) {
        await apiClient.posts.reply(post.shareToken, commentData);
      } else {
        await apiClient.posts.comment(post.shareToken, commentData);
      }
      setCommentText('');
      setReplyingTo(null);
      loadPost();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to post comment';
      setError(errorMsg);
      console.error('Failed to post comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-[#FFC312] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Logo className="text-[#521a5b]" />
          {user ? (
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Dashboard
            </Button>
          ) : (
            <Button onClick={() => navigate('/login')} className="bg-[#521a5b] hover:bg-[#6b2278]">
              Log In
            </Button>
          )}
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-12">
        {post.coverImageUrl && (
          <div className="mb-8">
            {!imageError ? (
              <img
                src={post.coverImageUrl}
                alt={post.title}
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
                className="w-full h-96 object-cover rounded-2xl mb-4 shadow-lg"
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 rounded-2xl mb-4 border border-gray-200 flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="text-sm text-gray-600 mb-2">Image failed to load</div>
                  <div className="text-xs break-all text-gray-500">{post.coverImageUrl}</div>
                </div>
              </div>
            )}
            {/* Show link and copy/open controls */}
            <div className="flex items-center gap-3">
              <a href={post.coverImageUrl} target="_blank" rel="noreferrer" className="text-sm text-[#521a5b] hover:underline">
                Open image in new tab
              </a>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800"
                onClick={() => navigator.clipboard?.writeText(post.coverImageUrl)}
              >
                Copy image URL
              </button>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800"
                onClick={() => window.open(post.coverImageUrl, '_blank')}
              >
                Open
              </button>
            </div>
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#FFC312] rounded-full flex items-center justify-center text-sm font-bold text-gray-800">
                {post.authorName[0].toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-800">{post.authorName}</div>
                <div className="text-xs">
                  {new Date(post.createdAt).toLocaleDateString()} · {post.metrics.views || 0} views
                </div>
              </div>
            </div>
          </div>
        </header>

        {post.excerpt && (
          <div className="text-xl text-gray-600 mb-8 pb-8 border-b border-gray-200 italic">
            {post.excerpt}
          </div>
        )}

        <div
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="border-t border-gray-200 pt-8 mb-12">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                liked
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
              <span className="font-semibold">{likeCount}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-xl">💬</span>
              <span className="font-semibold">{post.comments?.count || 0}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {post.allowComments && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Comments ({post.comments?.count || 0})
            </h2>

            <div className="mb-6">
              {replyingTo && (
                <div className="mb-2 flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">Replying to comment</span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={user ? "Share your thoughts..." : "Comment as guest..."}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#521a5b] focus:border-transparent outline-none resize-none"
                rows={3}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  {user ? `Commenting as ${user.name}` : 'Commenting as guest'}
                </p>
                <Button
                  onClick={handleComment}
                  disabled={submittingComment || !commentText.trim()}
                  className="bg-[#521a5b] hover:bg-[#6b2278]"
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentComponent
                  key={comment.commentId}
                  comment={comment}
                  shareToken={post.shareToken}
                  onReply={(parentId) => setReplyingTo(parentId)}
                />
              ))}

              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};
