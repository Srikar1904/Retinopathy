import pandas as pd
from pathlib import Path

# ==============================
# RetinaCare AI
# APTOS Dataset Inspection
# ==============================

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset" / "aptos"

CSV_PATH = DATASET_DIR / "train.csv"
IMAGE_DIR = DATASET_DIR / "train_images"

print("=" * 60)
print("RetinaCare AI - APTOS Dataset Inspection")
print("=" * 60)

# Load CSV
df = pd.read_csv(CSV_PATH)

print("\n📄 Dataset information")
print("-" * 60)

print("CSV file:", CSV_PATH)
print("Images directory:", IMAGE_DIR)

print("\nColumns:")
print(df.columns.tolist())

print("\nNumber of records:", len(df))

# Display first 5 rows
print("\nFirst 5 records:")
print(df.head())

# Check labels
print("\n📊 DR Class Distribution")
print("-" * 60)

class_counts = df["diagnosis"].value_counts().sort_index()

class_names = {
    0: "No DR",
    1: "Mild",
    2: "Moderate",
    3: "Severe",
    4: "Proliferative DR"
}

for label, count in class_counts.items():
    name = class_names.get(label, "Unknown")
    percentage = count / len(df) * 100

    print(
        f"Stage {label} ({name}): "
        f"{count} images ({percentage:.2f}%)"
    )

# Check missing labels
print("\n🔍 Missing values")
print("-" * 60)
print(df.isnull().sum())

# Check image files
image_files = list(IMAGE_DIR.glob("*"))

print("\n🖼️ Image verification")
print("-" * 60)

print("Images found:", len(image_files))
print("CSV records:", len(df))

# Check whether CSV images exist
missing_images = []

for image_id in df["id_code"]:
    image_path = IMAGE_DIR / f"{image_id}.png"

    if not image_path.exists():
        missing_images.append(image_id)

print("Missing images:", len(missing_images))

if missing_images:
    print("\n⚠️ First missing images:")
    print(missing_images[:10])
else:
    print("✅ Every CSV record has a corresponding image.")

print("\n" + "=" * 60)
print("Dataset inspection complete!")
print("=" * 60)