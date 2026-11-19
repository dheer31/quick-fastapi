"""Regression tests for QuickKart's self-hosted image assets."""
import re
import unittest
from pathlib import Path

from backend.app.data.products import PRODUCTS
from backend.app.data.categories import CATEGORIES

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
ASSETS = FRONTEND / "assets" / "images"


class ImageAssetTests(unittest.TestCase):
    def test_every_product_image_exists_locally(self):
        for product in PRODUCTS:
            with self.subTest(product=product["id"]):
                self.assertTrue(product["image_url"].startswith("/static/assets/images/"))
                asset = FRONTEND / product["image_url"].replace("/static/", "")
                self.assertTrue(asset.is_file(), f"Missing {asset}")

    def test_every_category_image_exists_locally(self):
        for category in CATEGORIES:
            with self.subTest(category=category["id"]):
                self.assertTrue(category["image"].startswith("/static/assets/images/"))
                asset = FRONTEND / category["image"].replace("/static/", "")
                self.assertTrue(asset.is_file(), f"Missing {asset}")

    def test_hero_and_fallback_images_exist(self):
        for name in [*(f"hero-{i}.svg" for i in range(1, 5)), "image-fallback.svg"]:
            with self.subTest(asset=name):
                self.assertTrue((ASSETS / name).is_file())

    def test_image_assets_are_valid_svg_documents(self):
        for asset in ASSETS.glob("*.svg"):
            with self.subTest(asset=asset.name):
                content = asset.read_text(encoding="utf-8")
                self.assertIn("<svg", content)
                self.assertIn("</svg>", content)

    def test_frontend_does_not_depend_on_remote_product_images(self):
        files = list((FRONTEND / "js").glob("*.js"))
        files += list((ROOT / "backend" / "app" / "data").glob("*.py"))
        remote = []
        for file in files:
            content = file.read_text(encoding="utf-8")
            self.assertNotIn("images.unsplash.com", content)
        self.assertEqual(remote, [])

    def test_fallback_handler_is_included_on_every_html_page(self):
        for page in FRONTEND.glob("*.html"):
            with self.subTest(page=page.name):
                self.assertIn("/js/images.js", page.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
