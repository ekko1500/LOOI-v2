import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { IoSend } from "react-icons/io5";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { IoMdChatbubbles, IoMdClose } from "react-icons/io";
import mqtt from "mqtt";
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
import IdleVideo from "../../assets/video/idle.mp4";
import LoadingVideo from "../../assets/video/loading.mp4";
import TypingSound from "../../assets/video/typing.mp3";
import GreetingVideo from "../../assets/video/greeting.mp4";
import ExplainingVideo from "../../assets/video/explain.mp4";
import HappyVideo from "../../assets/video/happy.mp4";
import SadVideo from "../../assets/video/sad.mp4";
import AngryVideo from "../../assets/video/angry.mp4";
import GoodbyeVideo from "../../assets/video/goodbye.mp4";

import bgMusic from "../../assets/audio/eve.mp3";

const neutral = [Neutral1, Neutral2, Neutral3];
const smile = [Smile1, Smile2, Smile3];
const angry = [Angry1, Angry2, Angry3];
const confused = [Confused1, Confused2, Confused3];
const sad = [Sad1, Sad2, Sad3];

// Hugging Face API
const HF_API_KEY = "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";
// const HF_API_KEY = process.env.HF_API_KEY;

const HF_MODEL = "deepseek-ai/DeepSeek-R1:novita";
// Change to preferred HF chat model

