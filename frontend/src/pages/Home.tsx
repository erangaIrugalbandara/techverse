import { useState, useEffect } from 'react';
import axios from 'axios';
import TypingAnimation from '../components/TypingAnimation';
import BlogCard from '../components/BlogCard';
import './Home.css';

interface Blog {
  id: number;
  title: string;
  content: string;
  excerpt: string;
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
      const response = await axios.get('http://localhost:8000/api/blogs');
      setBlogs(response.data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Techverse</h1>
          <div className="hero-description">
            <TypingAnimation 
              text="Hi! I'm a passionate developer sharing my journey through technology, coding, and innovation. Explore my thoughts, tutorials, and experiences in the ever-evolving world of tech."
              speed={30}
            />
          </div>
        </div>
      </section>

      <section className="blog-section">
        <h2 className="section-title">Recent Posts</h2>
        {loading ? (
          <p className="loading-text">Loading blogs...</p>
        ) : blogs.length === 0 ? (
          <p className="no-blogs-text">No blogs yet. Create your first blog post!</p>
        ) : (
          <div className="blog-grid">
            {blogs.map((blog) => (
              <BlogCard
                key={blog.id}
                id={blog.id}
                title={blog.title}
                excerpt={blog.excerpt}
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
