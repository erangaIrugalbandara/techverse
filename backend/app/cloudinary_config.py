import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)


def upload_image(file_data, folder: str = "techverse/avatars") -> str:
    """
    Upload image to Cloudinary and return the URL
    
    Args:
        file_data: File bytes or file path
        folder: Cloudinary folder name
    
    Returns:
        Secure URL of uploaded image
    """
    result = cloudinary.uploader.upload(
        file_data,
        folder=folder,
        transformation=[
            {'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face'},
            {'quality': 'auto', 'fetch_format': 'auto'}
        ]
    )
    return result['secure_url']


def delete_image(public_id: str) -> bool:
    """
    Delete image from Cloudinary
    
    Args:
        public_id: Public ID of the image to delete
    
    Returns:
        True if successful
    """
    result = cloudinary.uploader.destroy(public_id)
    return result.get('result') == 'ok'
