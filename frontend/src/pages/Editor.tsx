import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import './Editor.css';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: string;
  read_time: number;
  updated_at: string;
  author_id: string;
  cover_image?: string;
}

const Editor = () => {
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [coverImage, setCoverImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'write' | 'preview' | 'split'>('write');
  const [saved, setSaved] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
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
    setExcerpt(blog.excerpt || '');
    setTags(blog.tags.join(', '));
    setStatus(blog.status);
    setCoverImage(blog.cover_image || '');
    setSaved(true);
  };

  const handleNewBlog = () => {
    setSelectedBlogId(null);
    setTitle('');
    setContent('');
    setExcerpt('');
    setTags('');
    setStatus('draft');
    setCoverImage('');
    setSaved(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('http://localhost:8000/api/upload', formData, getAuthHeaders());
      setCoverImage(response.data.url);
      setSaved(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveDraft = useCallback(async () => {
    if (!title.trim() && !content.trim()) return;

    setLoading(true);
    try {
      const blogData = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 150),
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        status: 'draft',
        cover_image: coverImage
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
  }, [title, content, excerpt, tags, status, coverImage, selectedBlogId, token]);

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
        status: 'published',
        cover_image: coverImage
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
    <div className={`editor-page ${showSidebar ? 'sidebar-open' : ''}`}>
      <button 
        className="toggle-sidebar-btn"
        onClick={() => setShowSidebar(!showSidebar)}
        title={showSidebar ? "Close sidebar" : "Show drafts"}
      >
        {showSidebar ? '←' : '→'}
      </button>

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
        <div className="editor-container">
          <div className="editor-header">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
              className="title-input"
              autoFocus
            />
          </div>

          <div className="editor-cover-image">
            <input
              type="file"
              id="cover-image-upload"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {!coverImage ? (
              <label htmlFor="cover-image-upload" className="add-cover-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="plus-icon-svg">
                  <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1"/>
                  <path d="M12 7V17M7 12H17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="btn-text">Add cover image</span>
              </label>
            ) : (
              <div className="cover-image-preview">
                <img src={coverImage} alt="Cover" />
                <div className="cover-image-actions">
                  <label htmlFor="cover-image-upload" className="change-cover-btn">
                    Change
                  </label>
                  <button 
                    className="remove-cover-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      setCoverImage('');
                      setSaved(false);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={`editor-content ${viewMode}`}>
            {(viewMode === 'write' || viewMode === 'split') && (
              <textarea
                placeholder="Write your story..."
                value={content}
                onChange={(e) => { setContent(e.target.value); setSaved(false); }}
                className="markdown-editor"
              />
            )}
            
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className="preview-pane">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="editor-actions-bar">
         <div className="editor-status">
            {saved ? (
              <span className="saved-indicator">Saved</span>
            ) : (
               <span className="unsaved-indicator">Saving...</span>
            )}
         </div>
         <div className="action-buttons">
            <button
            className="btn btn-ghost"
            onClick={handleNewBlog}
             >
            New
            </button>
             {selectedBlogId && (
              <button
                className="btn btn-ghost text-error"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </button>
            )}
           <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setSaved(false); }}
              className="status-select-minimal"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <button
              className="btn btn-primary"
              onClick={handlePublish}
              disabled={loading || !title || !content}
            >
              {status === 'published' ? 'Update' : 'Publish'}
            </button>
         </div>
      </div>
    </div>
  );
};


export default Editor;
