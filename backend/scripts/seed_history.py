"""Seed the database with demo analyses and local licensed food photos."""

import argparse
from datetime import UTC, datetime, timedelta
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps
from sqlalchemy import select

from app.core.config import settings
from app.db.models import Analysis
from app.db.repository import create_analysis
from app.db.session import SessionLocal

SEED_PREFIX = "seed_"
SOURCE_PHOTOS_DIR = "source_photos"
PHOTO_SIZE = (640, 480)

PALETTE = [
    (192, 57, 43),
    (211, 84, 0),
    (39, 174, 96),
    (41, 128, 185),
    (142, 68, 173),
    (44, 62, 80),
    (230, 126, 34),
    (127, 140, 141),
    (22, 160, 133),
    (155, 89, 182),
    (243, 156, 18),
    (52, 73, 94),
]

DISHES = [
    {
        "label": "Margherita Pizza",
        "confidence": 0.97,
        "alternatives": ["Marinara Pizza", "Focaccia"],
        "ingredients": [
            "pizza dough",
            "San Marzano tomatoes",
            "fresh mozzarella",
            "basil",
            "olive oil",
        ],
        "steps": [
            "Stretch the dough on a floured surface",
            "Spread crushed tomatoes and add mozzarella",
            "Bake at 250C for 8-10 minutes",
            "Finish with basil and olive oil",
        ],
        "photo": {
            "file": "01_margherita-pizza.jpg",
            "title": "Margherita pizza on plate",
            "artist": "Shisma",
            "license": "CC BY 4.0",
            "page": "https://commons.wikimedia.org/wiki/File:Margherita_pizza_on_plate.jpg",
        },
    },
    {
        "label": "Sushi Platter",
        "confidence": 0.94,
        "alternatives": ["Sashimi Platter", "Onigiri"],
        "ingredients": [
            "sushi rice",
            "nori",
            "salmon",
            "tuna",
            "avocado",
            "wasabi",
        ],
        "steps": [
            "Season the rice with vinegar and sugar",
            "Slice the fish into thin pieces",
            "Shape the rice and wrap with nori",
            "Arrange on a platter with wasabi",
        ],
        "photo": {
            "file": "02_sushi-platter.jpg",
            "title": "Salmon Sushi and Sashimi Platter - W Sushi",
            "artist": "Angelicadlr",
            "license": "CC BY-SA 3.0",
            "page": "https://commons.wikimedia.org/wiki/File:Salmon_Sushi_and_Sashimi_Platter_-_W_Sushi.jpg",
        },
    },
    {
        "label": "Cheeseburger",
        "confidence": 0.92,
        "alternatives": ["Bacon Burger", "Veggie Burger"],
        "ingredients": [
            "brioche bun",
            "beef patty",
            "cheddar",
            "pickles",
            "lettuce",
            "tomato",
            "burger sauce",
        ],
        "steps": [
            "Season and grill the patty 3 minutes per side",
            "Melt cheddar on the patty",
            "Toast the bun and spread sauce",
            "Layer lettuce, tomato, pickles and the patty",
        ],
        "photo": {
            "file": "03_cheeseburger.jpg",
            "title": "Cheeseburger 2",
            "artist": "Kurtkaiser",
            "license": "CC0",
            "page": "https://commons.wikimedia.org/wiki/File:Cheeseburger_2.jpg",
        },
    },
    {
        "label": "Tonkotsu Ramen",
        "confidence": 0.89,
        "alternatives": ["Shoyu Ramen", "Miso Ramen"],
        "ingredients": [
            "ramen noodles",
            "pork bones broth",
            "chashu pork",
            "soft-boiled egg",
            "scallions",
            "nori",
        ],
        "steps": [
            "Simmer pork bones for 12 hours",
            "Cook the noodles until just tender",
            "Arrange chashu, egg and scallions in the bowl",
            "Pour the hot broth over the noodles",
        ],
        "photo": {
            "file": "04_tonkotsu-ramen.jpg",
            "title": "Char Siu Tonkotsu Ramen - Shogun Ramen 2023-10-11",
            "artist": "Andy Li",
            "license": "CC0",
            "page": "https://commons.wikimedia.org/wiki/File:Char_Siu_Tonkotsu_Ramen_-_Shogun_Ramen_2023-10-11.jpg",
        },
    },
    {
        "label": "Beef Tacos",
        "confidence": 0.86,
        "alternatives": ["Chicken Tacos", "Quesadilla"],
        "ingredients": [
            "corn tortillas",
            "ground beef",
            "onion",
            "cilantro",
            "lime",
            "salsa",
        ],
        "steps": [
            "Brown the beef with taco spices",
            "Warm the tortillas on a dry pan",
            "Fill with beef, onion and cilantro",
            "Serve with lime and salsa",
        ],
        "photo": {
            "file": "05_beef-tacos.jpg",
            "title": "001 Tacos de carnitas, carne asada y al pastor",
            "artist": "Larry Miller",
            "license": "CC BY-SA 2.0",
            "page": "https://commons.wikimedia.org/wiki/File:001_Tacos_de_carnitas,_carne_asada_y_al_pastor.jpg",
        },
    },
    {
        "label": "Seafood Paella",
        "confidence": 0.83,
        "alternatives": ["Chicken Paella", "Risotto"],
        "ingredients": [
            "bomba rice",
            "shrimp",
            "mussels",
            "saffron",
            "peas",
            "fish broth",
        ],
        "steps": [
            "Sauté the seafood and set aside",
            "Toast the rice with saffron and broth",
            "Simmer without stirring for 18 minutes",
            "Return the seafood and rest for 5 minutes",
        ],
        "photo": {
            "file": "06_seafood-paella.jpg",
            "title": "Seafood paella, Brisbane, 2023",
            "artist": "Kgbo",
            "license": "CC BY-SA 4.0",
            "page": "https://commons.wikimedia.org/wiki/File:Seafood_paella,_Brisbane,_2023.jpg",
        },
    },
    {
        "label": "Pad Thai",
        "confidence": 0.79,
        "alternatives": ["Pad See Ew", "Drunken Noodles"],
        "ingredients": [
            "rice noodles",
            "tamarind sauce",
            "fish sauce",
            "egg",
            "shrimp",
            "peanuts",
            "lime",
        ],
        "steps": [
            "Soak the noodles until pliable",
            "Stir-fry shrimp and egg in a hot wok",
            "Add noodles, tamarind and fish sauce",
            "Top with peanuts and a lime wedge",
        ],
        "photo": {
            "file": "07_pad-thai.jpg",
            "title": "Pad Thai Noodles - Little Thai, Brighton 2024-03-21",
            "artist": "Andy Li",
            "license": "CC0",
            "page": "https://commons.wikimedia.org/wiki/File:Pad_Thai_Noodles_-_Little_Thai,_Brighton_2024-03-21.jpg",
        },
    },
    {
        "label": "Beef Lasagna",
        "confidence": 0.75,
        "alternatives": ["Vegetable Lasagna", "Cannelloni"],
        "ingredients": [
            "lasagna sheets",
            "beef ragù",
            "béchamel sauce",
            "parmesan",
            "mozzarella",
        ],
        "steps": [
            "Simmer the ragù for an hour",
            "Layer pasta, ragù and béchamel",
            "Top with parmesan and mozzarella",
            "Bake at 190C for 35 minutes",
        ],
        "photo": {
            "file": "08_beef-lasagna.jpg",
            "title": "Meaty Lasagna 8of8 (8736299782)",
            "artist": "Breville USA",
            "license": "CC BY 2.0",
            "page": "https://commons.wikimedia.org/wiki/File:Meaty_Lasagna_8of8_(8736299782).jpg",
        },
    },
    {
        "label": "Mushroom Omelette",
        "confidence": 0.68,
        "alternatives": ["Cheese Omelette", "Scrambled Eggs"],
        "ingredients": ["eggs", "mushrooms", "butter", "chives", "salt"],
        "steps": [
            "Sauté the mushrooms in butter",
            "Whisk the eggs with salt",
            "Cook the eggs and fold over the mushrooms",
            "Garnish with chives",
        ],
        "photo": {
            "file": "09_mushroom-omelette.jpg",
            "title": "Mushroom Omelette - Breakfast At Tiffany's Brighton",
            "artist": "Andy Li",
            "license": "CC0",
            "page": "https://commons.wikimedia.org/wiki/File:Mushroom_Omelette_-_Breakfast_At_Tiffany%27s_Brighton.jpg",
        },
    },
    {
        "label": "Chicken Tikka Masala",
        "confidence": 0.58,
        "alternatives": ["Butter Chicken", "Chicken Korma"],
        "ingredients": [],
        "steps": [],
        "photo": {
            "file": "10_chicken-tikka-masala.jpg",
            "title": "Chicken Tikka Masala - Mohammed - Spice Of Life",
            "artist": "Andy Li",
            "license": "CC0",
            "page": "https://commons.wikimedia.org/wiki/File:Chicken_Tikka_Masala_-_Mohammed_-_Spice_Of_Life.jpg",
        },
    },
    {
        "label": "Tiramisu",
        "confidence": 0.46,
        "alternatives": ["Panna Cotta", "Cheesecake"],
        "ingredients": [],
        "steps": [],
        "photo": {
            "file": "11_tiramisu.jpg",
            "title": "Tiramisu at Italian restaurant in Japan",
            "artist": "Syced",
            "license": "CC0",
            "page": "https://commons.wikimedia.org/wiki/File:Tiramisu_at_Italian_restaurant_in_Japan.jpg",
        },
    },
    {
        "label": "Poke Bowl",
        "confidence": 0.35,
        "alternatives": ["Buddha Bowl", "Sashimi Salad"],
        "ingredients": [],
        "steps": [],
        "photo": {
            "file": "12_poke-bowl.jpg",
            "title": "Salmon & Tuna Poke Bowl (M) with Spicy Mayo sauce - Kitokito",
            "artist": "Andy Li",
            "license": "CC0",
            "page": "https://commons.wikimedia.org/wiki/File:Salmon_%26_Tuna_Poke_Bowl_(M)_with_Spicy_Mayo_sauce_-_Kitokito_2025-04-25.jpg",
        },
    },
]

