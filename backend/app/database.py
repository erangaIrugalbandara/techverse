from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import certifi

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")

# Create client with SSL configuration
client = AsyncIOMotorClient(
    MONGODB_URI,
    tls=True,
    tlsAllowInvalidCertificates=True,
    tlsCAFile=certifi.where()
)

db = client.techverse

# Collections
users_collection = db.users
blogs_collection = db.blogs
posts_collection = db.posts
