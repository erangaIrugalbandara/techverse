import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BlogView.css';

interface Blog {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const BlogView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBlog(parseInt(id));
    }
  }, [id]);

  const fetchBlog = async (blogId: number) => {
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

  if (loading) {
    return <div className="blog-view loading">Loading...</div>;
  }

  if (!blog) {
    return <div className="blog-view error">Blog not found</div>;
  }

  return (
    <div className="blog-view">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to Home
      </button>
      <article className="blog-article">
        <h1 className="blog-title">{blog.title}</h1>
        <p className="blog-date">
          Published on {formatDate(blog.created_at)}
          {blog.updated_at !== blog.created_at && ` • Updated on ${formatDate(blog.updated_at)}`}
        </p>
        <div 
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>
    </div>
  );
};

export default BlogView;