UNCERTAIN_BELOW = 0.6


def _slug(label: str) -> str:
    return label.lower().replace(" ", "-")


def _generate_image(path: Path, label: str, color: tuple[int, int, int]) -> None:
    image = Image.new("RGB", PHOTO_SIZE, color)
    draw = ImageDraw.Draw(image)

    try:
        font = ImageFont.load_default(size=48)
    except TypeError:
        font = ImageFont.load_default()

    text = label.title()
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    x = (image.width - (right - left)) / 2
    y = (image.height - (bottom - top)) / 2
    draw.text((x, y), text, fill="white", font=font)

    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="JPEG", quality=88)


def _prepare_image(source: Path, path: Path) -> None:
    with Image.open(source) as image:
        photo = ImageOps.exif_transpose(image).convert("RGB")
        photo = ImageOps.fit(photo, PHOTO_SIZE, method=Image.Resampling.LANCZOS)
        path.parent.mkdir(parents=True, exist_ok=True)
        photo.save(path, format="JPEG", quality=88, optimize=True)


def _reset(db, upload_dir: Path) -> int:
    seeded = db.scalars(
        select(Analysis).where(Analysis.image_path.contains(SEED_PREFIX))
    ).all()
    for analysis in seeded:
        db.delete(analysis)
    db.commit()

    for image in upload_dir.glob(f"{SEED_PREFIX}*"):
        image.unlink(missing_ok=True)

    return len(seeded)


