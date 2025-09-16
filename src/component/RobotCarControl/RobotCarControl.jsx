import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import "../../App.css";

const MQTT_BROKER = "wss://test.mosquitto.org:8081/mqtt";
const MQTT_COMMAND_TOPIC = "robot/command";
const MQTT_STATUS_TOPIC = "robot/status";

const IOTCommandApp = () => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [sensorData, setSensorData] = useState({});

  // Connect to MQTT
  useEffect(() => {
    console.log("Connecting to MQTT broker:", MQTT_BROKER);

    const mqttClient = mqtt.connect(MQTT_BROKER);
    setClient(mqttClient);

    mqttClient.on("connect", () => {
      console.log("✅ Connected to MQTT broker");
      setIsConnected(true);
      mqttClient.subscribe(MQTT_STATUS_TOPIC);
      console.log("📡 Subscribed to topic:", MQTT_STATUS_TOPIC);
      setMessage("Connected to MQTT broker");
    });

    mqttClient.on("message", (topic, message) => {
      const msg = message.toString();
      console.log("📨 Received message - Topic:", topic, "Message:", msg);

      if (topic === MQTT_STATUS_TOPIC) {
        try {
          const data = JSON.parse(msg);
          setSensorData(data);
          console.log("📊 Sensor data received:", data);
          setMessage(`Sensor data: ${JSON.stringify(data)}`);
        } catch (error) {
          console.error("❌ Failed to parse JSON:", msg);
          setMessage(`Raw data: ${msg}`);
        }
      }
    });

    mqttClient.on("error", (err) => {
      console.error("❌ MQTT error:", err);
      setMessage(`Error: ${err.message}`);
    });

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  const sendCommand = (command) => {
    console.log("🔄 sendCommand called with:", command);

    if (!client) {
      console.error("❌ MQTT client is not initialized.");
      setMessage("MQTT client not initialized");
      return;
    }

    if (!isConnected) {
      console.error("❌ MQTT is not connected.");
      setMessage("Not connected to MQTT");
      return;
    }

    try {
      console.log(
        "📤 Publishing command:",
        command,
        "to topic:",
        MQTT_COMMAND_TOPIC
      );
      client.publish(MQTT_COMMAND_TOPIC, command);
      console.log("✅ Command sent successfully:", command);
      setMessage(`Sent: ${command}`);
    } catch (err) {
      console.error("❌ Failed to send command:", err);
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="playstation-container">
      <h1>Robot Control Panel</h1>

      <div className="status-indicator">
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? "✅ CONNECTED" : "❌ DISCONNECTED"}
        </div>
      </div>

      {message && (
        <div className="message-display">
          {message}
        </div>
      )}

      {/* Sensor Data Display */}
      {sensorData && (
        <div className="sensor-data">
          <h3>Sensor Data from {sensorData.slave || "unknown"}:</h3>
          <div className="sensor-readings">
            <div>d1: {sensorData.d1 || "N/A"}</div>
            <div>d2: {sensorData.d2 || "N/A"}</div>
            <div>d3: {sensorData.d3 || "N/A"}</div>
          </div>
        </div>
      )}

      <div className="controller-layout">
        {/* Left Side - D-Pad for Movement */}
        <div className="control-section movement-controls">
          <h2>Movement Controls</h2>
          <div className="d-pad">
            <div className="d-pad-row">
              <div className="d-pad-placeholder"></div>
              <button 
                className="d-pad-button up"
                onClick={() => sendCommand("8|F")}
              >
                ↑
              </button>
              <div className="d-pad-placeholder"></div>
            </div>
            <div className="d-pad-row">
              <button 
                className="d-pad-button left"
                onClick={() => sendCommand("8|L")}
              >
                ←
              </button>
              <div className="d-pad-center"></div>
              <button 
                className="d-pad-button right"
                onClick={() => sendCommand("8|R")}
              >
                →
              </button>
            </div>
            <div className="d-pad-row">
              <div className="d-pad-placeholder"></div>
              <button 
                className="d-pad-button down"
                onClick={() => sendCommand("8|B")}
              >
                ↓
              </button>
              <div className="d-pad-placeholder"></div>
            </div>
          </div>
          <button 
            className="stop-button"
            onClick={() => sendCommand("8|S")}
          >
            STOP
          </button>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="control-section action-controls">
          <h2>Action Controls</h2>
          
          {/* Relay Controls */}
          <div className="relay-buttons">
            <h3>Relays</h3>
            <div className="button-row">
              <div className="button-pair">
                <button 
                  className="relay-button on"
                  onClick={() => sendCommand("8|1")}
                >
                  R1 ON
                </button>
                <button 
                  className="relay-button off"
                  onClick={() => sendCommand("8|Q")}
                >
                  R1 OFF
                </button>
              </div>
              <div className="button-pair">
                <button 
                  className="relay-button on"
                  onClick={() => sendCommand("8|2")}
                >
                  R2 ON
                </button>
                <button 
                  className="relay-button off"
                  onClick={() => sendCommand("8|W")}
                >
                  R2 OFF
                </button>
              </div>
            </div>
            <div className="button-row">
              <div className="button-pair">
                <button 
                  className="relay-button on"
                  onClick={() => sendCommand("8|3")}
                >
                  R3 ON
                </button>
                <button 
                  className="relay-button off"
                  onClick={() => sendCommand("8|E")}
                >
                  R3 OFF
                </button>
              </div>
              <div className="button-pair">
                <button 
                  className="relay-button on"
                  onClick={() => sendCommand("8|4")}
                >
                  R4 ON
                </button>
                <button 
                  className="relay-button off"
                  onClick={() => sendCommand("8|T")}
                >
                  R4 OFF
                </button>
              </div>
            </div>
            <div className="button-row">
              <div className="button-pair">
                <button 
                  className="relay-button on"
                  onClick={() => sendCommand("8|5")}
                >
                  R5 ON
                </button>
                <button 
                  className="relay-button off"
                  onClick={() => sendCommand("8|Y")}
                >
                  R5 OFF
                </button>
              </div>
              <div className="button-pair">
                <button 
                  className="relay-button on"
                  onClick={() => sendCommand("8|6")}
                >
                  R6 ON
                </button>
                <button 
                  className="relay-button off"
                  onClick={() => sendCommand("8|U")}
                >
                  R6 OFF
                </button>
              </div>
            </div>
          </div>

          {/* Arm Controls */}
          <div className="arm-buttons">
            <h3>Arm Controls</h3>
            <div className="button-row">
              <button 
                className="arm-button pick"
                onClick={() => sendCommand("9|P")}
              >
                PICK
              </button>
              <button 
                className="arm-button home"
                onClick={() => sendCommand("9|H")}
              >
                HOME
              </button>
              <button 
                className="arm-button buzzer"
                onClick={() => sendCommand("9|K")}
              >
                BUZZER
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Info */}
      <div className="connection-info">
        <h3>Connection Information</h3>
        <div className="info-grid">
          <div>Broker:</div>
          <div>{MQTT_BROKER}</div>
          <div>Command Topic:</div>
          <div>{MQTT_COMMAND_TOPIC}</div>
          <div>Status Topic:</div>
          <div>{MQTT_STATUS_TOPIC}</div>
          <div>Format:</div>
          <div>"slave|command" (e.g., "8|F", "9|P")</div>
        </div>
      </div>

      {/* Debug Tip */}
      <div className="debug-tip">
        <strong>💡 Debug Tip:</strong> Open browser console (F12) to see detailed debug messages!
      </div>
    </div>
  );
};

export default IOTCommandApp;