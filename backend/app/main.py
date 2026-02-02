from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from dotenv import load_dotenv
import bcrypt
import os
import re
from .database import users_collection, blogs_collection
from .cloudinary_config import upload_image

# Load environment variables
load_dotenv()

app = FastAPI(title="Techverse Blog API")

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))

security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def hash_password(password: str) -> str:
    # Bcrypt has a max password length of 72 bytes, truncate if necessary
    """Hash password using bcrypt"""
    # Encode password to bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    # Encode both to bytes
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    # Verify
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        user = await users_collection.find_one({"_id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")


async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[dict]:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
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
    id: str
    display_name: str
    username: str
    email: str
    bio: Optional[str] = None
    avatar: Optional[str] = None
    created_at: str


class UserProfile(BaseModel):
    id: str
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
    id: str
    title: str
    content: str
    excerpt: Optional[str] = None
    tags: List[str] = []
    status: str = "draft"
    read_time: int = 1
    author_id: str
    author_name: str
    author_username: str
    created_at: str
    updated_at: str


@app.get("/health")
async def healthcheck() -> dict:
    return {"status": "ok"}


# Auth Endpoints
@app.post("/api/auth/signup")
async def signup(user_data: UserCreate):
    """Create a new user account"""
    
    # Check if email or username already exists
    existing_email = await users_collection.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await users_collection.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Generate unique ID
    import uuid
    user_id = str(uuid.uuid4())
    
    now = datetime.now().isoformat()
    user = {
        "_id": user_id,
        "display_name": user_data.display_name,
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "bio": None,
        "avatar": None,
        "created_at": now
    }
    
    await users_collection.insert_one(user)
    
    # Create access token
    access_token = create_access_token({"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "display_name": user["display_name"],
            "username": user["username"],
            "email": user["email"],
            "bio": user["bio"],
            "avatar": user["avatar"]
        }
    }


@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    """Sign in to an existing account"""
    user = await users_collection.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token({"sub": user["_id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "display_name": user["display_name"],
            "username": user["username"],
            "email": user["email"],
            "bio": user["bio"],
            "avatar": user["avatar"]
        }
    }


@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": current_user["_id"],
        "display_name": current_user["display_name"],
        "username": current_user["username"],
        "email": current_user["email"],
        "bio": current_user["bio"],
        "avatar": current_user["avatar"]
    }


@app.post("/api/upload/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload user avatar"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Upload to Cloudinary
    contents = await file.read()
    avatar_url = upload_image(contents, folder="techverse/avatars")
    
    # Update user in database
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"avatar": avatar_url}}
    )
    
    return {"avatar_url": avatar_url}


@app.get("/api/users/{username}", response_model=UserProfile)
async def get_user_profile(username: str):
    """Get user profile by username"""
    user = await users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    post_count = await blogs_collection.count_documents({"author_id": user["_id"], "status": "published"})
    
    return {
        "id": user["_id"],
        "display_name": user["display_name"],
        "username": user["username"],
        "bio": user["bio"],
        "avatar": user["avatar"],
        "post_count": post_count
    }


@app.get("/api/blogs", response_model=List[Blog])
async def get_blogs(
    status: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    author_id: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get all blogs with optional filters"""
    query = {}
    
    # Filter by author
    if author_id:
        query["author_id"] = author_id
    
    # Filter by status
    if current_user:
        if status:
            query["status"] = status
        # Show published posts or user's own posts
        if "status" not in query:
            query["$or"] = [
                {"status": "published"},
                {"author_id": current_user["_id"]}
            ]
    else:
        query["status"] = "published"
    
    # Filter by tag
    if tag:
        query["tags"] = tag
    
    # Search
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]
    
    blogs = await blogs_collection.find(query).sort("updated_at", -1).to_list(length=None)
    
    # Convert _id to id for response
    for blog in blogs:
        blog["id"] = blog.pop("_id")
    
    return blogs


@app.get("/api/blogs/{blog_id}", response_model=Blog)
async def get_blog(blog_id: str, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """Get a specific blog by ID"""
    blog = await blogs_collection.find_one({"_id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    # Check if user can view this blog
    if blog["status"] == "draft" and (not current_user or blog["author_id"] != current_user["_id"]):
        raise HTTPException(status_code=404, detail="Blog not found")
    
    blog["id"] = blog.pop("_id")
    return blog


@app.post("/api/blogs", response_model=Blog)
async def create_blog(blog_data: BlogCreate, current_user: dict = Depends(get_current_user)):
    """Create a new blog post"""
    import uuid
    
    blog_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    clean_content = re.sub(r'<[^>]+>|[#*`]', '', blog_data.content)
    excerpt = blog_data.excerpt or clean_content[:150]
    
    blog = {
        "_id": blog_id,
        "title": blog_data.title,
        "content": blog_data.content,
        "excerpt": excerpt,
        "tags": blog_data.tags or [],
        "status": blog_data.status or "draft",
        "read_time": calculate_read_time(blog_data.content),
        "author_id": current_user["_id"],
        "author_name": current_user["display_name"],
        "author_username": current_user["username"],
        "created_at": now,
        "updated_at": now
    }
    
    await blogs_collection.insert_one(blog)
    blog["id"] = blog.pop("_id")
    return blog


@app.put("/api/blogs/{blog_id}", response_model=Blog)
async def update_blog(blog_id: str, blog_data: BlogUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing blog post"""
    blog = await blogs_collection.find_one({"_id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    # Check if user owns this blog
    if blog["author_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this blog")
    
    update_data = {"updated_at": datetime.now().isoformat()}
    
    if blog_data.title is not None:
        update_data["title"] = blog_data.title
    if blog_data.content is not None:
        update_data["content"] = blog_data.content
        update_data["read_time"] = calculate_read_time(blog_data.content)
    if blog_data.excerpt is not None:
        update_data["excerpt"] = blog_data.excerpt
    if blog_data.tags is not None:
        update_data["tags"] = blog_data.tags
    if blog_data.status is not None:
        update_data["status"] = blog_data.status
    
    await blogs_collection.update_one({"_id": blog_id}, {"$set": update_data})
    
    updated_blog = await blogs_collection.find_one({"_id": blog_id})
    updated_blog["id"] = updated_blog.pop("_id")
    return updated_blog


@app.delete("/api/blogs/{blog_id}")
async def delete_blog(blog_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a blog post"""
    blog = await blogs_collection.find_one({"_id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    # Check if user owns this blog
    if blog["author_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this blog")
    
    await blogs_collection.delete_one({"_id": blog_id})
    return {"message": "Blog deleted successfully"}
