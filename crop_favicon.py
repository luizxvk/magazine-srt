from PIL import Image
import sys
import os

def crop_image(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        
        # Get the bounding box of the non-zero alpha content
        bbox = img.getbbox()
        
        if bbox:
            cropped_img = img.crop(bbox)
            cropped_img.save(image_path)
            print(f"Successfully cropped {image_path}")
            print(f"Original size: {img.size}, New size: {cropped_img.size}")
        else:
            print("Image is completely transparent or empty.")
            
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    target_file = r"c:\Users\Luiz\Documents\magazine-srt-react\client\public\favicon.png"
    if os.path.exists(target_file):
        crop_image(target_file)
    else:
        print(f"File not found: {target_file}")
