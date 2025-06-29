# app.py

import os
import io
import base64
import torch
import timm
import numpy as np
import cv2
from PIL import Image
from flask import Flask, request, render_template, send_file, jsonify
from torchvision import transforms
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

# Import the model builder from the MedSAM library
from segment_anything_2_medsam.build_sam import build_medsam2
from setup_models import download_models, MODEL_FILES, CHECKPOINTS_DIR

# --- Configuration ---
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload size

# --- Model Loading ---
# This dictionary will hold our loaded models
MODELS = {}
VIT_MODEL = None
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ViT Configuration
VIT_MODEL_NAME = "vit_base_patch16_224.augreg2_in21k_ft_in1k"
VIT_MODEL_PATH = "checkpoints/vit_model.pth"
VIT_LABEL_MAP = {0: "Normal", 1: "TB Detected"}

# ViT preprocessing transform
vit_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])

def load_vit_model():
    """Loads the ViT model for TB detection."""
    global VIT_MODEL
    print("--- Loading ViT Model ---")
    
    if not os.path.exists(VIT_MODEL_PATH):
        print(f"Warning: ViT model file not found at {VIT_MODEL_PATH}. ViT features will be disabled.")
        return
    
    try:
        model = timm.create_model(VIT_MODEL_NAME, pretrained=False, num_classes=2)
        model.load_state_dict(torch.load(VIT_MODEL_PATH, map_location=DEVICE))
        model.to(DEVICE)
        model.eval()
        VIT_MODEL = model
        print("Successfully loaded ViT model for TB detection.")
    except Exception as e:
        print(f"Failed to load ViT model. Error: {e}")

def load_all_models():
    """Loads all specified models into memory."""
    print("--- Loading Models ---")
    print(f"Using device: {DEVICE}")
    
    # Load MedSAM models
    for model_file in MODEL_FILES:
        model_path = os.path.join(CHECKPOINTS_DIR, model_file)
        if not os.path.exists(model_path):
            print(f"Warning: Model file not found at {model_path}. Skipping.")
            continue
        
        print(f"Loading {model_file}...")
        try:
            model = build_medsam2(model_path, is_lite=True) 
            model.to(DEVICE)
            model.eval()
            MODELS[model_file] = model
            print(f"Successfully loaded {model_file}.")
        except Exception as e:
            print(f"Failed to load {model_file}. Error: {e}")
    
    # Load ViT model
    load_vit_model()
    
    print("--- All available models loaded. ---")

@torch.no_grad()
def analyze_with_vit(image_pil):
    """
    Performs TB detection using ViT model and generates Grad-CAM heatmap.
    Returns prediction results and heatmap overlay image.
    """
    if VIT_MODEL is None:
        raise ValueError("ViT model is not loaded.")
    
    # Preprocess image
    input_tensor = vit_transform(image_pil).unsqueeze(0).to(DEVICE)
    
    # Prediction
    output = VIT_MODEL(input_tensor)
    probs = torch.softmax(output, dim=1)[0]
    pred_class = torch.argmax(probs).item()
    
    # Generate Grad-CAM heatmap
    target_layer = VIT_MODEL.patch_embed.proj
    cam = GradCAM(model=VIT_MODEL, target_layers=[target_layer])
    targets = [ClassifierOutputTarget(pred_class)]
    grayscale_cam = cam(input_tensor=input_tensor, targets=targets)[0]
    
    # Create overlay
    original_image = np.array(image_pil.resize((224, 224))) / 255.0
    cam_image = show_cam_on_image(original_image, grayscale_cam, use_rgb=True)
    cam_image_pil = Image.fromarray(cam_image)
    
    # Prepare results
    results = {
        'prediction': VIT_LABEL_MAP[pred_class],
        'confidence': {
            'tb_detected': float(probs[1]),
            'normal': float(probs[0])
        },
        'predicted_class': pred_class
    }
    
    return results, cam_image_pil

@torch.no_grad()
def segment_image(image_pil, model_name):
    """
    Performs segmentation on a PIL image using the specified model.
    Returns a PIL image with the segmentation mask overlaid.
    """
    if model_name not in MODELS:
        raise ValueError(f"Model '{model_name}' is not loaded.")

    model = MODELS[model_name]
    
    # Pre-processing: convert to RGB, resize, and convert to tensor
    image_np = np.array(image_pil.convert("RGB"))
    H, W, _ = image_np.shape
    
    # The MedSAM model expects a specific input format
    input_image = torch.from_numpy(image_np).permute(2, 0, 1).unsqueeze(0).to(DEVICE)
    # Normalize if needed
    input_image = (input_image - input_image.mean()) / input_image.std()

    # Model inference
    masks, _, _ = model(input_image)
    masks = masks.squeeze(0).cpu().numpy()
    
    # Combine all masks into a single boolean mask for visualization
    final_mask = np.any(masks > 0, axis=0)
    
    # Create overlay
    overlay_image = image_pil.copy()
    overlay_color = np.array([0, 255, 0, 150]) # Green with transparency
    
    # Apply overlay where the mask is true
    overlay_rgba = np.zeros((H, W, 4), dtype=np.uint8)
    overlay_rgba[final_mask] = overlay_color
    
    mask_pil = Image.fromarray(overlay_rgba, 'RGBA')
    overlay_image.paste(mask_pil, (0, 0), mask_pil)
    
    return overlay_image

