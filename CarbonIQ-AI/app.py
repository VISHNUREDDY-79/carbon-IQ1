
from flask import Flask, render_template, request, jsonify
from carbon_calculator import calculate_emissions, build_recommendations
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/calculate", methods=["POST"])
def calculate():
    data = request.get_json(silent=True) or {}

    baseline = calculate_emissions(data)

    try:
        reduction = float(data.get("electricity_reduction", 20))
    except (ValueError, TypeError):
        reduction = 20

    reduction = max(0, min(reduction, 60))

    proposed_data = dict(data)
    proposed_data["electricity_kwh"] = (
        float(data.get("electricity_kwh", 0)) * (1 - reduction / 100)
    )

    proposed = calculate_emissions(proposed_data)
    saved = baseline["total_kg"] - proposed["total_kg"]

    saved_percent = (
        saved / baseline["total_kg"] * 100
        if baseline["total_kg"] > 0 else 0
    )

    return jsonify({
        "baseline": baseline,
        "proposed": proposed,
        "saved_kg": round(saved, 2),
        "saved_percent": round(saved_percent, 1),
        "recommendations": build_recommendations(data, baseline)
    })
@app.route("/api/detect", methods=["POST"])
def detect():
    from ultralytics import YOLO

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]

    if not image.filename:
        return jsonify({"error": "Please select an image"}), 400

    allowed_extensions = {"png", "jpg", "jpeg", "webp"}
    filename = secure_filename(image.filename)

    if "." not in filename or filename.rsplit(".", 1)[1].lower() not in allowed_extensions:
        return jsonify({"error": "Please upload a PNG, JPG, JPEG, or WEBP image"}), 400

    upload_folder = os.path.join(app.root_path, "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    image_path = os.path.join(upload_folder, filename)

    try:
        image.save(image_path)

        model = YOLO("yolo11n.pt")
        results = model(image_path, verbose=False)
        

        counts = {}
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                label = model.names[class_id]
                counts[label] = counts.get(label, 0) + 1

        return jsonify({
            "success": True,
            "counts": counts,
            "message": "Image analysis completed"
        })

    except Exception as exc:
        app.logger.exception("Image detection failed")
        return jsonify({
            "error": "Image analysis failed. Check the server terminal for details."
        }), 500

    finally:
        if os.path.exists(image_path):
            os.remove(image_path)


if __name__ == "__main__":
    app.run(debug=True)
5

