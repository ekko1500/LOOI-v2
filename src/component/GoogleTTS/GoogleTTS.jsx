import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { IoSend } from "react-icons/io5";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { IoMdChatbubbles, IoMdClose } from "react-icons/io";
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
const HF_MODEL = "meta-llama/Llama-3-8b-chat-hf"; // Change to preferred HF chat model

const GgleTTS = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [expression, setExpression] = useState("");
  const [loading, setLoading] = useState(false);
  const [idle, setIdle] = useState(true);
  const [face, setFace] = useState(IDK);
  const [isListening, setIsListening] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [language, setLanguage] = useState("my"); // "my" for Burmese, "en" for English

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const videoRef = useRef(null);
  const typingSoundRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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
        `https://api-inference.huggingface.co/models/${HF_MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: [
              {
                role: "system",
                content: `
                You are an expert poultry farmer with years of experience.
                Provide detailed, helpful, practical advice in ${
                  language === "my" ? "Burmese" : "English"
                }.
                Include a facial expression at the start: explain,happy,grateful,sad,angry,greeting,goodbye.
                Format: "<expression> : advice..." or "<expression> | advice...".
              `,
              },
              { role: "user", content: userInput },
            ],
          }),
        }
      );

      const data = await res.json();
      let fullResponse =
        data?.[0]?.generated_text || data?.generated_text || "";
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

      speakText(fullResponse);
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
            top: 0,
            left: 0,
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
              {expression && (
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
            bottom: "10px",
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
            bottom: "10px",
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

export default GgleTTS;
