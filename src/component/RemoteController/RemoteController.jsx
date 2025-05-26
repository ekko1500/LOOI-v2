import React, { useState, useEffect, useCallback } from "react";
import "./RemoteController.css";

// MQTT config
const MQTT_URL = "broker.hivemq.com";
const MQTT_PORT = 8000;
const MQTT_COMMAND_TOPIC = "robot/command";
const MQTT_RESPONSE_TOPIC = "robot/status";

export default function RemoteController() {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [pahoReady, setPahoReady] = useState(false);

  // Dynamically load the Paho MQTT library
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js";
    script.async = true;
    script.onload = () => setPahoReady(true);
    script.onerror = () => {
      setError("Failed to load Paho MQTT library.");
      setPahoReady(false);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Connect to MQTT Broker
  const connectClient = useCallback(() => {
    if (!window.Paho || !pahoReady) {
      setError("Paho MQTT not ready.");
      return;
    }

    const mqttClient = new window.Paho.MQTT.Client(
      MQTT_URL,
      MQTT_PORT,
      `react-client-${Math.random().toString(16).substr(2, 8)}`
    );

    mqttClient.onConnectionLost = () => {
      setIsConnected(false);
      setError("MQTT connection lost.");
      setClient(null);
    };

    mqttClient.onMessageArrived = (msg) => {
      setMessage(`Received: ${msg.payloadString}`);
    };

    mqttClient.connect({
      onSuccess: () => {
        setIsConnected(true);
        setClient(mqttClient);
        mqttClient.subscribe(MQTT_RESPONSE_TOPIC);
        setError("");
      },
      onFailure: (err) => {
        setError(`Connection failed: ${err.errorMessage}`);
        setIsConnected(false);
      },
      useSSL: false,
    });
  }, [pahoReady]);

  const disconnectClient = () => {
    if (client && typeof client.disconnect === "function") {
      client.disconnect();
    }
    setIsConnected(false);
    setClient(null);
  };

  useEffect(() => {
    if (pahoReady) {
      connectClient();
    }
    return () => disconnectClient();
  }, [connectClient, pahoReady]);

  const sendCommand = (command) => {
    if (!client || !isConnected) {
      setError("MQTT client not ready or not connected.");
      return;
    }

    try {
      const message = new window.Paho.MQTT.Message(command);
      message.destinationName = MQTT_COMMAND_TOPIC;
      client.send(message);
      setMessage(`Sent: ${command}`);
    } catch (err) {
      setError(`Failed to send command: ${err.message}`);
    }
  };

  return (
    <div className="remote-container">
      {/* Left Side Controls */}
      <div className="left-panel">
        <div className="direction-grid">
          <div></div>
          <button className="direction-btn" onClick={() => sendCommand("8|F")}>
            Forward
          </button>
          <div></div>

          <button className="direction-btn" onClick={() => sendCommand("8|L")}>
            Left
          </button>
          <div></div>
          <button className="direction-btn" onClick={() => sendCommand("8|R")}>
            Right
          </button>

          <div></div>
          <button className="direction-btn" onClick={() => sendCommand("8|B")}>
            Backward
          </button>
          <div></div>
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="right-panel">
        <button
          className="control-btn brake"
          onClick={() => sendCommand("8|S")}
        >
          Brake
        </button>
        <button className="control-btn stop" onClick={() => sendCommand("8|N")}>
          Stop
        </button>
        <button
          className="control-btn start"
          onClick={() => sendCommand("8|Y")}
        >
          Start
        </button>
      </div>

      {/* Status */}
      <div
        style={{ position: "absolute", bottom: "20px", textAlign: "center" }}
      >
        <div style={{ color: isConnected ? "green" : "red" }}>
          MQTT: {isConnected ? "Connected" : "Disconnected"}
        </div>
        {error && <div style={{ color: "red" }}>{error}</div>}
        {message && <div style={{ color: "blue" }}>{message}</div>}
      </div>
    </div>
  );
}
