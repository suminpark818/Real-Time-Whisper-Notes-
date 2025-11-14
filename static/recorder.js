let mediaRecorder = null;
let audioChunks = [];

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusSpan = document.getElementById("status");
const transcriptPre = document.getElementById("transcript");
const summaryPre = document.getElementById("summary");

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            statusSpan.textContent = "Processing...";

            const blob = new Blob(audioChunks, { type: "audio/webm" });
            const formData = new FormData();
            formData.append("audio", blob, "recording.webm");

            try {
                const response = await fetch("/transcribe", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    transcriptPre.textContent = result.transcript || "";
                    summaryPre.textContent = result.summary || "";
                    statusSpan.textContent = "Done";
                } else {
                    transcriptPre.textContent = "";
                    summaryPre.textContent = "";
                    statusSpan.textContent = result.error || "Error";
                }
            } catch (err) {
                console.error(err);
                statusSpan.textContent = "Error";
            }
        };

        mediaRecorder.start();
        statusSpan.textContent = "Recording...";
        startBtn.disabled = true;
        stopBtn.disabled = false;

    } catch (err) {
        console.error("Mic permission error:", err);
        statusSpan.textContent = "Mic error";
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

startBtn.addEventListener("click", startRecording);
stopBtn.addEventListener("click", stopRecording);
