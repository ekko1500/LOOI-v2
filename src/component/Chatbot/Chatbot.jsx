import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./Chatbot.css";

const Chatbot = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const HF_API_KEY = process.env.REACT_APP_HF_TOKEN; // Replace with your Hugging Face API key
  const MODEL_NAME = ""; // Replace with Zephyr model

  // const HF_API_KEY = "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"; // Replace with your Hugging Face API key
  // const MODEL_NAME = "HuggingFaceH4/zephyr-7b-beta"; // Replace with Zephyr model

  // const MODEL_NAME = "HuggingFaceH4/t5-base"; // Replace with Blenderbot model

  // Send the user's message to Hugging Face API
  const getChatbotResponse = async () => {
    if (!input.trim()) return;

    setLoading(true);

    try {
      // Creating a role-play prompt
      const prompt = `You are an expert poultry farmer. Answer the following question in a detailed and helpful manner:

      Question: ${input}

      Answer:`;

      const res = await axios.post(
        `https://api-inference.huggingface.co/models/${MODEL_NAME}`,
        {
          inputs: prompt,
          //   parameters: { max_new_tokens: 100 },
        },
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Removing the prompt from the AI response
      const responseText =
        res.data[0].generated_text.split("Answer:")[1]?.trim() ||
        "Sorry, I couldn't generate a response.";

      setResponse(responseText);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Sorry, something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const formatResponse = (text) => {
    const lines = text.split("\n");
    return lines.map((line, index) => (
      <p key={index} dangerouslySetInnerHTML={{ __html: line }}></p>
    ));
  };

  return (
    <div className="chatbot-container">
      <h1>🐔 Poultry Farming Chatbot</h1>
      <div className="chatbox">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about poultry farming..."
        ></textarea>
        <button onClick={getChatbotResponse} disabled={loading}>
          {loading ? "Thinking..." : "Ask"}
        </button>

        <div className="messages">
          {response && (
            <div className="response">
              <h3>Chatbot Response:</h3>
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
