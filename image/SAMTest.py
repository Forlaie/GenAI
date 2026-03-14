import os
import json
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

client = InferenceClient(
    provider="hf-inference",
    api_key=os.environ["HF_TOKEN"],
)
output = client.image_segmentation("penguin.png", model="jonathandinu/face-parsing")


text_output = []
for segment in output:
    text_output.append({"label": segment["label"], "score": segment["score"]})

with open("output.txt", "w") as file:
    json.dump(text_output, file, indent=2)

for i, segment in enumerate(output):
    print(f"Segment {i+1}:")
    print(f"  Label: {segment['label']}")
    print(f"  Score: {segment['score']}")

    mask_image = segment["mask"]

    mask_image.save(f"mask_{i}_{segment['label']}.png")
    print(f"  Mask saved as: mask_{i}_{segment['label']}.png")
