import { Link } from 'react-router-dom';
import './BlogCard.css';

interface BlogCardProps {
  id: number;
  title: string;
  excerpt: string;
  created_at: string;
}

const BlogCard = ({ id, title, excerpt, created_at }: BlogCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="blog-card">
      <h3 className="blog-card-title">{title}</h3>
      <p className="blog-card-date">{formatDate(created_at)}</p>
      <p className="blog-card-excerpt">{excerpt}</p>
      <Link to={`/blog/${id}`} className="blog-card-link">
        Read More →
      </Link>
    </div>
  );
};

export default BlogCard;
