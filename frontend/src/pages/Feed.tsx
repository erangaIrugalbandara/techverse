import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Feed.css';

interface FeedItem {
  id: string;
  type: 'post' | 'blog';
  author_name: string;
  author_username: string;
  author_avatar?: string;
  created_at: string;
  
  // Post specific
  content?: string;
  category?: string;
  post_type?: string; 
  likes_count?: number;
  comments_count?: number;
  
  // Blog specific
  title?: string;
  excerpt?: string;
  read_time?: number; 
  status?: string;
}

const CATEGORIES = ['AI', 'Crypto', 'Financial', 'Self-help', 'Web Development', 'Mobile', 'Other'];
const POST_TYPES = ['Imagination', 'Feeling', 'Opinion', 'Question'];

const Feed = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('AI');
  const [selectedPostType, setSelectedPostType] = useState('Opinion');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    fetchFeed();
  }, [isAuthenticated, navigate]);

  const fetchFeed = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/feed');
      setFeed(response.data);
    } catch (error) {
      console.error('Error fetching feed:', error);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/posts', {
        content: newPost,
        category: selectedCategory,
        post_type: selectedPostType
      });
      setNewPost('');
      fetchFeed();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPostTypeEmoji = (type: string) => {
    switch (type) {
      case 'Imagination': return '💭';
      case 'Feeling': return '❤️';
      case 'Opinion': return '💡';
      case 'Question': return '❓';
      default: return '📝';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="feed-page">
      <div className="feed-container">
        {/* Post Creation Card */}
        <div className="create-post-card">
          <div className="post-creator-header">
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.display_name} />
              ) : (
                <span>{user?.display_name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <form onSubmit={handlePostSubmit} className="post-form">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                className="post-input"
                rows={3}
              />
              <div className="post-options">
                <div className="post-selectors">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="post-select"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    value={selectedPostType}
                    onChange={(e) => setSelectedPostType(e.target.value)}
                    className="post-select"
                  >
                    {POST_TYPES.map(type => (
                      <option key={type} value={type}>
                        {getPostTypeEmoji(type)} {type}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="post-submit-btn" disabled={loading || !newPost.trim()}>
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="posts-feed">
          {feed.map(item => (
            <div key={item.id} className="post-card">
              <div className="post-header">
                <div className="post-author">
                  <div className="author-avatar">
                    {item.author_avatar ? (
                      <img src={item.author_avatar} alt={item.author_name} />
                    ) : (
                      <span>{item.author_name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="author-info">
                    <span className="author-name">{item.author_name}</span>
                    <span className="post-meta">
                      {item.type === 'post' ? (
                        <>
                          <span className="post-type">{getPostTypeEmoji(item.post_type || '')} {item.post_type}</span>
                          <span className="post-category">in {item.category}</span>
                        </>
                      ) : (
                        <span className="post-type blog-badge">📝 Blog Article</span>
                      )}
                      <span className="post-time">· {formatTimeAgo(item.created_at)}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="post-content">
                {item.type === 'post' ? (
                  <p>{item.content}</p>
                ) : (
                  <div className="blog-preview" onClick={() => navigate(`/blog/${item.id}`)} style={{cursor: 'pointer'}}>
                    <h3 className="blog-title" style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>{item.title}</h3>
                    <p className="blog-excerpt" style={{ color: '#aaa', fontSize: '0.95rem' }}>{item.excerpt}</p>
                    <div className="blog-footer" style={{ marginTop: '10px', fontSize: '0.9rem', color: '#00f2fe' }}>
                      <span>Read full article ({item.read_time} min) →</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="post-actions">
                <button className="action-btn">
                  <span className="icon">👍</span>
                  <span>{item.likes_count || 0}</span>
                </button>
                <button className="action-btn">
                  <span className="icon">💬</span>
                  <span>{item.comments_count || 0} Comments</span>
                </button>
                <button className="action-btn">
                  <span className="icon">🔗</span>
                  <span>Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Feed;
