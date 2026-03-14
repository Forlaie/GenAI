import os
import json
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()


def generate(image_name):
    name = image_name.split(".")[0]

    try:
        os.mkdir(name)
    except FileExistsError:
        os.rmdir(name)
        raise FileExistsError

    client = InferenceClient(
        provider="hf-inference",
        api_key=os.environ["HF_TOKEN"],
    )
    output = client.image_segmentation(image_name, model="jonathandinu/face-parsing")

    text_output = []
    for segment in output:
        text_output.append({"label": segment["label"], "score": segment["score"]})

    with open(f"{name}/output.txt", "w") as file:
        json.dump(text_output, file, indent=2)

    for i, segment in enumerate(output):
        print(f"Segment {i+1}:")
        print(f"  Label: {segment['label']}")
        print(f"  Score: {segment['score']}")

        mask_image = segment["mask"]

        mask_image.save(f"{name}/mask_{i}_{segment['label']}.png")
        print(f"  Mask saved as: mask_{i}_{segment['label']}.png")


generate("test1.png")
