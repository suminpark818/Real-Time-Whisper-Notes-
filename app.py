import os
import tempfile
import subprocess

from flask import Flask, render_template, request, jsonify
import whisper

app = Flask(__name__)

# Whisper 모델 로드
model = whisper.load_model("tiny")  # 빠르고 안정적


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        temp_path = tmp.name
        audio_file.save(temp_path)

    try:
        # Whisper STT
        result = model.transcribe(temp_path)
        transcript = result.get("text", "").strip()

        if not transcript:
            return jsonify({"transcript": "", "summary": "", "message": "No speech detected"})

        # Ollama 요약
        prompt = f"Summarize the following transcript into clear bullet points:\n\n{transcript}"

        ollama_result = subprocess.run(
            ["ollama", "run", "llama3.1:8b"],
            input=prompt,
            text=True,
            capture_output=True
        )

        summary = ollama_result.stdout.strip()

        return jsonify({
            "transcript": transcript,
            "summary": summary
        })

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)
