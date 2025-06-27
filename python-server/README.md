## Create and activate conda environment
conda create -n medsam2 python=3.9 -y
conda activate medsam2

## Install PyTorch with CUDA
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia

## Install other dependencies
pip install flask pillow numpy opencv-python huggingface-hub
pip install git+https://github.com/facebookresearch/segment-anything.git

## Download models
python download_models.py

## Verify setup
python verify_setup.py

## Run server
```
python med-server.py
```

# API USAGE
```
curl -X POST \
  -F "image=@path/to/your/image.jpg" \
  -F "model_type=general" \
  http://localhost:5000/analyze
```

# Check Available Models
```
curl http://localhost:5000/models
```
