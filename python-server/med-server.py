from flask import Flask, request, jsonify, render_template_string
from werkzeug.utils import secure_filename
import os
import torch
import numpy as np
from PIL import Image
import io
import base64
import json
from datetime import datetime
import traceback

# Import MedSAM2 dependencies
try:
    import torch
    import torch.nn as nn
    from torchvision import transforms
    from segment_anything import sam_model_registry, SamPredictor
    print("✅ Core dependencies loaded successfully")
    SAM_AVAILABLE = True
except ImportError as e:
    print(f"❌ Error importing dependencies: {e}")
    print("Please install: pip install torch torchvision segment-anything")
    SAM_AVAILABLE = False

app = Flask(__name__)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['RESULTS_FOLDER'] = 'results'

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULTS_FOLDER'], exist_ok=True)
os.makedirs('checkpoints', exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'dcm'}

# Model configurations
MODEL_CONFIGS = {
    'general': {
        'file': 'MedSAM2_latest.pt',
        'description': 'General medical image segmentation'
    },
    'heart_us': {
        'file': 'MedSAM2_US_Heart.pt',
        'description': 'Ultrasound heart segmentation'
    },
    'liver_mri': {
        'file': 'MedSAM2_MRI_LiverLesion.pt',
        'description': 'MRI liver lesion detection'
    },
    'ct_lesion': {
        'file': 'MedSAM2_CTLesion.pt',
        'description': 'CT lesion detection'
    },
    'foundation': {
        'file': 'MedSAM2_2411.pt',
        'description': 'Foundation model for medical imaging'
    }
}

# Global model storage
loaded_models = {}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_model(model_type):
    """Load a specific MedSAM2 model"""
    if model_type not in MODEL_CONFIGS:
        raise ValueError(f"Unknown model type: {model_type}")
    
    if model_type in loaded_models:
        return loaded_models[model_type]
    
    model_path = os.path.join('checkpoints', MODEL_CONFIGS[model_type]['file'])
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}. Please ensure you've downloaded the models using the provided script.")
    
    if not SAM_AVAILABLE:
        raise ImportError("Required dependencies not installed. Please run: pip install torch torchvision segment-anything")
    
    try:
        # Load the MedSAM2 model checkpoint
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Loading {model_type} model on {device}...")
        
        # Load model checkpoint
        checkpoint = torch.load(model_path, map_location=device)
        
        # Initialize SAM predictor with MedSAM2 weights
        # Note: MedSAM2 is based on SAM architecture
        sam_model = sam_model_registry["vit_b"](checkpoint=None)  # We'll load custom weights
        
        # Load the MedSAM2 weights into the SAM model
        if 'model' in checkpoint:
            sam_model.load_state_dict(checkpoint['model'], strict=False)
        else:
            sam_model.load_state_dict(checkpoint, strict=False)
        
        sam_model.to(device)
        sam_model.eval()
        
        # Create predictor
        predictor = SamPredictor(sam_model)
        
        loaded_models[model_type] = {
            'predictor': predictor,
            'device': device,
            'model': sam_model
        }
        
        print(f"✅ Successfully loaded {model_type} model")
        return loaded_models[model_type]
        
    except Exception as e:
        error_msg = f"Failed to load model {model_type}: {str(e)}"
        print(f"❌ {error_msg}")
        raise RuntimeError(error_msg)

def preprocess_image(image_path):
    """Preprocess image for MedSAM2"""
    try:
        # Load image
        image = Image.open(image_path)
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image)
        
        return image_array, image
    except Exception as e:
        raise RuntimeError(f"Failed to preprocess image: {str(e)}")

