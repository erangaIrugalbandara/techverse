import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import './Editor.css';

interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: string;
  read_time: number;
  updated_at: string;
  author_id: number;
}

const Editor = () => {
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'write' | 'preview' | 'split'>('write');
  const [saved, setSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchBlogs();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!saved && title && content) {
        handleSaveDraft();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [title, content, excerpt, tags, status, saved]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchBlogs = async () => {
    if (!user) return;
    try {
      const response = await axios.get('http://localhost:8000/api/blogs', {
        params: { author_id: user.id },
        ...getAuthHeaders()
      });
      setBlogs(response.data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    }
  };

  const handleBlogSelect = (blog: Blog) => {
    setSelectedBlogId(blog.id);
    setTitle(blog.title);
    setContent(blog.content);
    setExcerpt(blog.excerpt);
    setTags(blog.tags.join(', '));
    setStatus(blog.status);
    setSaved(true);
  };

  const handleNewBlog = () => {
    setSelectedBlogId(null);
    setTitle('');
    setContent('');
    setExcerpt('');
    setTags('');
    setStatus('draft');
    setSaved(true);
  };

  const handleSaveDraft = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const blogData = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 150),
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        status: 'draft'
      };

      if (selectedBlogId) {
        await axios.put(`http://localhost:8000/api/blogs/${selectedBlogId}`, blogData, getAuthHeaders());
      } else {
        const response = await axios.post('http://localhost:8000/api/blogs', blogData, getAuthHeaders());
        setSelectedBlogId(response.data.id);
      }
      
      setSaved(true);
      setLastSaved(new Date());
      fetchBlogs();
    } catch (error) {
      console.error('Error saving blog:', error);
    } finally {
      setLoading(false);
    }
  }, [title, content, excerpt, tags, selectedBlogId, token]);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    setLoading(true);
    try {
      const blogData = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 150),
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        status: 'published'
      };

      if (selectedBlogId) {
        await axios.put(`http://localhost:8000/api/blogs/${selectedBlogId}`, blogData, getAuthHeaders());
      } else {
        await axios.post('http://localhost:8000/api/blogs', blogData, getAuthHeaders());
      }
      
      fetchBlogs();
      handleNewBlog();
      alert('Post published successfully!');
    } catch (error) {
      console.error('Error publishing blog:', error);
      alert('Error publishing post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBlogId) return;
    
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/blogs/${selectedBlogId}`, getAuthHeaders());
      fetchBlogs();
      handleNewBlog();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Error deleting post');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="editor-page auth-loading">
        <div className="auth-loading-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="editor-page auth-required">
        <div className="auth-required-card">
          <span className="auth-icon">✍️</span>
          <h2>Sign in to write</h2>
          <p>You need to be signed in to create and manage your posts.</p>
          <div className="auth-required-actions">
            <Link to="/signin" className="btn btn-primary">Sign In</Link>
            <Link to="/signup" className="btn btn-secondary">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredBlogs = blogs
    .filter(blog => {
      if (filterStatus !== 'all' && blog.status !== filterStatus) return false;
      if (searchQuery) {
        return blog.title.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const wordCount = content.trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="editor-page">
      <div className="editor-sidebar">
        <div className="sidebar-header">
          <button className="btn btn-primary btn-block" onClick={handleNewBlog}>
            + New post
          </button>
        </div>

        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-sm"
          />
        </div>

        <div className="sidebar-filters">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterStatus === 'draft' ? 'active' : ''}`}
            onClick={() => setFilterStatus('draft')}
          >
            Drafts
          </button>
          <button
            className={`filter-btn ${filterStatus === 'published' ? 'active' : ''}`}
            onClick={() => setFilterStatus('published')}
          >
            Published
          </button>
        </div>

        <div className="blog-list">
          {filteredBlogs.map((blog) => (
            <div
              key={blog.id}
              className={`blog-item ${selectedBlogId === blog.id ? 'active' : ''}`}
              onClick={() => handleBlogSelect(blog)}
            >
              <div className="blog-item-header">
                <h4>{blog.title || 'Untitled'}</h4>
                <span className={`status-badge ${blog.status}`}>
                  {blog.status === 'draft' ? 'Draft' : 'Published'}
                </span>
              </div>
              <p className="blog-item-date">
                {new Date(blog.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="editor-main">
        <div className="editor-toolbar">
          <input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
            className="title-input"
          />
          
          <div className="toolbar-actions">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setSaved(false); }}
              className="status-select"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            
            <div className="view-mode-buttons">
              <button
                className={`view-btn ${viewMode === 'write' ? 'active' : ''}`}
                onClick={() => setViewMode('write')}
              >
                Write
              </button>
              <button
                className={`view-btn ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => setViewMode('split')}
              >
                Split
              </button>
              <button
                className={`view-btn ${viewMode === 'preview' ? 'active' : ''}`}
                onClick={() => setViewMode('preview')}
              >
                Preview
              </button>
            </div>

            {selectedBlogId && (
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={handleSaveDraft}
              disabled={loading || !title || !content}
            >
              Save draft
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePublish}
              disabled={loading || !title || !content}
            >
              Publish
            </button>
          </div>
        </div>

        <div className="editor-meta">
          <input
            type="text"
            placeholder="Excerpt (optional)"
            value={excerpt}
            onChange={(e) => { setExcerpt(e.target.value); setSaved(false); }}
            className="excerpt-input"
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => { setTags(e.target.value); setSaved(false); }}
            className="tags-input"
          />
        </div>

        <div className={`editor-content ${viewMode}`}>
          {(viewMode === 'write' || viewMode === 'split') && (
            <div className="editor-pane">
              <textarea
                placeholder="Write your post in Markdown..."
                value={content}
                onChange={(e) => { setContent(e.target.value); setSaved(false); }}
                className="markdown-editor"
              />
            </div>
          )}
          
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="preview-pane">
              <div className="preview-content">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        <div className="editor-footer">
          <div className="editor-stats">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{readTime} min read</span>
          </div>
          <div className="save-status">
            {saved && lastSaved && (
              <span>Saved at {lastSaved.toLocaleTimeString()}</span>
            )}
            {!saved && <span>Unsaved changes</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
