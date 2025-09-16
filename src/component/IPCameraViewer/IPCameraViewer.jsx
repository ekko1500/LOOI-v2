import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import "../../App.css";

const MQTT_BROKER = "wss://test.mosquitto.org:8081/mqtt";
const MQTT_COMMAND_TOPIC = "robot/command";
const MQTT_STATUS_TOPIC = "robot/status";

const IPCameraViewer = () => {
  const [ip, setIp] = useState("192.168.90.55");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectionInfo, setShowConnectionInfo] = useState(false);

  // Connect to MQTT
  useEffect(() => {
    console.log("Connecting to MQTT broker:", MQTT_BROKER);

    const mqttClient = mqtt.connect(MQTT_BROKER);
    setClient(mqttClient);

    mqttClient.on("connect", () => {
      console.log("✅ Connected to MQTT broker");
      setIsConnected(true);
      mqttClient.subscribe(MQTT_STATUS_TOPIC);
    });

    mqttClient.on("error", (err) => {
      console.error("❌ MQTT error:", err);
    });

    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  const sendCommand = (command) => {
    if (!client || !isConnected) return;

    try {
      client.publish(MQTT_COMMAND_TOPIC, command);
    } catch (err) {
      console.error("❌ Failed to send command:", err);
    }
  };

  const handleConnect = () => {
    if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      setError("Please enter a valid IP address");
      setUrl("");
      return;
    }

    const streamUrl = `http://${ip}:8080/video`;
    setUrl(streamUrl);
    setError("");
  };

  return (
    <div className="camera-background-container">
      {/* Connection UI */}
      {!url && (
        <div className="connection-screen">
          <div className="connection-form">
            <h1>Robot Camera Control</h1>
            <input
              type="text"
              placeholder="Enter Camera IP (e.g. 192.168.252.7)"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="camera-input"
            />
            <button onClick={handleConnect} className="connect-button">
              Connect Camera
            </button>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      )}

      {/* Camera Background with Overlay Controls */}
      {url && (
        <div className="camera-background">
          <img
            src={url}
            alt="Live Stream"
            onError={() => {
              setError("Unable to load video. Check the IP and try again.");
              setUrl("");
            }}
          />
          
          {/* Connection Status */}
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              MQTT: {isConnected ? '✅' : '❌'}
            </span>
            <button 
              className="info-toggle"
              onClick={() => setShowConnectionInfo(!showConnectionInfo)}
            >
              ⓘ
            </button>
          </div>

          {/* Connection Info Panel */}
          {showConnectionInfo && (
            <div className="info-panel">
              <h3>Connection Info</h3>
              <div className="info-grid">
                <div>Broker:</div>
                <div>{MQTT_BROKER}</div>
                <div>Command Topic:</div>
                <div>{MQTT_COMMAND_TOPIC}</div>
                <div>Status Topic:</div>
                <div>{MQTT_STATUS_TOPIC}</div>
                <div>Camera URL:</div>
                <div>{url}</div>
              </div>
              <button 
                className="close-info"
                onClick={() => setShowConnectionInfo(false)}
              >
                ×
              </button>
            </div>
          )}

          {/* Movement Controls - Left Side */}
          <div className="control-group movement-controls">
            <div className="d-pad">
              <button 
                className="control-btn d-pad-up"
                onClick={() => sendCommand("8|F")}
              >
                ↑
              </button>
              <div className="d-pad-middle">
                <button 
                  className="control-btn d-pad-left"
                  onClick={() => sendCommand("8|L")}
                >
                  ←
                </button>
                <div className="d-pad-center"></div>
                <button 
                  className="control-btn d-pad-right"
                  onClick={() => sendCommand("8|R")}
                >
                  →
                </button>
              </div>
              <button 
                className="control-btn d-pad-down"
                onClick={() => sendCommand("8|B")}
              >
                ↓
              </button>
            </div>
            <button 
              className="control-btn stop-btn"
              onClick={() => sendCommand("8|S")}
            >
              STOP
            </button>
          </div>

          {/* Relay Controls - Right Side */}
          <div className="control-group relay-controls">
            <div className="relay-grid">
              {/* Relay 1 */}
              <div className="relay-pair">
                <button 
                  className="control-btn relay-on"
                  onClick={() => sendCommand("8|1")}
                >
                  R1 ON
                </button>
                <button 
                  className="control-btn relay-off"
                  onClick={() => sendCommand("8|Q")}
                >
                  R1 OFF
                </button>
              </div>
              
              {/* Relay 2 */}
              <div className="relay-pair">
                <button 
                  className="control-btn relay-on"
                  onClick={() => sendCommand("8|2")}
                >
                  R2 ON
                </button>
                <button 
                  className="control-btn relay-off"
                  onClick={() => sendCommand("8|W")}
                >
                  R2 OFF
                </button>
              </div>
              
              {/* Relay 3 */}
              <div className="relay-pair">
                <button 
                  className="control-btn relay-on"
                  onClick={() => sendCommand("8|3")}
                >
                  R3 ON
                </button>
                <button 
                  className="control-btn relay-off"
                  onClick={() => sendCommand("8|E")}
                >
                  R3 OFF
                </button>
              </div>
              
              {/* Relay 4 */}
              <div className="relay-pair">
                <button 
                  className="control-btn relay-on"
                  onClick={() => sendCommand("8|4")}
                >
                  R4 ON
                </button>
                <button 
                  className="control-btn relay-off"
                  onClick={() => sendCommand("8|T")}
                >
                  R4 OFF
                </button>
              </div>
              
              {/* Relay 5 */}
              <div className="relay-pair">
                <button 
                  className="control-btn relay-on"
                  onClick={() => sendCommand("8|5")}
                >
                  R5 ON
                </button>
                <button 
                  className="control-btn relay-off"
                  onClick={() => sendCommand("8|Y")}
                >
                  R5 OFF
                </button>
              </div>
              
              {/* Relay 6 */}
              <div className="relay-pair">
                <button 
                  className="control-btn relay-on"
                  onClick={() => sendCommand("8|6")}
                >
                  R6 ON
                </button>
                <button 
                  className="control-btn relay-off"
                  onClick={() => sendCommand("8|U")}
                >
                  R6 OFF
                </button>
              </div>
            </div>
          </div>

          {/* Arm Controls - Bottom Center */}
          <div className="control-group arm-controls">
            <button 
              className="control-btn arm-pick"
              onClick={() => sendCommand("9|P")}
            >
              PICK
            </button>
            <button 
              className="control-btn arm-home"
              onClick={() => sendCommand("9|H")}
            >
              HOME
            </button>
            <button 
              className="control-btn arm-buzzer"
              onClick={() => sendCommand("9|K")}
            >
              BUZZER
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPCameraViewer;