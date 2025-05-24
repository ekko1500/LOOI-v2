import React, { useState, useRef } from "react";
import axios from "axios";

const TTSComponent = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  const handleTextToSpeech = async () => {
    if (!text) return alert("Please enter text!");

    setLoading(true);
    try {
      const response = await axios.post(
        "https://api.kokorotts.com/v1/audio/speech",
        {
          model: "kokoro", // Required for compatibility
          input: text,
          voice: "af_bella",
          response_format: "mp3", // Supported: mp3, wav, opus, flac
          speed: 1.0,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer", // Important for binary data
        }
      );

      // Convert response to a playable audio URL
      const blob = new Blob([response.data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(blob);

      // Assign to audio player and auto-play
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      alert("Failed to generate speech. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Kokoro TTS</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text..."
        rows="4"
        style={{ width: "80%", padding: "10px" }}
      ></textarea>
      <br />
      <button
        onClick={handleTextToSpeech}
        disabled={loading}
        style={{ marginTop: "10px", padding: "10px" }}
      >
        {loading ? "Generating..." : "Convert to Speech"}
      </button>
      <br />
      <audio ref={audioRef} controls style={{ marginTop: "20px" }}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default TTSComponent;
