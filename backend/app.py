import base64
from flask import Flask, jsonify, request, send_file
import numpy as np 
import cv2
import io
from flask_cors import CORS
import zipfile
import easyocr
import re
#import werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app, supports_credentials=True, origins="*", expose_headers=["Content-Disposition"]) # allows cross-origin requests from next.js

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
            quality = int(form_data.get(prefix + 'qualityValue', 80))
            condition = form_data.get(prefix + 'condition', 'D')
            rotation = float(form_data.get(prefix + 'rotation', '0'))

            # Get crop dimensions (your frontend must provide them)
            x = int(float(form_data.get(prefix + 'x', 0)))
            y = int(float(form_data.get(prefix + 'y', 0)))
            w = int(float(form_data.get(prefix + 'w', image.shape[1])))
            h = int(float(form_data.get(prefix + 'h', image.shape[0])))

            rotated_image = rotate_image(image, rotation)  # Rotate the image by 90 degrees

            # Now crop from rotated_image, not image
            cropped_image = rotated_image[y:y+h, x:x+w]


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

@app.route('/crop-mobile', methods=['POST'])
def crop_image_mobile():
    files = request.files.getlist('images')
    form_data = request.form
    results = []

    for idx, file in enumerate(files):
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        prefix = f'file_{idx}_'
        hole_id = form_data.get(f'{prefix}hole-id', 'hole')
        drill_from = form_data.get(f'{prefix}from', '0')
        drill_to = form_data.get(f'{prefix}to', '0')
        quality = int(form_data.get(f'{prefix}qualityValue', 80))
        condition = form_data.get(f'{prefix}condition', 'D')
        rotation = float(form_data.get(f'{prefix}rotation', 0))

        x = int(float(form_data.get(f'{prefix}x', 0)))
        y = int(float(form_data.get(f'{prefix}y', 0)))
        w = int(float(form_data.get(f'{prefix}w', image.shape[1])))
        h = int(float(form_data.get(f'{prefix}h', image.shape[0])))

        rotated = rotate_image(image, rotation)
        cropped = rotated[y:y+h, x:x+w]

        _, buffer = cv2.imencode('.jpg', cropped, [cv2.IMWRITE_JPEG_QUALITY, quality])
        base64_img = base64.b64encode(buffer).decode('utf-8')

        results.append({
            "filename": f"{hole_id}_{condition}_{drill_from}_{drill_to}.jpg",
            "image": base64_img
        })

    return jsonify(results)



@app.route('/auto-crop', methods=['POST'])
def auto_crop_image():
    files = request.files.getlist('images')
    quality = int(request.form.get('qualityValue'))
    condition = str(request.form.get('condition'));
    reader = easyocr.Reader(['en'], gpu=False)
    preview_images = []

    for idx, file in enumerate(files):
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        original_h, original_w = image.shape[:2]

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Gamma correction
        gamma = 3.0
        lut = np.array([((i / 255.0) ** gamma) * 255 for i in range(256)]).astype("uint8")
        gray = cv2.LUT(gray, lut)

        # CLAHE
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)

        adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                         cv2.THRESH_BINARY_INV, 15, 10)
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        combined = cv2.bitwise_and(adaptive, otsu)

        _, bright_mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
        foreground = cv2.bitwise_and(combined, ~bright_mask)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        closed = cv2.morphologyEx(foreground, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        filtered = [cnt for cnt in contours if cv2.contourArea(cnt) > 76000]

        if filtered:
            all_contours = np.vstack(filtered)
            x, y, w, h = cv2.boundingRect(all_contours)

            # Padding
            pad_top, pad_bottom = 40, 20
            pad_left, pad_right = 40, 20
            x1 = max(0, x - pad_left)
            y1 = max(0, y - pad_top)
            x2 = min(image.shape[1], x + w + pad_right)
            y2 = min(image.shape[0], y + h + pad_bottom)

            cropped = image[y1:y2, x1:x2]

            # Resize for OCR
            cropped_np = cropped.copy()
            max_dim = 1000
            h_, w_ = cropped_np.shape[:2]
            if max(h_, w_) > max_dim:
                scale = max_dim / max(h_, w_)
                cropped_np = cv2.resize(cropped_np, (int(w_ * scale), int(h_ * scale)))

            result = reader.readtext(image)
            ocr_text = "\n".join([d[1] for d in result])

            def extract_fields(text):
                hole_id_match = re.search(r'HOLE\s*ID:\s*([^\n,]+)', text, re.IGNORECASE)
                from_match = re.search(r'FROM:\s*([0-9.]+)', text, re.IGNORECASE)
                to_match = re.findall(r'TO:\s*([0-9.]+)', text, re.IGNORECASE) or "No Match"
                #print("FROM MATCH", from_match, "TO MATCH", to_match)
                if to_match:
                    to_match = to_match[0]
                #print("TO MATCH", to_match)

                hole_id = hole_id_match.group(1).strip().replace(" ", "_") if hole_id_match else f"UnknownID {idx}"
                from_val = from_match.group(1).strip() if from_match else "0"
                to_val = to_match.strip() if len(to_match) > 1 else "0"

                return f"{hole_id}_{condition}_{from_val}_{to_val}"
            
            #quality = int(request.form.get('quality', 40))

            metadata = extract_fields(ocr_text) 
            
            filename = metadata + '.jpg'
            
            print(metadata)

            # Encode to base64
            _, buffer = cv2.imencode('.jpg', cropped, [cv2.IMWRITE_JPEG_QUALITY, quality])
            base64_str = base64.b64encode(buffer).decode('utf-8')
            preview_url = f"data:image/jpeg;base64,{base64_str}"

            preview_images.append({
                "filename": filename,
                "preview_url": preview_url,
                "hole_id": metadata.split('_')[0],
                "from": metadata.split('_')[2],
                "to": metadata.split('_')[3],
                "crop": {
                    "x": x1,
                    "y": y1,
                    "w": x2 - x1,
                    "h": y2 - y1,
                },
                "rotation": 0
            })

    return jsonify(preview_images)


    #         else:
    #             print(f"No valid crop region found for {file.filename}")

    # zip_buffer.seek(0)
    # return send_file(zip_buffer, mimetype='application/zip',
    #                  as_attachment=True, download_name='auto_cropped_images.zip')

  




if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)