from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="Techverse Blog API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with database in production)
blogs = []
blog_id_counter = 1


class BlogCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None


class Blog(BaseModel):
    id: int
    title: str
    content: str
    excerpt: Optional[str] = None
    created_at: str
    updated_at: str


@app.get("/health")
def healthcheck() -> dict:
    return {"status": "ok"}


@app.get("/api/blogs", response_model=List[Blog])
def get_blogs():
    """Get all blogs"""
    return sorted(blogs, key=lambda x: x["updated_at"], reverse=True)


@app.get("/api/blogs/{blog_id}", response_model=Blog)
def get_blog(blog_id: int):
    """Get a specific blog by ID"""
    for blog in blogs:
        if blog["id"] == blog_id:
            return blog
    raise HTTPException(status_code=404, detail="Blog not found")


@app.post("/api/blogs", response_model=Blog)
def create_blog(blog_data: BlogCreate):
    """Create a new blog post"""
    global blog_id_counter
    
    now = datetime.now().isoformat()
    blog = {
        "id": blog_id_counter,
        "title": blog_data.title,
        "content": blog_data.content,
        "excerpt": blog_data.excerpt or blog_data.content[:150],
        "created_at": now,
        "updated_at": now
    }
    blogs.append(blog)
    blog_id_counter += 1
    return blog


@app.put("/api/blogs/{blog_id}", response_model=Blog)
def update_blog(blog_id: int, blog_data: BlogUpdate):
    """Update an existing blog post"""
    for blog in blogs:
        if blog["id"] == blog_id:
            if blog_data.title is not None:
                blog["title"] = blog_data.title
            if blog_data.content is not None:
                blog["content"] = blog_data.content
            if blog_data.excerpt is not None:
                blog["excerpt"] = blog_data.excerpt
            blog["updated_at"] = datetime.now().isoformat()
            return blog
    raise HTTPException(status_code=404, detail="Blog not found")


@app.delete("/api/blogs/{blog_id}")
def delete_blog(blog_id: int):
    """Delete a blog post"""
    global blogs
    initial_length = len(blogs)
    blogs = [blog for blog in blogs if blog["id"] != blog_id]
    if len(blogs) == initial_length:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {"message": "Blog deleted successfully"}
