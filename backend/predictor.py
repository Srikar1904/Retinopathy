import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.preprocessing import image


# ==============================
# RetinaCare AI Model
# ==============================

MODEL_PATH = r"C:\Users\srinidhi\Retinopathy\ml\models\retinacare_final.keras"

CLASS_NAMES = [
    "No DR",
    "Mild",
    "Moderate",
    "Severe",
    "Proliferative"
]


print("Loading RetinaCare AI model...")

model = tf.keras.models.load_model(MODEL_PATH)

print("RetinaCare AI model loaded successfully!")


# ==============================
# Prediction Function
# ==============================

def predict_retinopathy(image_path):

    # Load image
    img = image.load_img(
        image_path,
        target_size=(224, 224)
    )

    # Convert image to NumPy array
    img_array = image.img_to_array(img)

    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)

    # ResNet-50 preprocessing
    img_array = preprocess_input(img_array)

    # Make prediction
    predictions = model.predict(
        img_array,
        verbose=0
    )[0]

    # Get predicted class
    predicted_index = int(np.argmax(predictions))

    predicted_class = CLASS_NAMES[predicted_index]

    # Confidence
    confidence = float(
        predictions[predicted_index] * 100
    )

    # Probabilities for all stages
    probabilities = {
        CLASS_NAMES[i]: round(
            float(predictions[i] * 100),
            2
        )
        for i in range(len(CLASS_NAMES))
    }

    return {
        "predicted_stage": predicted_class,
        "confidence": round(confidence, 2),
        "probabilities": probabilities
    }

# ==============================
# Grad-CAM Explanation
# ==============================

def generate_gradcam(image_path, output_path):

    # Load original image
    original = cv2.imread(image_path)

    if original is None:
        raise ValueError("Unable to read image")

    original = cv2.cvtColor(original, cv2.COLOR_BGR2RGB)

    # Prepare image for ResNet-50
    img = image.load_img(
        image_path,
        target_size=(224, 224)
    )

    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    # Get nested ResNet-50 model
    resnet_model = model.get_layer("resnet50")

    # Last convolutional layer
    gradcam_layer = resnet_model.get_layer(
        "conv5_block3_3_conv"
    )

    # Model for Grad-CAM
    grad_model = tf.keras.models.Model(
        inputs=resnet_model.input,
        outputs=[
            gradcam_layer.output,
            resnet_model.output
        ]
    )

    # Forward pass through ResNet
    with tf.GradientTape() as tape:

        conv_outputs, resnet_outputs = grad_model(
            img_array,
            training=False
        )

        # Pass ResNet output through the classifier
        x = model.get_layer(
            "global_average_pooling2d"
        )(resnet_outputs)

        x = model.get_layer("dense")(x)

        x = model.get_layer("dropout")(
            x,
            training=False
        )

        predictions = model.get_layer("dense_1")(x)

        predicted_index = tf.argmax(
            predictions[0]
        )

        class_score = predictions[:, predicted_index]

    # Gradients
    gradients = tape.gradient(
        class_score,
        conv_outputs
    )

    # Global average pooling of gradients
    pooled_gradients = tf.reduce_mean(
        gradients,
        axis=(1, 2)
    )

    # Remove batch dimension
    conv_outputs = conv_outputs[0]
    pooled_gradients = pooled_gradients[0]

    # Weight feature maps
    heatmap = tf.reduce_sum(
        conv_outputs * pooled_gradients,
        axis=-1
    )

    # ReLU
    heatmap = tf.maximum(
        heatmap,
        0
    )

    # Normalize
    max_value = tf.reduce_max(heatmap)

    if float(max_value) > 0:
        heatmap /= max_value

    heatmap = heatmap.numpy()

    # Resize heatmap to original image size
    heatmap = cv2.resize(
        heatmap,
        (
            original.shape[1],
            original.shape[0]
        )
    )

    # Convert heatmap to 0-255
    heatmap_uint8 = np.uint8(
        255 * heatmap
    )

    # Apply OpenCV color map
    colored_heatmap = cv2.applyColorMap(
        heatmap_uint8,
        cv2.COLORMAP_JET
    )

    colored_heatmap = cv2.cvtColor(
        colored_heatmap,
        cv2.COLOR_BGR2RGB
    )

    # Create overlay
    overlay = cv2.addWeighted(
        original,
        0.6,
        colored_heatmap,
        0.4,
        0
    )

    # Save result
    overlay_bgr = cv2.cvtColor(
        overlay,
        cv2.COLOR_RGB2BGR
    )

    cv2.imwrite(
        output_path,
        overlay_bgr
    )

    return output_path
# ==============================
# Test
# ==============================

if __name__ == "__main__":

    print()
    print("RetinaCare AI predictor is ready.")
    print("Model:", MODEL_PATH)
    print("Classes:", CLASS_NAMES)