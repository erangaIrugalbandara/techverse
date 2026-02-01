from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import re

app = FastAPI(title="Techverse Blog API")

# Security
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with database in production)
users = []
blogs = []
user_id_counter = 1
blog_id_counter = 1


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        user = next((u for u in users if u["id"] == int(user_id)), None)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")


def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[dict]:
    if credentials is None:
        return None
    try:
        return get_current_user(credentials)
    except:
        return None


def calculate_read_time(content: str) -> int:
    """Calculate estimated reading time in minutes"""
    text = re.sub(r'<[^>]+>|[#*`]', '', content)
    words = len(text.split())
    return max(1, round(words / 200))


# User Models
class UserCreate(BaseModel):
    display_name: str
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    id: int
    display_name: str
    username: str
    email: str
    bio: Optional[str] = None
    avatar: Optional[str] = None
    created_at: str


class UserProfile(BaseModel):
    id: int
    display_name: str
    username: str
    bio: Optional[str] = None
    avatar: Optional[str] = None
    post_count: int


# Blog Models
class BlogCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    tags: Optional[List[str]] = []
    status: Optional[str] = "draft"


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None


class Blog(BaseModel):
    id: int
    title: str
    content: str
    excerpt: Optional[str] = None
    tags: List[str] = []
    status: str = "draft"
    read_time: int = 1
    author_id: int
    author_name: str
    author_username: str
    created_at: str
    updated_at: str


@app.get("/health")
def healthcheck() -> dict:
    return {"status": "ok"}


# Auth Endpoints
@app.post("/api/auth/signup")
def signup(user_data: UserCreate):
    """Create a new user account"""
    global user_id_counter
    
    # Check if email or username already exists
    if any(u["email"] == user_data.email for u in users):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if any(u["username"] == user_data.username for u in users):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    now = datetime.now().isoformat()
    user = {
        "id": user_id_counter,
        "display_name": user_data.display_name,
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "bio": None,
        "avatar": None,
        "created_at": now
    }
    users.append(user)
    user_id_counter += 1
    
    # Create access token
    access_token = create_access_token({"sub": str(user["id"])})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "display_name": user["display_name"],
            "username": user["username"],
            "email": user["email"],
            "bio": user["bio"],
            "avatar": user["avatar"]
        }
    }


@app.post("/api/auth/login")
def login(credentials: UserLogin):
    """Sign in to an existing account"""
    user = next((u for u in users if u["email"] == credentials.email), None)
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token({"sub": str(user["id"])})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "display_name": user["display_name"],
            "username": user["username"],
            "email": user["email"],
            "bio": user["bio"],
            "avatar": user["avatar"]
        }
    }


@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": current_user["id"],
        "display_name": current_user["display_name"],
        "username": current_user["username"],
        "email": current_user["email"],
        "bio": current_user["bio"],
        "avatar": current_user["avatar"]
    }


@app.get("/api/users/{username}", response_model=UserProfile)
def get_user_profile(username: str):
    """Get user profile by username"""
    user = next((u for u in users if u["username"] == username), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    post_count = len([b for b in blogs if b["author_id"] == user["id"] and b["status"] == "published"])
    
    return {
        "id": user["id"],
        "display_name": user["display_name"],
        "username": user["username"],
        "bio": user["bio"],
        "avatar": user["avatar"],
        "post_count": post_count
    }


@app.get("/api/blogs", response_model=List[Blog])
def get_blogs(
    status: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    author_id: Optional[int] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get all blogs with optional filters"""
    filtered_blogs = blogs
    
    # Filter by author
    if author_id:
        filtered_blogs = [b for b in filtered_blogs if b["author_id"] == author_id]
    
    # Filter by status - only show published unless it's the author
    if current_user:
        if status:
            filtered_blogs = [
                b for b in filtered_blogs 
                if b["status"] == status and (b["status"] == "published" or b["author_id"] == current_user["id"])
            ]
        else:
            filtered_blogs = [
                b for b in filtered_blogs 
                if b["status"] == "published" or b["author_id"] == current_user["id"]
            ]
    else:
        filtered_blogs = [b for b in filtered_blogs if b["status"] == "published"]
    
    if tag:
        filtered_blogs = [b for b in filtered_blogs if tag in b["tags"]]
    
    if search:
        search_lower = search.lower()
        filtered_blogs = [
            b for b in filtered_blogs 
            if search_lower in b["title"].lower() or search_lower in b["content"].lower()
        ]
    
    return sorted(filtered_blogs, key=lambda x: x["updated_at"], reverse=True)


@app.get("/api/blogs/{blog_id}", response_model=Blog)
def get_blog(blog_id: int, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """Get a specific blog by ID"""
    blog = next((b for b in blogs if b["id"] == blog_id), None)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    # Check if user can view this blog
    if blog["status"] == "draft" and (not current_user or blog["author_id"] != current_user["id"]):
        raise HTTPException(status_code=404, detail="Blog not found")
    
    return blog


@app.post("/api/blogs", response_model=Blog)
def create_blog(blog_data: BlogCreate, current_user: dict = Depends(get_current_user)):
    """Create a new blog post"""
    global blog_id_counter
    
    now = datetime.now().isoformat()
    clean_content = re.sub(r'<[^>]+>|[#*`]', '', blog_data.content)
    excerpt = blog_data.excerpt or clean_content[:150]
    
    blog = {
        "id": blog_id_counter,
        "title": blog_data.title,
        "content": blog_data.content,
        "excerpt": excerpt,
        "tags": blog_data.tags or [],
        "status": blog_data.status or "draft",
        "read_time": calculate_read_time(blog_data.content),
        "author_id": current_user["id"],
        "author_name": current_user["display_name"],
        "author_username": current_user["username"],
        "created_at": now,
        "updated_at": now
    }
    blogs.append(blog)
    blog_id_counter += 1
    return blog


@app.put("/api/blogs/{blog_id}", response_model=Blog)
def update_blog(blog_id: int, blog_data: BlogUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing blog post"""
    blog = next((b for b in blogs if b["id"] == blog_id), None)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    # Check if user owns this blog
    if blog["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this blog")
    
    if blog_data.title is not None:
        blog["title"] = blog_data.title
    if blog_data.content is not None:
        blog["content"] = blog_data.content
        blog["read_time"] = calculate_read_time(blog_data.content)
    if blog_data.excerpt is not None:
        blog["excerpt"] = blog_data.excerpt
    if blog_data.tags is not None:
        blog["tags"] = blog_data.tags
    if blog_data.status is not None:
        blog["status"] = blog_data.status
    blog["updated_at"] = datetime.now().isoformat()
    
    return blog


@app.delete("/api/blogs/{blog_id}")
def delete_blog(blog_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a blog post"""
    global blogs
    
    blog = next((b for b in blogs if b["id"] == blog_id), None)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    # Check if user owns this blog
    if blog["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this blog")
    
    blogs = [b for b in blogs if b["id"] != blog_id]
    return {"message": "Blog deleted successfully"}