def perform_analysis(image_array, model_type, prompt_points=None, prompt_boxes=None):
    """Perform medical image analysis using MedSAM2"""
    try:
        # Load the appropriate model
        model_data = load_model(model_type)
        predictor = model_data['predictor']
        device = model_data['device']
        
        # Set the image for prediction
        predictor.set_image(image_array)
        
        # Default to center point if no prompts provided
        if prompt_points is None and prompt_boxes is None:
            h, w = image_array.shape[:2]
            # Use center point as default prompt
            prompt_points = np.array([[w//2, h//2]])
            point_labels = np.array([1])  # Foreground point
        else:
            point_labels = np.ones(len(prompt_points)) if prompt_points is not None else None
        
        # Perform prediction
        masks, scores, logits = predictor.predict(
            point_coords=prompt_points,
            point_labels=point_labels,
            box=prompt_boxes,
            multimask_output=True
        )
        
        # Convert to numpy if needed
        if torch.is_tensor(masks):
            masks = masks.cpu().numpy()
        if torch.is_tensor(scores):
            scores = scores.cpu().numpy()
        if torch.is_tensor(logits):
            logits = logits.cpu().numpy()
        
        return {
            'masks': masks,
            'scores': scores,
            'logits': logits
        }
        
    except Exception as e:
        error_msg = f"Analysis failed: {str(e)}"
        print(f"❌ {error_msg}")
        raise RuntimeError(error_msg)

def mask_to_base64(mask):
    """Convert mask to base64 string for JSON response"""
    # Convert mask to PIL Image
    mask_image = Image.fromarray((mask * 255).astype(np.uint8))
    
    # Convert to base64
    buffer = io.BytesIO()
    mask_image.save(buffer, format='PNG')
    mask_b64 = base64.b64encode(buffer.getvalue()).decode()
    
    return mask_b64

# HTML template for the web interface
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>MedSAM2 Medical Image Analysis</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .container { background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .upload-area { border: 2px dashed #ccc; padding: 40px; text-align: center; margin: 20px 0; }
        .model-select { margin: 20px 0; }
        select, input[type="file"], button { padding: 10px; margin: 5px; font-size: 16px; }
        button { background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .results { margin-top: 20px; }
        .error { color: red; background: #ffe6e6; padding: 10px; border-radius: 5px; }
        .success { color: green; background: #e6ffe6; padding: 10px; border-radius: 5px; }
        .image-container { display: flex; gap: 20px; flex-wrap: wrap; }
        .image-box { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
        img { max-width: 400px; height: auto; }
    </style>
</head>
<body>
    <h1>🏥 MedSAM2 Medical Image Analysis</h1>
    
    <div class="container">
        <h2>Upload Medical Image</h2>
        <form id="uploadForm" enctype="multipart/form-data">
            <div class="upload-area">
                <input type="file" id="imageFile" name="image" accept=".png,.jpg,.jpeg,.gif,.bmp,.tiff,.dcm" required>
                <p>Choose a medical image file (PNG, JPG, JPEG, GIF, BMP, TIFF, DCM)</p>
            </div>
            
            <div class="model-select">
                <label for="modelType">Select Analysis Model:</label>
                <select id="modelType" name="model_type" required>
                    <option value="">-- Select Model --</option>
                    <option value="general">General Medical Segmentation</option>
                    <option value="heart_us">Ultrasound Heart Segmentation</option>
                    <option value="liver_mri">MRI Liver Lesion Detection</option>
                    <option value="ct_lesion">CT Lesion Detection</option>
                    <option value="foundation">Foundation Model</option>
                </select>
            </div>
            
            <button type="submit">🔍 Analyze Image</button>
        </form>
    </div>
    
    <div id="results" class="results"></div>
    
    <script>
        document.getElementById('uploadForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            const imageFile = document.getElementById('imageFile').files[0];
            const modelType = document.getElementById('modelType').value;
            
            if (!imageFile || !modelType) {
                alert('Please select both an image and a model type');
                return;
            }
            
            formData.append('image', imageFile);
            formData.append('model_type', modelType);
            
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<div class="container">🔄 Analyzing image...</div>';
            
            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    displayResults(result);
                } else {
                    resultsDiv.innerHTML = `<div class="container"><div class="error">Error: ${result.error}</div></div>`;
                }
            } catch (error) {
                resultsDiv.innerHTML = `<div class="container"><div class="error">Network error: ${error.message}</div></div>`;
            }
        });
        
        function displayResults(result) {
            const resultsDiv = document.getElementById('results');
            let html = '<div class="container"><h2>📊 Analysis Results</h2>';
            
            html += `<div class="success">✅ Analysis completed successfully!</div>`;
            html += `<p><strong>Model Used:</strong> ${result.model_description}</p>`;
            html += `<p><strong>Processing Time:</strong> ${result.processing_time}</p>`;
            html += `<p><strong>Number of Segments Found:</strong> ${result.num_segments}</p>`;
            
            if (result.masks && result.masks.length > 0) {
                html += '<div class="image-container">';
                result.masks.forEach((mask, index) => {
                    html += `
                        <div class="image-box">
                            <h4>Segment ${index + 1} (Score: ${result.scores[index].toFixed(3)})</h4>
                            <img src="data:image/png;base64,${mask}" alt="Segmentation Mask ${index + 1}">
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            html += '</div>';
            resultsDiv.innerHTML = html;
        }
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    """Serve the main web interface"""
    return render_template_string(HTML_TEMPLATE)

@app.route('/models', methods=['GET'])
def get_models():
    """Get available models"""
    return jsonify({
        'models': MODEL_CONFIGS,
        'loaded_models': list(loaded_models.keys())
    })

@app.route('/analyze', methods=['POST'])
def analyze_image():
    """Main endpoint for image analysis"""
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        model_type = request.form.get('model_type', 'general')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        if model_type not in MODEL_CONFIGS:
            return jsonify({'error': f'Invalid model type: {model_type}'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        start_time = datetime.now()
        
        # Preprocess image
        image_array, original_image = preprocess_image(filepath)
        
        # Get prompt points/boxes from request if provided
        prompt_points = request.form.get('prompt_points')
        prompt_boxes = request.form.get('prompt_boxes')
        
        if prompt_points:
            prompt_points = json.loads(prompt_points)
        if prompt_boxes:
            prompt_boxes = json.loads(prompt_boxes)
        
        # Perform analysis
        analysis_result = perform_analysis(image_array, model_type, prompt_points, prompt_boxes)
        
        end_time = datetime.now()
        processing_time = str(end_time - start_time)
        
        # Convert masks to base64 for JSON response
        masks_b64 = [mask_to_base64(mask) for mask in analysis_result['masks']]
        
        # Prepare response
        response = {
            'success': True,
            'filename': filename,
            'model_type': model_type,
            'model_description': MODEL_CONFIGS[model_type]['description'],
            'processing_time': processing_time,
            'num_segments': len(analysis_result['masks']),
            'masks': masks_b64,
            'scores': analysis_result['scores'].tolist() if hasattr(analysis_result['scores'], 'tolist') else analysis_result['scores'],
            'timestamp': datetime.now().isoformat()
        }
        
        # Clean up uploaded file
        os.remove(filepath)
        
        return jsonify(response)
        
    except Exception as e:
        # Log the full error for debugging
        error_details = traceback.format_exc()
        print(f"Analysis error: {error_details}")
        
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'models_available': list(MODEL_CONFIGS.keys()),
        'models_loaded': list(loaded_models.keys())
    })

if __name__ == '__main__':
    print("🏥 Starting MedSAM2 Medical Image Analysis Server...")
    print(f"Available models: {list(MODEL_CONFIGS.keys())}")
    print("Server will be available at: http://localhost:5000")
    
    # Optionally pre-load a default model
    if SAM_AVAILABLE:
        try:
            print("Pre-loading general model...")
            load_model('general')
            print("✅ General model loaded successfully")
        except Exception as e:
            print(f"⚠️  Warning: Could not pre-load general model: {e}")
    else:
        print("⚠️  SAM dependencies not available. Please install required packages.")
        print("Run: pip install torch torchvision segment-anything")
    
    app.run(debug=True, host='0.0.0.0', port=5100)