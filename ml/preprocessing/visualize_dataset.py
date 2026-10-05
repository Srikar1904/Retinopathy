import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
from PIL import Image

# ==========================================
# RetinaCare AI
# APTOS Dataset Visual Inspection
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset" / "aptos"

CSV_PATH = DATASET_DIR / "train.csv"
IMAGE_DIR = DATASET_DIR / "train_images"

df = pd.read_csv(CSV_PATH)

class_names = {
    0: "Stage 0 - No DR",
    1: "Stage 1 - Mild",
    2: "Stage 2 - Moderate",
    3: "Stage 3 - Severe",
    4: "Stage 4 - Proliferative"
}

fig, axes = plt.subplots(5, 3, figsize=(12, 18))

for stage in range(5):

    stage_df = df[df["diagnosis"] == stage].sample(
        n=3,
        random_state=42
    )

    for col, (_, row) in enumerate(stage_df.iterrows()):

        image_path = IMAGE_DIR / f"{row['id_code']}.png"

        image = Image.open(image_path)

        axes[stage, col].imshow(image)
        axes[stage, col].set_title(
            class_names[stage],
            fontsize=11,
            fontweight="bold"
        )
        axes[stage, col].axis("off")

plt.suptitle(
    "RetinaCare AI — APTOS Retinal Dataset",
    fontsize=16,
    fontweight="bold"
)

plt.tight_layout()

OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

output_path = OUTPUT_DIR / "dataset_samples.png"

plt.savefig(
    output_path,
    dpi=150,
    bbox_inches="tight"
)

plt.show()

print("=" * 60)
print("Visualization complete!")
print("=" * 60)
print(f"Saved to: {output_path}")