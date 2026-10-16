# CarbonIQ AI — Hackathon starter

A Flask web app prototype for campus carbon estimation, scenario simulation, recommendations, and optional YOLO vehicle detection.

## Important accuracy note
Emission factors in `carbon_calculator.py` are illustrative placeholders only. They are not verified official factors. Before presenting real-world estimates, replace them with current documented factors and cite the sources in your PPT. Image-detected vehicle counts do not directly determine emissions; distance, vehicle type, occupancy/fuel details, and an appropriate method are needed.

## Setup on Windows

1. Install Python 3.11 or newer and VS Code.
2. Open this folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Create a virtual environment:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   If PowerShell blocks activation, use Command Prompt terminal instead:

   ```bat
   .venv\Scripts\activate.bat
   ```

5. Install the base requirements:

   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

6. Start the app:

   ```powershell
   python app.py
   ```

7. Open the local address shown in the terminal, usually `http://127.0.0.1:5000`.

## Enable Computer Vision (optional, install after the basic app works)

Stop Flask with `Ctrl+C`, then run:

```powershell
pip install ultralytics
```

Start again with `python app.py`. On first use, YOLO may need to download model weights and may take time. Use an image you have permission to use. If the model cannot be installed within your time limit, keep the rest of the demo working and explain that vehicle detection is the optional module.

## What is implemented
- Flask server and API
- Interactive inputs and baseline/proposed scenario comparison
- Charts via Chart.js CDN (requires internet)
- Rule-based recommendations (not an LLM yet)
- Optional YOLO object detection route

## Suggested team split
- Member 1: backend, calculation factors, YOLO setup and testing.
- Member 2: UI, charts, PPT, architecture diagram and demo script.
