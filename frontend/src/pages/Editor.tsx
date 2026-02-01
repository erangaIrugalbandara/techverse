import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Editor.css';

interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt: string;
}

const Editor = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/blogs');
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
  };

  const handleNewBlog = () => {
    setSelectedBlogId(null);
    setTitle('');
    setContent('');
    setExcerpt('');
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    setLoading(true);
    try {
      if (selectedBlogId) {
        // Update existing blog
        await axios.put(`http://localhost:8000/api/blogs/${selectedBlogId}`, {
          title,
          content,
          excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 150)
        });
        alert('Blog updated successfully!');
      } else {
        // Create new blog
        await axios.post('http://localhost:8000/api/blogs', {
          title,
          content,
          excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 150)
        });
        alert('Blog created successfully!');
      }
      fetchBlogs();
      handleNewBlog();
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Error saving blog');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBlogId) return;
    
    if (!confirm('Are you sure you want to delete this blog?')) return;

    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/blogs/${selectedBlogId}`);
      alert('Blog deleted successfully!');
      fetchBlogs();
      handleNewBlog();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Error deleting blog');
    } finally {
      setLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="editor-page">
      <div className="editor-sidebar">
        <div className="sidebar-header">
          <h2>My Blogs</h2>
          <button className="btn btn-new" onClick={handleNewBlog}>
            + New Blog
          </button>
        </div>
        <div className="blog-list">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className={`blog-item ${selectedBlogId === blog.id ? 'active' : ''}`}
              onClick={() => handleBlogSelect(blog)}
            >
              <h4>{blog.title}</h4>
              <p>{blog.excerpt.substring(0, 60)}...</p>
            </div>
          ))}
        </div>
      </div>

      <div className="editor-main">
        <div className="editor-header">
          <input
            type="text"
            placeholder="Blog Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
          />
          <div className="editor-actions">
            {selectedBlogId && (
              <button 
                className="btn btn-delete" 
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </button>
            )}
            <button 
              className="btn btn-save" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : selectedBlogId ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Short excerpt (optional)"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="excerpt-input"
        />

        <div className="editor-content">
          <ReactQuill 
            theme="snow" 
            value={content}
            onChange={setContent}
            modules={modules}
            placeholder="Start writing your blog..."
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;
