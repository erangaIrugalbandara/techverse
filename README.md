# Techverse - Personal Blogging Website

A full-stack personal blogging platform with a beautiful UI, typing animations, and a rich text editor.

## Features

### Homepage
- **Techverse logo** and navigation bar at the top
- **Personal introduction** with smooth typing animation
- **Recently posted blogs** displayed in a responsive grid layout
- Scroll to view blog posts

### Blog Editor
- **Create** new blog posts with rich text formatting
- **Edit** existing blog posts
- **Delete** blog posts
- **Rich text editor** with formatting options:
  - Headers, bold, italic, underline, strike-through
  - Lists (ordered/unordered)
  - Colors and backgrounds
  - Text alignment
  - Links and images
  - Code blocks

### Blog View
- Read full blog posts
- Clean, readable layout
- Responsive design

## Tech Stack

### Backend
- FastAPI (Python)
- Pydantic for data validation
- CORS enabled for frontend communication
- In-memory storage (can be replaced with a database)

### Frontend
- React 19 with TypeScript
- React Router for navigation
- React Quill for rich text editing
- Axios for API calls
- Modern CSS with animations

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install npm dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. **Start both servers** (backend and frontend)
2. Open `http://localhost:5173` in your browser
3. **Homepage**: View your personal introduction and recent blog posts
4. **Editor Tab**: Click "Editor" in the navigation to create, edit, or delete blogs
5. **Create a Blog**: Click "+ New Blog" and start writing with the rich text editor
6. **Save**: Click "Publish" to save your blog post
7. **Edit**: Select a blog from the sidebar to edit it
8. **Delete**: Select a blog and click "Delete" to remove it
9. **View**: Click "Read More" on any blog card to read the full post

## API Endpoints

- `GET /api/blogs` - Get all blog posts
- `GET /api/blogs/{id}` - Get a specific blog post
- `POST /api/blogs` - Create a new blog post
- `PUT /api/blogs/{id}` - Update a blog post
- `DELETE /api/blogs/{id}` - Delete a blog post
- `GET /health` - Health check endpoint

## Customization

### Personal Information
Edit the typing animation text in [frontend/src/pages/Home.tsx](frontend/src/pages/Home.tsx) to customize your personal introduction.

### Colors and Styling
- Main gradient: Purple (`#667eea`) to Violet (`#764ba2`)
- Accent color: Gold (`#ffd700`)
- Modify CSS files to change colors and styles

## Future Enhancements

- Add a database (PostgreSQL, MongoDB, etc.)
- User authentication and authorization
- Blog categories and tags
- Search functionality
- Comments system
- Dark mode toggle
- Image upload support
- SEO optimization
- Social media sharing

## License

MIT License
