import React, { useEffect, useState } from 'react';
// NOTE: This file now uses Font Awesome React components. If you haven't yet installed them,
// run:
// npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/react-fontawesome
// (or yarn add ... / pnpm add ...)
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faCopy, faShare, faHeart as faHeartSolid, faReply, faComment, faEye } from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
    readingTimeMin?: number;
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
  const [expanded, setExpanded] = useState(false);
  const [commentLiked, setCommentLiked] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const isLong = comment.content && comment.content.length > 260;
  

  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#FFC312] rounded-full flex items-center justify-center text-sm font-bold text-gray-800 text-xs">
              {author[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-gray-800 text-sm truncate">{author}</div>
                <div className="text-xs text-gray-400">•</div>
                <div className="text-xs text-gray-400">{formatTimeAgo(comment.createdAt)}</div>
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-2 text-xs text-gray-500">{comment.replies.length} repl{comment.replies.length > 1 ? 'ies' : 'y'}</div>
                )}
              </div>
              <div className="text-sm text-gray-700 break-words mt-2">
                {isLong && !expanded ? `${comment.content.slice(0, 260)}...` : comment.content}
                {isLong && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="ml-2 text-xs text-gray-500 hover:underline"
                  >
                    {expanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCommentLiked(!commentLiked)}
              className={`p-2 rounded-md hover:bg-gray-100 ${commentLiked ? 'text-red-600' : 'text-gray-600'}`}
              aria-pressed={commentLiked}
              aria-label={commentLiked ? 'Unlike comment' : 'Like comment'}
            >
              <FontAwesomeIcon icon={commentLiked ? faHeartSolid : faHeartRegular} className="text-sm" />
            </button>
            <button
              onClick={() => onReply(comment.commentId)}
              className="p-2 rounded-md hover:bg-gray-100 text-[#521a5b]"
              aria-label="Reply to comment"
            >
              <FontAwesomeIcon icon={faReply} className="text-xs" />
            </button>
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 mt-3 space-y-2">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-xs text-gray-500 hover:underline mb-2"
          >
            {showReplies ? `Hide ${comment.replies.length} repl${comment.replies.length > 1 ? 'ies' : 'y'}` : `View ${comment.replies.length} repl${comment.replies.length > 1 ? 'ies' : 'y'}`}
          </button>
          {showReplies && comment.replies.map((reply) => (
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
  const [mounted, setMounted] = useState(false);
  const [isApiHit, setIsApiHit] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [instagramCopied, setInstagramCopied] = useState(false);

  const displayReadingTime = post?.metrics?.readingTimeMin ? (isApiHit ? post.metrics.readingTimeMin * 2 : post.metrics.readingTimeMin) : undefined;
  const viewsCount = post?.metrics?.views ?? ((Object.values((post as any)?.views || {}) as number[]).reduce((a, b) => a + b, 0) || 0);

  const location = useLocation();

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
      const query = new URLSearchParams(location.search);
      const referrer = query.get('referrer') || 'direct';
      const userAgentIsBot = /bot|crawler|spider|curl|wget|axios|node-fetch|python-requests/i.test(navigator.userAgent);
      const skipView = query.get('skipView') === 'true' || userAgentIsBot;
      if (skipView) setIsApiHit(true);
      const postData = await apiClient.posts.getPublic(slug, guestName, guestId, referrer, navigator.userAgent, skipView);
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
      setMounted(true);
      // If API hit we won't count the view - server should not increment.
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

  const handleShare = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch (e) {
      console.error('Failed to copy share link', e);
    }
  };

  const handleInstagramClick = async (url?: string) => {
    const toOpen = url || (user && (user as any).instagram) || 'https://instagram.com';
    try {
      await navigator.clipboard?.writeText(toOpen);
      setInstagramCopied(true);
      setTimeout(() => setInstagramCopied(false), 1500);
      // Open link in new tab
      window.open(toOpen, '_blank');
    } catch (e) {
      console.error('Failed to copy/open instagram link', e);
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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Logo className="text-[#521a5b]" />
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleInstagramClick((user as any)?.instagram)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              title="Instagram"
              aria-label="Open Instagram profile"
            >
              <FontAwesomeIcon icon={faInstagram} className="text-[#521a5b]" />
            </button>
            {instagramCopied && (
              <div className="text-xs text-green-600">Copied!</div>
            )}
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
        </div>
      </nav>

      <article className={`max-w-7xl mx-auto px-6 lg:px-12 py-12 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        {post.coverImageUrl && (
          <div className="mb-8 relative">
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
            {/* Minimal overlay controls for image: Open, Copy, Share */}
            <div className="absolute right-4 bottom-4 flex items-center gap-2 bg-white/80 backdrop-blur rounded-md p-1 shadow-sm">
              <button
                onClick={() => window.open(post.coverImageUrl, '_blank')}
                title="Open image in new tab"
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Open image in new tab"
              >
                <FontAwesomeIcon icon={faLink} className="text-gray-600" />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(post.coverImageUrl);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 1500);
                }}
                title="Copy image URL"
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Copy image URL"
              >
                <FontAwesomeIcon icon={faCopy} className="text-gray-600" />
              </button>
              <button
                onClick={handleShare}
                title="Share post"
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Share post"
              >
                <FontAwesomeIcon icon={faShare} className="text-[#521a5b]" />
              </button>
              {shareCopied && <div className="text-xs text-green-600 ml-2">Copied!</div>}
            </div>
          </div>
        )}

        <header className="mb-8">
          <div className="flex items-start justify-between">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 leading-tight">{post.title}</h1>
            <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="hidden sm:inline-flex p-2 rounded-md text-gray-600 hover:bg-gray-100"
              title="Share post"
              aria-label="Share post"
            >
              <FontAwesomeIcon icon={faShare} />
            </button>
            {shareCopied && (
              <div className="hidden sm:block text-xs text-green-600">Copied!</div>
            )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#FFC312] rounded-full flex items-center justify-center text-sm font-bold text-gray-800">
                {post.authorName[0].toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-800 flex items-center gap-3">
                  {post.authorName}
                  {((post as any)?.authorInstagram || (user as any)?.instagram) && (
                    <button
                      onClick={() => handleInstagramClick((post as any)?.authorInstagram || (user as any)?.instagram)}
                      className="p-1 rounded-md text-gray-600 hover:bg-gray-100"
                      title="Visit Instagram"
                      aria-label="Visit author's Instagram"
                    >
                      <FontAwesomeIcon icon={faInstagram} className="text-[#521a5b] text-sm" />
                    </button>
                  )}
                  {instagramCopied && (
                    <div className="text-xs text-green-600">Copied!</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                      <FontAwesomeIcon icon={faEye} className="text-xs text-gray-400" />
                      <span>{new Date(post.createdAt).toLocaleDateString()} · {viewsCount} views</span>
                      {typeof displayReadingTime !== 'undefined' && (
                        <span className="ml-3">· {displayReadingTime} min read{isApiHit ? ' (API)' : ''}</span>
                      )}
                    </div>
              </div>
            </div>
          </div>
        </header>

        {post.excerpt && (
          <div className="text-xl text-gray-600 mb-8 pb-8 border-b border-gray-500 italic">
            {post.excerpt}
          </div>
        )}

        <div
          className="text-xl text-gray-600 mb-8 pb-8 border-b border-gray-200 work-sans"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="border-t border-gray-200 pt-8 mb-12">
          <div className="flex items-center justify-between gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 p-2 rounded-full transition ${
                liked
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-pressed={liked}
              aria-label={liked ? 'Unlike post' : 'Like post'}
            >
              <FontAwesomeIcon icon={liked ? faHeartSolid : faHeartRegular} className="text-lg" />
              <span className="text-sm font-semibold">{likeCount}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-600">
              <FontAwesomeIcon icon={faComment} className="text-lg" />
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

// Helpers
function formatTimeAgo(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return d.toLocaleDateString();
  } catch (e) {
    return dateStr;
  }
}
