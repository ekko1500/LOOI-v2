import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./TogetherTTS.css";

// ✅ Use absolute paths to debug imports
import Neutral1 from "/src/assets/faceExpressions/neutral1.png";
import Smile1 from "/src/assets/faceExpressions/smile1.png";
import Angry1 from "/src/assets/faceExpressions/angry1.png";
import Confused1 from "/src/assets/faceExpressions/confused1.png";
import Sad1 from "/src/assets/faceExpressions/sad1.png";

import Neutral2 from "/src/assets/faceExpressions/neutral2.png";
import Smile2 from "/src/assets/faceExpressions/smile2.png";
import Angry2 from "/src/assets/faceExpressions/angry2.png";
import Confused2 from "/src/assets/faceExpressions/confused2.png";
import Sad2 from "/src/assets/faceExpressions/sad2.png";

import Neutral3 from "/src/assets/faceExpressions/neutral3.png";
import Smile3 from "/src/assets/faceExpressions/smile3.png";
import Angry3 from "/src/assets/faceExpressions/angry3.png";
import Confused3 from "/src/assets/faceExpressions/confused3.png";
import Sad3 from "/src/assets/faceExpressions/sad3.png";

import IDK from "/src/assets/faceExpressions/idk.png";

// ✅ Store expressions in arrays
const neutral = [Neutral1, Neutral2, Neutral3];
const smile = [Smile1, Smile2, Smile3];
const angry = [Angry1, Angry2, Angry3];
const confused = [Confused1, Confused2, Confused3];
const sad = [Sad1, Sad2, Sad3];

// ✅ Hugging Face Inference API
const HF_API_KEY = "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";
const HF_MODEL = "meta-llama/Llama-3-8b-chat-hf"; // you can swap to another chat model

const TogetherTTS = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState(""); // Chatbot response text
  const [expression, setExpression] = useState(""); // Emotion label
  const [loading, setLoading] = useState(false);
  const [face, setFace] = useState(IDK); // Default face

  const getChatbotResponse = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResponse(""); // Clear previous response
    setExpression(""); // Reset expression

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
                  Provide detailed, helpful, and practical advice on poultry farming, 
                  including raising chickens, choosing breeds, feeding, disease prevention, 
                  and farm management. 
                  Keep answers short (under 5000 characters), only text, no images. 
                  Always include a facial expression indicator at the beginning of your answer. 
                  Use one of: smile, neutral, angry, confused, sad. 
                  Format: "<expression> : advice..." or "<expression> | advice...".
                `,
              },
              { role: "user", content: input },
            ],
          }),
        }
      );

      const data = await res.json();

      let fullResponse = "";
      if (Array.isArray(data)) {
        // Some HF models return array of objects with generated_text
        fullResponse = data[0]?.generated_text || "";
      } else if (data?.generated_text) {
        fullResponse = data.generated_text;
      } else if (data?.choices?.[0]?.message?.content) {
        // For chat-completions like OpenAI format
        fullResponse = data.choices[0].message.content;
      }

      if (fullResponse) {
        const parts = fullResponse.split(/[:|]/);
        if (parts.length > 1) {
          setExpression(parts[0].trim());
          const respText = parts.slice(1).join(":").trim();
          setResponse(respText);
        } else {
          setResponse(fullResponse);
        }
      } else {
        setResponse("⚠️ No response from Hugging Face API.");
      }
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
        newFace = IDK; // Fallback
        break;
    }

    setFace(newFace);
  }, [expression]);

  return (
    <div className="chatbot-container">
      <h1>🐔 Poultry Farming Chatbot</h1>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything about poultry farming..."
        rows={3}
      />
      <button onClick={getChatbotResponse} disabled={loading}>
        {loading ? "Thinking..." : "Ask"}
      </button>
      <div className="response">
        <h3>Chatbot Response:</h3>
        <div>
          {expression && (
            <div>
              <img
                src={face}
                alt={expression}
                style={{ width: 100, height: 100 }}
              />
              <p>
                <strong>Expression:</strong> {expression}
              </p>
            </div>
          )}
          <ReactMarkdown>
            {response || "🤖 Waiting for response..."}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default TogetherTTS;
