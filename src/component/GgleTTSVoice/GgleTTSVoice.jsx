import { useState, useEffect, useRef } from "react";
import Together from "together-ai";
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
// import GratefulVideo from "../../assets/video/grateful.mp4";
import SadVideo from "../../assets/video/sad.mp4";
import AngryVideo from "../../assets/video/angry.mp4";
import GoodbyeVideo from "../../assets/video/goodbye.mp4";

const neutral = [Neutral1, Neutral2, Neutral3];
const smile = [Smile1, Smile2, Smile3];
const angry = [Angry1, Angry2, Angry3];
const confused = [Confused1, Confused2, Confused3];
const sad = [Sad1, Sad2, Sad3];

const together = new Together({
  apiKey: "f4b524473beb41d6ea30ece6ad3cbff0fc948931518164504da174d19a5133fe", // Replace with your actual API key
});

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
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const videoRef = useRef(null);
  const typingSoundRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Ensure video plays when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  }, []);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Stop after the user finishes speaking
      recognitionRef.current.interimResults = false; // Only final results
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");

        setInput(transcript);

        // Automatically call getChatbotResponse after speech is recognized
        getChatbotResponse(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearTimeout(silenceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Initialize typing sound
    typingSoundRef.current = new Audio(TypingSound);
    typingSoundRef.current.volume = 0.3; // Set volume to 30%
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
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getChatbotResponse = async (userInput) => {
    if (!userInput.trim()) return;

    setLoading(true);
    setResponse("");
    setExpression("");

    try {
      const chatResponse = await together.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `
        You are an expert poultry farmer with years of experience. Your job is to provide detailed, helpful, and practical advice on poultry farming, including raising chickens, choosing breeds, feeding, disease prevention, and farm management. And you answer straight to the question . ${
          language === "my"
            ? "you answer in burmese language and short answer"
            : "you answer in english language "
        } .
        For every response, you must include a facial expression indicator at the beginning of your answer, based on the nature of your advice. The expression should be one of the following: explain,happy,grateful,sad,angry,greeting,goodbye. act more human , you can mad, sad, angry  ..expression like a human just for rol play .you can be angry if being asked a stupid question or bad words just for role play.
        The response should always follow this exact format: '<expression> : Here is the advice I have for you...' or '<expression> | ...'.
        if user ask explain me , express explain expression
      `,
          },
          { role: "user", content: userInput },
        ],
        model: "deepseek-ai/DeepSeek-V3",
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: [" "],
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
            const response = parts.slice(1).join(":").trim();
            console.log("Response:", fullResponse);
            setResponse(response); // Ge
          } else {
            setResponse(fullResponse);
          }
        }
      }

      // Trigger TTS after response is received
      speakText(fullResponse);
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

  // Function to speak text using the proxy server
  const speakText = async (text) => {
    // Remove the expression part (e.g., "smile | ...")
    const cleanedText = text.replace(/^.*?[|:]/, "").trim();

    try {
      // Fetch the audio from the proxy server
      const proxyUrl = `http://localhost:5000/tts?text=${encodeURIComponent(
        cleanedText
      )}&lang=${language}`;

      // Create an audio element and play it
      const audio = new Audio();

      // Add event listeners for better error handling
      audio.addEventListener("error", (e) => {
        console.error("Audio error:", e);
        console.log("Audio error details:", {
          error: audio.error,
          networkState: audio.networkState,
          readyState: audio.readyState,
        });
      });

      // Set the source and play
      audio.src = proxyUrl;

      try {
        await audio.play();
        console.log(
          `Playing TTS in ${language === "my" ? "Burmese" : "English"}...`
        );
      } catch (playError) {
        console.error("Error playing audio:", playError);
        // Try to load the audio first
        try {
          await audio.load();
          await audio.play();
        } catch (loadError) {
          console.error("Error loading audio:", loadError);
        }
      }
    } catch (error) {
      console.error("Error in TTS:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (input.trim()) {
      getChatbotResponse(input);
    }
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

    // Play typing sound
    if (typingSoundRef.current) {
      typingSoundRef.current.currentTime = 0; // Reset sound to start
      typingSoundRef.current
        .play()
        .catch((error) => console.log("Error playing typing sound:", error));
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop sound after 1 second of no typing
    typingTimeoutRef.current = setTimeout(() => {
      if (typingSoundRef.current) {
        typingSoundRef.current.pause();
      }
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
      case "goodbye" || "goodbye":
        return GoodbyeVideo;
      // Add more cases for other expressions
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
        style={{
          left: "70px",
        }}
        onClick={() => handleClearChat()}
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
                  <>
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
                  </>
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
    </div>
  );
};

export default GgleTTSVoice;
