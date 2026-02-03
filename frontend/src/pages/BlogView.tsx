import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './BlogView.css';

interface Blog {
  id: string;
  title: string;
  content: string;
  tags: string[];
  read_time: number;
  created_at: string;
  updated_at: string;
  cover_image?: string;
}

const BlogView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBlog(id);
    }
  }, [id]);

  const fetchBlog = async (blogId: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/blogs/${blogId}`);
      setBlog(response.data);
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (loading) {
    return <div className="blog-view loading">Loading...</div>;
  }

  if (!blog) {
    return <div className="blog-view error">Post not found</div>;
  }

  return (
    <div className="blog-view">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>
      
      <article className="blog-article">
        <header className="blog-header">
          <h1 className="blog-title">{blog.title}</h1>
          <div className="blog-meta">
            <span className="blog-date">{formatDate(blog.created_at)}</span>
            <span className="blog-separator">•</span>
            <span className="blog-read-time">{blog.read_time} min read</span>
          </div>
          {blog.tags.length > 0 && (
            <div className="blog-tags">
              {blog.tags.map((tag, index) => (
                <span key={index} className="blog-tag">{tag}</span>
              ))}
            </div>
          )}
        </header>

        {blog.cover_image && (
          <div className="blog-cover-image">
            <img src={blog.cover_image} alt={blog.title} />
          </div>
        )}
        
        <div className="blog-content">
          <ReactMarkdown
            components={{
              code: ({ node, inline, className, children, ...props }) => {
                const codeString = String(children).replace(/\n$/, '');
                return inline ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <div className="code-block">
                    <button
                      className="copy-button"
                      onClick={() => copyCode(codeString)}
                      title="Copy code"
                    >
                      Copy
                    </button>
                    <pre>
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                );
              }
            }}
          >
            {blog.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
};

export default BlogView;
