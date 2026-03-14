#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting installation of project dependencies..."

# 1. Install base ML and Imaging libraries
pip install torch torchvision opencv-python pillow

# 2. Install Segment Anything (SAM) from GitHub
pip install git+https://github.com/facebookresearch/segment-anything.git

# 3. Install remaining utility and runtime libraries
pip install opencv-python pycocotools matplotlib onnxruntime onnx

echo "----------------------------------------"
echo "Installation complete!"
echo "Verifying installations..."
pip list | grep -E "torch|segment-anything|opencv|onnx"