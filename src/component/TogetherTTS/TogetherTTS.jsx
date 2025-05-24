import { useState, useEffect, useRef } from "react";
import Together from "together-ai";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import "../../styles/components.css";

import Neutral1 from "../../assets/faceExpressions/neutral1.png";
import Smile1 from "../../assets/faceExpressions/smile1.png";
import Angry1 from "../../assets/faceExpressions/angry1.png";
import Confused1 from "../../assets/faceExpressions/confused1.png";
import Sad1 from "../../assets/faceExpressions/sad1.png";

import Neutral2 from "../../assets/faceExpressions/neutral2.png";
import Smile2 from "../../assets/faceExpressions/smile2.png";
import Angry2 from "../../assets/faceExpressions/angry2.png";
import Confused2 from "../../assets/faceExpressions/confused2.png";
import Sad2 from "../../assets/faceExpressions/sad2.png";

import Neutral3 from "../../assets/faceExpressions/neutral3.png";
import Smile3 from "../../assets/faceExpressions/smile3.png";
import Angry3 from "../../assets/faceExpressions/angry3.png";
import Confused3 from "../../assets/faceExpressions/confused3.png";
import Sad3 from "../../assets/faceExpressions/sad3.png";

import IDK from "../../assets/faceExpressions/idk.png";

const neutral = [Neutral1, Neutral2, Neutral3];
const smile = [Smile1, Smile2, Smile3];
const angry = [Angry1, Angry2, Angry3];
const confused = [Confused1, Confused2, Confused3];
const sad = [Sad1, Sad2, Sad3];

const together = new Together({
  apiKey: "f4b524473beb41d6ea30ece6ad3cbff0fc948931518164504da174d19a5133fe", // Replace with your actual API key
});

const TogetherTTS = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [expression, setExpression] = useState("");
  const [loading, setLoading] = useState(false);
  const [face, setFace] = useState(IDK);
  const audioRef = useRef(null);

  const getChatbotResponse = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResponse("");
    setExpression("");

    try {
      const chatResponse = await together.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `
            You are an expert poultry farmer with years of experience. Your job is to provide detailed, helpful, and practical advice on poultry farming, including raising chickens, choosing breeds, feeding, disease prevention, and farm management.
            For every response, you must include a facial expression indicator at the beginning of your answer, based on the nature of your advice. The expression should be one of the following: smile, neutral, or serious. act more human , you can mad, sad, angry , confused .expression like a human just for rol play .you can be angry if being asked a stupid question or bad words just for role play.
            The response should always follow this exact format: '<expression> : Here is the advice I have for you...' or '<expression> | ...'.
            For example: 'serious | ...'
            and ensure the expression is separated from the rest of the advice by either ': ' or ' | '.
          `,
          },
          { role: "user", content: input },
        ],
        model: "deepseek-ai/DeepSeek-V3",
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: [""],
        stream: true,
      });

      let fullResponse = "";
      for await (const token of chatResponse) {
        const tokenContent = token.choices[0]?.delta?.content || "";
        fullResponse += tokenContent;

        if (fullResponse) {
          const parts = fullResponse.split(/[:|]/);
          if (parts.length > 1) {
            setExpression(parts[0].trim());
            setResponse(parts[1].trim());
          } else {
            setResponse(fullResponse);
          }
        }
      }

      // Trigger text-to-speech after response is received
      handleTextToSpeech(fullResponse);
    } catch (error) {
      console.error("Error fetching response:", error);
      setResponse("⚠️ Error: Unable to get a response.");
    }

    setLoading(false);
  };

  useEffect(() => {
    let newFace = IDK; // Default face

    switch (expression.toLowerCase()) {
      case "smile":
        newFace = smile[Math.floor(Math.random() * smile.length)];
        break;
      case "angry":
        newFace = angry[Math.floor(Math.random() * angry.length)];
        break;
      case "confused":
        newFace = confused[Math.floor(Math.random() * confused.length)];
        break;
      case "sad":
        newFace = sad[Math.floor(Math.random() * sad.length)];
        break;
      case "neutral":
        newFace = neutral[Math.floor(Math.random() * neutral.length)];
        break;
      default:
        newFace = IDK;
        break;
    }

    setFace(newFace);
  }, [expression]);

  const handleTextToSpeech = async (text) => {
    if (!text) {
      console.warn("[Kokoro TTS] No text provided for speech synthesis.");
      return;
    }

    console.log("[Kokoro TTS] Generating speech for text:", text);

    try {
      // API request setup
      const requestData = {
        model: "kokoro",
        input: text,
        voice: "af_bella",
        response_format: "mp3",
        speed: 1.0,
      };

      console.log("[Kokoro TTS] Sending request with data:", requestData);

      const response = await axios.post(
        "https://api.kokorotts.com/v1/audio/speech",
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
      );

      console.log("[Kokoro TTS] Received response:", response);

      // Validate response
      if (!response || !response.data) {
        console.error("[Kokoro TTS] Error: Response data is missing.");
        alert("Kokoro TTS: No valid audio received.");
        return;
      }

      console.log("[Kokoro TTS] Response status:", response.status);
      if (response.status !== 200) {
        console.error(
          "[Kokoro TTS] API error:",
          response.status,
          response.statusText
        );
        alert(
          `Kokoro TTS API Error: ${response.status} ${response.statusText}`
        );
        return;
      }

      // Convert response to a playable audio URL
      const blob = new Blob([response.data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(blob);

      console.log("[Kokoro TTS] Audio URL generated:", audioUrl);

      // Assign to audio player and auto-play
      if (audioRef.current) {
        console.log("[Kokoro TTS] Playing generated audio...");
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch((error) => {
          console.error("[Kokoro TTS] Audio play error:", error);
          alert("Kokoro TTS: Unable to play audio.");
        });
      } else {
        console.warn("[Kokoro TTS] No valid audioRef found.");
      }
    } catch (error) {
      console.error("[Kokoro TTS] Error generating speech:", error);

      if (error.response) {
        console.error("[Kokoro TTS] Server response:", error.response.data);
        alert(
          `Kokoro TTS API Error: ${error.response.status} - ${error.response.statusText}`
        );
      } else if (error.request) {
        console.error("[Kokoro TTS] No response received from server.");
        alert("Kokoro TTS: No response from server. Check your connection.");
      } else {
        console.error("[Kokoro TTS] Request setup error:", error.message);
        alert("Kokoro TTS: Request failed. Check console for details.");
      }
    }
  };

  return (
    <div className="component-wrapper">
      <div className="chatbot-container">
        <h1>🐔 Poultry Farming Assistant</h1>
        <div className="input-group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about poultry farming..."
            rows={3}
          />
          <button 
            onClick={getChatbotResponse} 
            disabled={loading}
            className={loading ? 'loading' : ''}
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>
        <div className="response">
          <h3>Response:</h3>
          <div>
            {expression && (
              <div className="face-container">
                <img
                  src={face}
                  alt={expression}
                  className="face-image"
                />
              </div>
            )}
            <ReactMarkdown>
              {response || "🤖 Waiting for your question..."}
            </ReactMarkdown>
          </div>
        </div>
        <audio ref={audioRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default TogetherTTS;
