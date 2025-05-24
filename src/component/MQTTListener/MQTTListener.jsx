import React, { useState, useEffect } from "react";
import { Client } from "paho-mqtt";
import "./MQTTClient.css"; // Import the dark theme CSS

const MQTT_URL = "ws://broker.hivemq.com:8000/mqtt";
const TOPICS = ["my/command/topic", "my/response/topic"];

const MQTTClient = () => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState({});
  const [error, setError] = useState(null);

  const addMessage = (topic, newMessage) => {
    setMessages((prevMessages) => {
      const currentMessages = prevMessages[topic] || [];
      return {
        ...prevMessages,
        [topic]: [...currentMessages, newMessage],
      };
    });
  };

  const mqttConnect = () => {
    try {
      const mqttClient = new Client(
        MQTT_URL,
        "mqtt-client-" + Math.random().toString(16).substr(2, 8)
      );

      mqttClient.onConnectionLost = (responseObject) => {
        setIsConnected(false);
        setError("Connection to MQTT broker lost.");
        setClient(null);
        console.error("Connection lost:", responseObject.errorMessage);
      };

      mqttClient.onMessageArrived = (message) => {
        console.log("Message Arrived:", message.payloadString);
        addMessage(message.destinationName, message.payloadString);
      };

      mqttClient.connect({
        onSuccess: () => {
          setIsConnected(true);
          setError(null);
          setClient(mqttClient);
          console.log("Connected to MQTT broker");

          TOPICS.forEach((topic) => {
            mqttClient.subscribe(topic, { qos: 0 });
            console.log(`Subscribed to ${topic}`);
            setMessages((prevMessages) => ({
              ...prevMessages,
              [topic]: [],
            }));
          });
        },
        onFailure: (err) => {
          setIsConnected(false);
          setError(`Connection failed: ${err.errorMessage}`);
          setClient(null);
          console.error("Connect failed:", err);
        },
        useSSL: false,
      });
    } catch (e) {
      setError(`MQTT setup error: ${e.message}`);
      console.error("MQTT Setup Error:", e);
    }
  };

  const mqttDisconnect = () => {
    if (client) {
      client.disconnect();
      setIsConnected(false);
      setClient(null);
      console.log("Disconnected from MQTT broker");
    }
  };

  useEffect(() => {
    mqttConnect();
    return () => mqttDisconnect();
  }, []);

  return (
    <div className="mqtt-container">
      <h2 className="mqtt-title">MQTT Subscriber</h2>

      <div className="mqtt-status">
        <span className={isConnected ? "connected" : "disconnected"}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {error && <div className="mqtt-error">Error: {error}</div>}

      <div>
        <h3 className="mqtt-subtitle">Received Messages:</h3>
        {Object.entries(messages).length > 0 ? (
          Object.entries(messages).map(([topic, messageList]) => (
            <div key={topic} className="mqtt-topic">
              <h4 className="mqtt-topic-title">Topic: {topic}</h4>
              <ul className="mqtt-message-list">
                {messageList.map((msg, index) => (
                  <li key={index} className="mqtt-message-item">
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="mqtt-placeholder">No messages received yet.</p>
        )}
      </div>

      {!isConnected && (
        <button className="mqtt-button" onClick={mqttConnect}>
          Reconnect
        </button>
      )}
    </div>
  );
};

export default MQTTClient;
