from flask import Flask, request, send_file
import numpy as np 
import cv2
import io
from flask_cors import CORS
import zipfile
#import werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app, expose_headers=["Content-Disposition"]) # allows cross-origin requests from next.js

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

             # crop image
            cropped_image = image[y:y+h, x:x+w]

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