def pil_to_base64(pil_img):
    """Converts a PIL image to a Base64 string."""
    img_buffer = io.BytesIO()
    pil_img.save(img_buffer, format="PNG")
    return base64.b64encode(img_buffer.getvalue()).decode('utf-8')

# --- Flask Routes ---

@app.route('/', methods=['GET', 'POST'])
def web_interface():
    """Handler for the main web page."""
    available_models = MODEL_FILES + (['ViT_TB_Detection'] if VIT_MODEL is not None else [])
    
    if request.method == 'POST':
        if 'file' not in request.files:
            return render_template('index.html', models=available_models, error="No file part in request.")
        
        file = request.files['file']
        model_name = request.form.get('model')

        if file.filename == '':
            return render_template('index.html', models=available_models, error="No file selected.")

        if file and model_name:
            try:
                original_img = Image.open(file.stream)
                
                if model_name == 'ViT_TB_Detection':
                    # ViT analysis
                    vit_results, result_img = analyze_with_vit(original_img)
                    
                    b64_original = pil_to_base64(original_img.convert("RGB"))
                    b64_result = pil_to_base64(result_img)
                    
                    return render_template(
                        'index.html',
                        models=available_models,
                        selected_model=model_name,
                        original_image=b64_original,
                        result_image=b64_result,
                        vit_results=vit_results
                    )
                else:
                    # MedSAM segmentation
                    result_img = segment_image(original_img, model_name)
                    
                    b64_original = pil_to_base64(original_img.convert("RGB"))
                    b64_result = pil_to_base64(result_img)

                    return render_template(
                        'index.html',
                        models=available_models,
                        selected_model=model_name,
                        original_image=b64_original,
                        result_image=b64_result
                    )
            except Exception as e:
                return render_template('index.html', models=available_models, error=f"An error occurred: {e}")

    default_model = available_models[0] if available_models else None
    return render_template('index.html', models=available_models, selected_model=default_model)

@app.route('/analyze', methods=['POST'])
def api_analyze():
    """API endpoint for image analysis (segmentation or classification)."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request."}), 400
    
    file = request.files['file']
    available_models = list(MODELS.keys()) + (['ViT_TB_Detection'] if VIT_MODEL is not None else [])
    model_name = request.form.get('model', available_models[-1] if available_models else None)

    if file.filename == '':
        return jsonify({"error": "No file selected."}), 400

    if model_name not in available_models:
        return jsonify({"error": f"Model '{model_name}' not found or loaded."}), 404
        
    if file:
        try:
            original_img = Image.open(file.stream)
            
            if model_name == 'ViT_TB_Detection':
                # ViT analysis - return JSON with results
                vit_results, result_img = analyze_with_vit(original_img)
                
                # Convert result image to base64 for JSON response
                b64_result = pil_to_base64(result_img)
                
                return jsonify({
                    "prediction": vit_results['prediction'],
                    "confidence": vit_results['confidence'],
                    "heatmap_image": b64_result,
                    "model_used": model_name
                })
            else:
                # MedSAM segmentation - return image file
                result_img = segment_image(original_img, model_name)
                
                img_buffer = io.BytesIO()
                result_img.save(img_buffer, 'PNG')
                img_buffer.seek(0)
                
                return send_file(img_buffer, mimetype='image/png')
            
        except Exception as e:
            return jsonify({"error": f"An error occurred during processing: {e}"}), 500

    return jsonify({"error": "Invalid request."}), 400

@app.route('/vit_analyze', methods=['POST'])
def api_vit_analyze():
    """Dedicated API endpoint for ViT TB detection."""
    if VIT_MODEL is None:
        return jsonify({"error": "ViT model is not loaded."}), 503
        
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request."}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected."}), 400
        
    try:
        original_img = Image.open(file.stream)
        vit_results, heatmap_img = analyze_with_vit(original_img)
        
        # Convert heatmap to base64
        b64_heatmap = pil_to_base64(heatmap_img)
        
        return jsonify({
            "prediction": vit_results['prediction'],
            "confidence": vit_results['confidence'],
            "heatmap_image": b64_heatmap,
            "success": True
        })
        
    except Exception as e:
        return jsonify({"error": f"An error occurred during ViT analysis: {e}"}), 500

@app.route('/models', methods=['GET'])
def list_models():
    """API endpoint to list all available models."""
    available_models = {
        "segmentation_models": list(MODELS.keys()),
        "classification_models": ["ViT_TB_Detection"] if VIT_MODEL is not None else [],
        "device": str(DEVICE)
    }
    return jsonify(available_models)

if __name__ == '__main__':
    # Ensure results directory exists
    os.makedirs("results", exist_ok=True)
    
    # First, ensure models are downloaded
    download_models()
    # Then, load models into memory
    load_all_models()
    # Start the Flask server
    app.run(host='0.0.0.0', port=5001, debug=True)