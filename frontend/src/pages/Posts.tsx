import { useState, useEffect } from 'react';
import axios from 'axios';
import BlogCard from '../components/BlogCard';
import './Posts.css';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: string;
  read_time: number;
  created_at: string;
  updated_at: string;
}

const Posts = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    filterAndSortBlogs();
  }, [blogs, searchQuery, selectedTag, sortBy]);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/blogs', {
        params: { status: 'published' }
      });
      setBlogs(response.data);
      
      // Extract unique tags
      const tags = new Set<string>();
      response.data.forEach((blog: Blog) => {
        blog.tags.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBlogs = () => {
    let filtered = [...blogs];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(query) ||
        blog.excerpt.toLowerCase().includes(query)
      );
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(blog => blog.tags.includes(selectedTag));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredBlogs(filtered);
  };

  return (
    <div className="posts-page">
      <div className="posts-header">
        <h1 className="posts-title">All posts</h1>
        <p className="posts-subtitle">
          {blogs.length} {blogs.length === 1 ? 'post' : 'posts'} published
        </p>
      </div>

      <div className="posts-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="updated">Recently updated</option>
          </select>
        </div>

        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            ⊞
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            ☰
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="tags-filter">
          <button
            className={`tag-chip ${selectedTag === null ? 'active' : ''}`}
            onClick={() => setSelectedTag(null)}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="loading-text">Loading posts...</p>
      ) : filteredBlogs.length === 0 ? (
        <div className="empty-state">
          <p>No posts found.</p>
        </div>
      ) : (
        <div className={`blog-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
          {filteredBlogs.map((blog) => (
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
    </div>
  );
};

export default Posts;