def _seed_one(
    db,
    upload_dir: Path,
    photo_dir: Path,
    index: int,
    dish: dict,
    now: datetime,
) -> None:
    confidence = dish["confidence"]
    uncertain = confidence < UNCERTAIN_BELOW

    image_name = f"{SEED_PREFIX}{index + 1:02d}_{_slug(dish['label'])}.jpg"
    image_path = upload_dir / image_name

    source = photo_dir / dish["photo"]["file"]
    if source.is_file():
        _prepare_image(source, image_path)
    else:
        print(f"Missing {source}, using placeholder for {dish['label']}")
        _generate_image(image_path, dish["label"], PALETTE[index % len(PALETTE)])

    gap = 1 - confidence
    top3 = [{"label": dish["label"], "score": confidence}]
    for rank, alternative in enumerate(dish["alternatives"][:2], start=1):
        top3.append({"label": alternative, "score": round(gap * (0.5 / rank), 3)})

    days_ago = round(index * 21 / (len(DISHES) - 1))
    created_at = now - timedelta(days=days_ago, hours=(index * 7) % 24)

    create_analysis(
        db,
        {
            "image_path": str(image_path),
            "label": dish["label"],
            "confidence": confidence,
            "uncertain": uncertain,
            "top3": top3,
            "ingredients": [] if uncertain else list(dish["ingredients"]),
            "steps": [] if uncertain else list(dish["steps"]),
            "created_at": created_at,
        },
    )


def _print_credits() -> None:
    print("Photo credits (Wikimedia Commons):")
    for dish in DISHES:
        photo = dish["photo"]
        print(
            f"  {dish['label']}: {photo['title']} by {photo['artist']} "
            f"({photo['license']}) - {photo['page']}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed FoodLens demo analyses")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="delete previously seeded rows and images before inserting",
    )
    args = parser.parse_args()

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    photo_dir = upload_dir / SOURCE_PHOTOS_DIR

    with SessionLocal() as db:
        if args.reset:
            removed = _reset(db, upload_dir)
            print(f"Removed {removed} seeded analyses")

        now = datetime.now(UTC)
        for index, dish in enumerate(DISHES):
            _seed_one(db, upload_dir, photo_dir, index, dish, now)

    print(f"Seeded {len(DISHES)} analyses into {upload_dir}")
    _print_credits()


if __name__ == "__main__":
    main()
