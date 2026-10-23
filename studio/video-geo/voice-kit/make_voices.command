#!/bin/bash
cd "$(dirname "$0")"
python3 make_voices.py
read -p "Press Enter to close..."
