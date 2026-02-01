import { Link } from 'react-router-dom';
import './BlogCard.css';

interface BlogCardProps {
  id: number;
  title: string;
  excerpt: string;
  tags: string[];
  read_time: number;
  created_at: string;
  status?: string;
}

const BlogCard = ({ id, title, excerpt, tags, read_time, created_at, status }: BlogCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Link to={`/blog/${id}`} className="blog-card">
      <div className="blog-card-header">
        <h3 className="blog-card-title">{title}</h3>
        {status && status === 'draft' && (
          <span className="blog-card-status">Draft</span>
        )}
      </div>
      <p className="blog-card-excerpt">{excerpt}</p>
      <div className="blog-card-footer">
        <div className="blog-card-tags">
          {tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="blog-card-tag">{tag}</span>
          ))}
        </div>
        <div className="blog-card-meta">
          <span className="blog-card-date">{formatDate(created_at)}</span>
          <span className="blog-card-separator">•</span>
          <span className="blog-card-read-time">{read_time} min read</span>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
