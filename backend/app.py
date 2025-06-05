from flask import Flask, request, send_file
import numpy as np 
import cv2
import io
from flask_cors import CORS
import zipfile
#import werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app, expose_headers=["Content-Disposition"]) # allows cross-origin requests from next.js

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

def skew_image(image, skew_x=0.0, skew_y=0.0):
    """Apply horizontal and vertical skew to the image."""
    rows, cols = image.shape[:2]

    # Define the source triangle
    pts1 = np.float32([[0, 0], [cols, 0], [0, rows]])

    # Define how points are moved — apply skew
    pts2 = np.float32([
        [0 + skew_x * rows, 0],
        [cols + skew_x * rows, 0],
        [0, rows + skew_y * cols]
    ])

    # Compute affine matrix and apply
    M = cv2.getAffineTransform(pts1, pts2)
    return cv2.warpAffine(image, M, (cols, rows))

@app.route('/crop', methods=['POST'])
def crop_image():

    files  = request.files.getlist('images')
    form_data = request.form

    print(files)

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for idx, file in enumerate(files):
            # Decode image 
            file_bytes = np.frombuffer(file.read(), np.uint8)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            prefix = f'file_{idx}_'
            #project = form_data.get(prefix + 'project', 'default_project')
            hole_id = form_data.get(prefix + 'hole-id', 'hole')
            drill_from = form_data.get(prefix + 'from', '0')
            drill_to = form_data.get(prefix + 'to', '0')
            quality = int(form_data.get(prefix + 'quality', 80))
            condition = form_data.get(prefix + 'condition', 'D')

            # Get crop dimensions (your frontend must provide them)
            x = int(form_data.get(prefix + 'x', 0))
            y = int(form_data.get(prefix + 'y', 0))
            w = int(form_data.get(prefix + 'w', image.shape[1]))
            h = int(form_data.get(prefix + 'h', image.shape[0])) 

            rotation = float(form_data.get(prefix + 'rotation', 0))
            rotated_image = rotate_image(image, rotation)

            rotation = float(form_data.get(prefix + 'rotation', 0))
            rotated_image = rotate_image(image, rotation)

            # Get skew parameters from form
            skew_x = float(form_data.get(prefix + 'skewX', 0))
            skew_y = float(form_data.get(prefix + 'skewY', 0))

            # Apply skew to the rotated image
            processed_image = skew_image(rotated_image, skew_x, skew_y)

            # Now crop from the fully transformed image
            cropped_image = processed_image[y:y+h, x:x+w]

            # Now crop from rotated_image, not image
            #cropped_image = rotated_image[y:y+h, x:x+w]


             # crop image
            #cropped_image = image[y:y+h, x:x+w]

            # Save with compression
            #cropped_image = cv2.imwrite('cropped_image.jpg', cropped_image, [cv2.IMWRITE_JPEG_QUALITY, 8])

            #download_name = f'{hole_id}_{condition}_{drill_from}_{drill_to}.jpg'

            #print(f"Download name: {download_name}")

            # encode image to jpg
            _, buffer = cv2.imencode('.jpg', cropped_image, [cv2.IMWRITE_JPEG_QUALITY, quality])
            filename = f'{hole_id}_{condition}_{drill_from}_{drill_to}.jpg'

            zip_file.writestr(filename, buffer.tobytes())
    zip_buffer.seek(0)
    return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name='cropped_images.zip')



if __name__ == '__main__':
    app.run(debug=True)