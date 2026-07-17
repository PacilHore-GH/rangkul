from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import yaml


MANIFEST_PATH = Path(__file__).resolve().parents[2] / "model_manifest.yaml"


def load_manifest() -> dict:
    return yaml.safe_load(MANIFEST_PATH.read_text(encoding="utf-8"))


def verify_manifest(cache_dir: Path) -> list[str]:
    manifest = load_manifest()
    missing: list[str] = []
    for name, spec in manifest["models"].items():
        if spec["provider"] == "direct":
            path = cache_dir / spec["local_path"]
            if not path.exists():
                missing.append(f"{name}: missing {path}")
                continue
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            if digest != spec["sha256"]:
                missing.append(f"{name}: sha256 mismatch")
    return missing


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--download", action="store_true")
    parser.add_argument("--verify-only", action="store_true")
    parser.add_argument("--print-manifest", action="store_true")
    parser.add_argument("--cache-dir", default="/models")
    args = parser.parse_args()
    if args.print_manifest:
        print(MANIFEST_PATH.read_text(encoding="utf-8"))
        return
    failures = verify_manifest(Path(args.cache_dir))
    if failures:
        raise SystemExit("\n".join(failures))
    if args.download:
        print("Hugging Face/direct downloads are intentionally explicit; run backend/scripts/bootstrap_models.py.")
    print("Model manifest verification passed.")


if __name__ == "__main__":
    main()
