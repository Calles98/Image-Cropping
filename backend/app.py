from flask import Flask, request, send_file
import numpy as np 
import cv2
import io
import json
from flask_cors import CORS
import zipfile
#import werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app, expose_headers=["Content-Disposition"]) # allows cross-origin requests from next.js


def order_points(pts):
    """Orders points: top-left, top-right, bottom-right, bottom-left"""
    rect = np.zeros((4, 2), dtype="float32")
    s = np.sum(pts, axis=1)
    diff = np.diff(pts, axis=1)
    
    rect[0] = pts[np.argmin(s)]      # top-left
    rect[2] = pts[np.argmax(s)]      # bottom-right
    rect[1] = pts[np.argmin(diff)]   # top-right
    rect[3] = pts[np.argmax(diff)]   # bottom-left
    
    return rect

def four_point_transform(image, pts):
    """Performs perspective correction using 4 points."""
    rect = order_points(np.array(pts, dtype="float32"))
    (tl, tr, br, bl) = rect

    # Compute width and height of the new image
    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxWidth = max(int(widthA), int(widthB))

    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxHeight = max(int(heightA), int(heightB))

    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))

    return warped

def rotate_image(image, angle):
    """Rotate image around its center with OpenCV."""
    (h, w) = image.shape[:2]
    center = (w / 2, h / 2)

    # Get rotation matrix
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    
    # Compute the new bounding dimensions of the image
    cos = np.abs(M[0, 0])
    sin = np.abs(M[0, 1])
    new_w = int((h * sin) + (w * cos))
    new_h = int((h * cos) + (w * sin))

    # Adjust rotation matrix to account for translation
    M[0, 2] += (new_w / 2) - center[0]
    M[1, 2] += (new_h / 2) - center[1]

    # Perform the actual rotation and return the image
    return cv2.warpAffine(image, M, (new_w, new_h))


@app.route('/crop', methods=['POST'])
def crop_image():
    files = request.files.getlist('images')
    form_data = request.form

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for idx, file in enumerate(files):
            file_bytes = np.frombuffer(file.read(), np.uint8)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            prefix = f'file_{idx}_'

            print(f"{prefix} raw points:", form_data.get(prefix + 'points'))
            # Metadata
            hole_id = form_data.get(prefix + 'hole-id', 'hole')
            drill_from = form_data.get(prefix + 'from', '0')
            drill_to = form_data.get(prefix + 'to', '0')
            quality = int(form_data.get(prefix + 'quality', 80))
            condition = form_data.get(prefix + 'condition', 'D')
            rotation = float(form_data.get(prefix + 'rotation', '0'))

            # Apply rotation before anything else
            image = rotate_image(image, rotation)

            # Handle corner points (if any)
            points_str = form_data.get(prefix + 'points', None)
            if points_str:
                try:
                    points = json.loads(points_str)
                    if isinstance(points, list) and len(points) == 4:
                        pts = [(pt['x'], pt['y']) for pt in points]
                        cropped_image = four_point_transform(image, pts)
                    else:
                        raise ValueError("Invalid points")
                except Exception as e:
                    print(f"[Warning] Invalid points for {file.filename}: {e}")
                    # fallback to box crop if needed
                    x = int(form_data.get(prefix + 'x', 0))
                    y = int(form_data.get(prefix + 'y', 0))
                    w = int(form_data.get(prefix + 'w', image.shape[1]))
                    h = int(form_data.get(prefix + 'h', image.shape[0]))
                    cropped_image = image[y:y+h, x:x+w]
            else:
                print(f"Received points for {prefix}: {points}")
                # fallback to standard crop
                x = int(form_data.get(prefix + 'x', 0))
                y = int(form_data.get(prefix + 'y', 0))
                w = int(form_data.get(prefix + 'w', image.shape[1]))
                h = int(form_data.get(prefix + 'h', image.shape[0]))
                cropped_image = image[y:y+h, x:x+w]

            # Save to buffer
            _, buffer = cv2.imencode('.jpg', cropped_image, [cv2.IMWRITE_JPEG_QUALITY, quality])
            filename = f'{hole_id}_{condition}_{drill_from}_{drill_to}.jpg'
            zip_file.writestr(filename, buffer.tobytes())

    zip_buffer.seek(0)
    return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name='cropped_images.zip')


if __name__ == '__main__':
    app.run(debug=True)