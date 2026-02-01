import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import TypingAnimation from '../components/TypingAnimation';
import BlogCard from '../components/BlogCard';
import './Home.css';

interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: string;
  read_time: number;
  created_at: string;
  updated_at: string;
}

const Home = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/blogs', {
        params: { status: 'published' }
      });
      setBlogs(response.data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const typingTexts = [
    "Developer sharing insights on web technologies, system design, and modern development practices.",
    "Writing about JavaScript, React, Python, and the evolving landscape of software engineering.",
    "Exploring code, architecture, and the art of building scalable applications."
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-wordmark">Techverse</div>
          <h1 className="hero-title">Modern insights on code, systems, and technology</h1>
          <div className="hero-typing">
            <TypingAnimation texts={typingTexts} speed={40} />
          </div>
          <div className="hero-actions">
            <Link to="/posts" className="btn btn-primary">
              Read latest
            </Link>
            <Link to="/editor" className="btn btn-secondary">
              Create post
            </Link>
          </div>
        </div>
      </section>

      <section className="recent-posts">
        <div className="section-header">
          <h2 className="section-title">Recent posts</h2>
          <Link to="/posts" className="section-link">View all →</Link>
        </div>
        
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : blogs.length === 0 ? (
          <div className="empty-state">
            <p>No published posts yet.</p>
            <Link to="/editor" className="btn btn-primary">Create your first post</Link>
          </div>
        ) : (
          <div className="blog-grid">
            {blogs.map((blog) => (
              <BlogCard
                key={blog.id}
                id={blog.id}
                title={blog.title}
                excerpt={blog.excerpt}
                tags={blog.tags}
                read_time={blog.read_time}
                created_at={blog.created_at}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
