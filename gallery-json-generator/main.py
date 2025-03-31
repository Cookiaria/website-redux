import os
import json
import subprocess

def generate_gallery_json(directory, output_file):
    image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']

    base_path = "/assets/images/gallery/source"
    thumbnail_folder = "thumbnails"

    if not os.path.exists(thumbnail_folder):
        os.makedirs(thumbnail_folder)

    image_data = []

    files = sorted([f for f in os.listdir(directory) if any(f.lower().endswith(ext) for ext in image_extensions)])

    for filename in files:
        original_image_path = os.path.join(directory, filename)

        source_path = os.path.join(base_path, filename)

        thumbnail_filename = f"thumb_{filename}"
        thumbnail_path = os.path.join(thumbnail_folder, thumbnail_filename)

        try:
            subprocess.run(
                ["convert", original_image_path, "-resize", "350x", thumbnail_path],
                check=True
            )
            print(f"Generated thumbnail: {thumbnail_path}")
        except subprocess.CalledProcessError as e:
            print(f"Failed to generate thumbnail for {filename}: {e}")
            continue

        image_entry = {
            "source": source_path,
            "thumbnail": f"/assets/images/gallery/thumbs/{thumbnail_filename}",
            "title": "TEMP_PLSFILLME",
            "artist": "TEMP_PLSFILLME"
        }

        image_data.append(image_entry)

    with open(output_file, 'w') as json_file:
        json.dump(image_data, json_file, indent=4)

    print(f"Generated JSON file: {output_file}")

# Example usage
if __name__ == "__main__":
    image_directory = "../assets/images/gallery/source/"  
    output_json_file = "gallery.json"
    generate_gallery_json(image_directory, output_json_file)
