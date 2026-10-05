from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import predict_retinopathy, generate_gradcam
import tempfile
import os
import base64


app = Flask(__name__)
CORS(app)


@app.route("/predict", methods=["POST"])
def predict():

    if not request.data:
        return jsonify({
            "error": "No image data received"
        }), 400

    temp_path = None
    gradcam_path = None

    try:

        # Get raw image bytes sent by Node.js
        image_data = request.data

        # Determine image type
        content_type = request.content_type or "image/png"

        extension_map = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        }

        suffix = extension_map.get(
            content_type.split(";")[0],
            ".png"
        )

        # Create temporary image file
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            temp_file.write(image_data)
            temp_path = temp_file.name

        # ==============================
        # RetinaCare AI Prediction
        # ==============================

        result = predict_retinopathy(temp_path)

        # ==============================
        # Generate Grad-CAM
        # ==============================

        gradcam_path = temp_path + "_gradcam.png"

        generate_gradcam(
            temp_path,
            gradcam_path
        )

        # ==============================
        # Convert Grad-CAM to Base64
        # ==============================

        with open(
            gradcam_path,
            "rb"
        ) as gradcam_file:

            gradcam_base64 = base64.b64encode(
                gradcam_file.read()
            ).decode("utf-8")

        result["gradcam_image"] = (
            "data:image/png;base64,"
            + gradcam_base64
        )

        return jsonify(result)

    except Exception as error:

        print("Prediction error:", error)

        return jsonify({
            "error": "Prediction failed",
            "details": str(error)
        }), 500

    finally:

        # Delete uploaded image
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        # Delete Grad-CAM image
        if gradcam_path and os.path.exists(gradcam_path):
            os.remove(gradcam_path)


@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "status": "RetinaCare AI ML API running"
    })


if __name__ == "__main__":

    print("Starting RetinaCare AI ML API...")
    print("ML API: http://localhost:8000")

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=False
    )