const GgleTTSVoice = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [expression, setExpression] = useState("");
  const [loading, setLoading] = useState(false);
  const [idle, setIdle] = useState(true);
  const [face, setFace] = useState(IDK);
  const [isListening, setIsListening] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [language, setLanguage] = useState("my"); // "my" for Burmese, "en" for English

  const [positionLeft, setPositionLeft] = useState(800);
  const [positionTop, setPositionTop] = useState(330);
  const [eye, setEye] = useState({ x: 0, y: 0 });

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const videoRef = useRef(null);
  const typingSoundRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const mqttClientRef = useRef(null);
  const targetEyePositionRef = useRef({ x: 0, y: 0 });
  const currentEyePositionRef = useRef({ x: 0, y: 0 });
  const baseSmoothingFactor = 0.4; // Base smoothing factor for responsive movement
  const lastMessageTimeRef = useRef(null);
  const noMessageTimeoutRef = useRef(null);

  // MQTT Configuration
  const MQTT_BROKER = "ws://broker.hivemq.com:8000/mqtt";
  const MQTT_COMMAND_TOPIC = "robot/command";
  const NO_MESSAGE_TIMEOUT = 2000; // Return to center after 2 seconds of no messages
  //hello

  const polygon = [
    { x: 550, y: 540 },
    { x: 500, y: 160 },
    { x: 1070, y: 185 },
    { x: 1080, y: 560 },
  ];

  // Initialize MQTT connection to receive red ball position
  useEffect(() => {
    // Initialize target position to center
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    targetEyePositionRef.current = { x: windowWidth / 2, y: windowHeight / 2 };

    console.log("Connecting to MQTT broker:", MQTT_BROKER);

    const mqttClient = mqtt.connect(MQTT_BROKER);
    mqttClientRef.current = mqttClient;

    mqttClient.on("connect", () => {
      console.log("✅ Connected to MQTT broker");
      mqttClient.subscribe(MQTT_COMMAND_TOPIC);
      console.log("📡 Subscribed to topic:", MQTT_COMMAND_TOPIC);
    });

    mqttClient.on("message", (topic, message) => {
      const msg = message.toString();
      console.log("📨 Received MQTT message:", msg);

      // Update last message time
      lastMessageTimeRef.current = Date.now();

      // Clear existing timeout
      if (noMessageTimeoutRef.current) {
        clearTimeout(noMessageTimeoutRef.current);
      }

      // Parse message format: "9|B127" where 127 is the angle (0-180)
      const match = msg.match(/^\d+\|B(\d+)$/);
      if (match) {
        const angle = parseInt(match[1], 10);
        console.log("📐 Parsed angle:", angle);

        // Convert angle (0-180) to screen X position
        // Angle 0 = left side, 90 = center, 180 = right side
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Map angle 0-180 to screen X position (0 to windowWidth)
        // Using linear mapping: angle 0 -> 0, angle 180 -> windowWidth
        const screenX = (angle / 180) * windowWidth;

        // Keep Y at center (or you can adjust based on your needs)
        const screenY = windowHeight / 2;

        // Clamp to polygon boundary if needed
        let final = { x: screenX, y: screenY };
        if (!isInsidePolygon(final, polygon)) {
          final = clampPointToPolygon(final, polygon);
        }

        // Update target position (will be smoothed)
        targetEyePositionRef.current = final;

        // Initialize current position on first detection if needed
        if (
          currentEyePositionRef.current.x === 0 &&
          currentEyePositionRef.current.y === 0
        ) {
          currentEyePositionRef.current = { x: final.x, y: final.y };
          setEye({ x: final.x, y: final.y });
        }

        // Set timeout to return to center if no more messages
        noMessageTimeoutRef.current = setTimeout(() => {
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const centerX = windowWidth / 2;
          const centerY = windowHeight / 2;

          targetEyePositionRef.current = { x: centerX, y: centerY };
          console.log("⏱️ No messages received, returning to center");
        }, NO_MESSAGE_TIMEOUT);
      }
    });

    mqttClient.on("error", (err) => {
      console.error("❌ MQTT error:", err);
    });

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
      if (noMessageTimeoutRef.current) {
        clearTimeout(noMessageTimeoutRef.current);
      }
    };
  }, []);

  // Smooth interpolation loop for eye position
  useEffect(() => {
    // Initialize current position
    if (
      currentEyePositionRef.current.x === 0 &&
      currentEyePositionRef.current.y === 0
    ) {
      currentEyePositionRef.current = { x: eye.x || 0, y: eye.y || 0 };
    }

    const smoothUpdate = () => {
      const target = targetEyePositionRef.current;
      const current = currentEyePositionRef.current;

      // Linear interpolation (lerp) towards target
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Adaptive smoothing: faster when far away, smoother when close
      // Use higher factor (up to 0.7) when distance is large, lower (0.3) when close
      const adaptiveFactor =
        distance > 100
          ? Math.min(0.7, baseSmoothingFactor + (distance / 500) * 0.3)
          : baseSmoothingFactor;

      // Only update if there's a significant difference to avoid unnecessary renders
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        current.x += dx * adaptiveFactor;
        current.y += dy * adaptiveFactor;
        setEye({ x: current.x, y: current.y });
      }

      requestAnimationFrame(smoothUpdate);
    };

    const smoothAnimationId = requestAnimationFrame(smoothUpdate);

    return () => {
      cancelAnimationFrame(smoothAnimationId);
    };
  }, []);

  const startAudio = () => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn(err.message));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  };

  useEffect(() => {
    if (videoRef.current) videoRef.current.play().catch(console.error);
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setInput(transcript);
        getChatbotResponse(transcript);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => {
    typingSoundRef.current = new Audio(TypingSound);
    typingSoundRef.current.volume = 0.3;
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };
  const toggleListening = () => {
    isListening ? stopListening() : startListening();
  };

  const getChatbotResponse = async (userInput) => {
    if (!userInput.trim()) return;
    setLoading(true);
    setResponse("");
    setExpression("");

    try {
      const res = await fetch(
        "https://router.huggingface.co/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // model: "Qwen/Qwen2.5-7B-Instruct",
            model: "deepseek-ai/DeepSeek-R1:novita",
            messages: [
              {
                role: "system",
                content: `
        You are an expert poultry farmer.
        Respond in ${language === "my" ? "Burmese" : "English"}.
        Start with an expression: happy, explain, angry, etc.
        Format: "<expression> : advice..."
      `,
              },
              {
                role: "user",
                content: userInput,
              },
            ],
          }),
        }
      );

      const data = await res.json();
      console.log("Response data:", data);

      let fullResponse =
        data?.choices?.[0]?.message?.content ||
        "⚠️ No response from Hugging Face API.";

      // Remove content inside <think>...</think> tags
      fullResponse = fullResponse
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .trim();

      if (fullResponse) {
        const parts = fullResponse.split(/[:|]/);
        if (parts.length > 1) {
          setExpression(parts[0].trim());
          setResponse(parts.slice(1).join(":").trim());
        } else {
          setResponse(fullResponse);
        }
      } else {
        setResponse("⚠️ No response from Hugging Face API.");
      }

      // speakText(fullResponse);
    } catch (error) {
      console.error(error);
      setResponse("⚠️ Error: Unable to get a response.");
    }

    setLoading(false);
  };

  useEffect(() => {
    let newFace = IDK;
    switch (expression.toLowerCase()) {
      case "happy":
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

  const speakText = async (text) => {
    const cleanedText = text.replace(/^.*?[|:]/, "").trim();
    try {
      const proxyUrl = `http://localhost:5000/tts?text=${encodeURIComponent(
        cleanedText
      )}&lang=${language}`;
      const audio = new Audio(proxyUrl);
      await audio.play();
    } catch (error) {
      console.error("Error in TTS:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) getChatbotResponse(input);
    setIdle(false);
    setInput("");
  };
  const handleClearChat = () => {
    setExpression("");
    setResponse("");
    setLoading(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (typingSoundRef.current) {
      typingSoundRef.current.currentTime = 0;
      typingSoundRef.current.play().catch(console.log);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (typingSoundRef.current) typingSoundRef.current.pause();
    }, 1000);
  };

  const getVideoSource = (expression) => {
    switch (expression.toLowerCase()) {
      case "greeting":
        return GreetingVideo;
      case "explain":
        return ExplainingVideo;
      case "happy":
        return HappyVideo;
      case "sad":
        return SadVideo;
      case "angry":
        return AngryVideo;
      case "goodbye":
        return GoodbyeVideo;
      default:
        return null;
    }
  };

  return (
    <div className="component-wrapper">
      {!response && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            transform: "translate(-50%,-50%)",
            left: eye.x,
            top: eye.y,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        >
          <source src={IdleVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      <div className="language-toggle">
        <button
          className={`lang-btn ${language === "my" ? "active" : ""}`}
          onClick={() => setLanguage("my")}
        >
          မြန်မာ
        </button>
        <button
          className={`lang-btn ${language === "en" ? "active" : ""}`}
          onClick={() => setLanguage("en")}
        >
          English
        </button>
      </div>

      <button className="toggle-chat" onClick={() => setIsVisible(!isVisible)}>
        <IoMdChatbubbles size={24} />
      </button>
      <button
        className="toggle-chat"
        style={{ left: "70px" }}
        onClick={handleClearChat}
      >
        <IoMdClose size={24} />
      </button>

      {isVisible && (
        <>
          <div className="chatbot-container">
            <h1>🐔 Poultry Farming Assistant</h1>
            <div className="response">
              {expression == 3 && (
                <div className="face-container">
                  {getVideoSource(expression) ? (
                    <video
                      autoPlay
                      loop
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    >
                      <source
                        src={getVideoSource(expression)}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img src={face} alt={expression} className="face-image" />
                  )}
                </div>
              )}
              <div className="response-box">
                {!response && !idle ? (
                  <div className="loading-screen">
                    <video
                      autoPlay
                      loop
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    >
                      <source src={LoadingVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <div className="loading-text">Thinking...</div>
                  </div>
                ) : (
                  <ReactMarkdown>{response}</ReactMarkdown>
                )}
              </div>
            </div>
          </div>
          <div className="input-container">
            <form onSubmit={handleSubmit} className="input-group">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about poultry farming..."
                rows={3}
              />
              <div className="button-group">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading || !input.trim()}
                >
                  <IoSend size={20} />
                </button>
                <button
                  type="button"
                  className="submit-button"
                  onClick={toggleListening}
                  disabled={loading}
                >
                  {isListening ? (
                    <FaMicrophoneSlash size={20} />
                  ) : (
                    <FaMicrophone size={20} />
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      <audio ref={audioRef} src={bgMusic} />
      {!isPlaying && (
        <button
          style={{
            position: "absolute",
            bottom: "130px",
            left: "10px",
            zIndex: 9999,
            padding: "8px 16px",
            background: "#222",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100px",
            height: "40px",
          }}
          onClick={startAudio}
        >
          Start Music
        </button>
      )}
      {isPlaying && (
        <button
          style={{
            position: "absolute",
            bottom: "130px",
            left: "10px",
            zIndex: 9999,
            padding: "8px 16px",
            background: "#222",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100px",
            height: "40px",
          }}
          onClick={toggleMute}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
      )}
    </div>
  );
};

export default GgleTTSVoice;

function isInsidePolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

function clampPointToPolygon(point, polygon) {
  let closestPoint = null;
  let minDist = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];

    const clamped = closestPointOnLine(point, a, b);
    const dist = Math.hypot(clamped.x - point.x, clamped.y - point.y);

    if (dist < minDist) {
      minDist = dist;
      closestPoint = clamped;
    }
  }

  return closestPoint;
}

function closestPointOnLine(p, a, b) {
  const A = { x: p.x - a.x, y: p.y - a.y };
  const B = { x: b.x - a.x, y: b.y - a.y };

  const t = Math.max(
    0,
    Math.min(1, (A.x * B.x + A.y * B.y) / (B.x * B.x + B.y * B.y))
  );

  return {
    x: a.x + B.x * t,
    y: a.y + B.y * t,
  };
}
