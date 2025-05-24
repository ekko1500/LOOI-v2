// src/components/RobotControl.js
import React, { useEffect, useState } from "react";
import mqtt from "mqtt";

const MQTT_BROKER = "wss://broker.hivemq.com:8884/mqtt"; // Using HiveMQ over WebSocket
const ULTRASONIC_TOPIC = "robot/ultrasonic";
const COMMAND_TOPIC = "robot/command";

// CSS for the MQTT App
const styles = `
.mqtt-app {
    font-family: 'Arial', sans-serif;
    text-align: center;
    max-width: 90%;
    margin: 20px auto;
    background-color: #1e1e1e; /* Dark background */
    color: #e0e0e0; /* Light text */
}

.mqtt-title {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 2rem;
    color: #ffffff;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.mqtt-status {
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
}

.mqtt-connected {
    color: #2ecc71;
}

.mqtt-disconnected {
    color: #e74c3c;
}

.mqtt-error {
    color: #f28b82;
    background-color: #3b1f1f;
    border: 1px solid #e57373;
    border-radius: 8px;
    font-size: 1rem;
    padding: 1.2rem;
}

.mqtt-message {
    background-color: #263238;
    border: 1px solid #4fc3f7;
    border-radius: 8px;
    color: #81d4fa;
    font-size: 1rem;
    margin-bottom: 1.5rem;
    padding: 1.2rem;
}

.mqtt-command-groups {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.mqtt-card {
    background-color: #2c2c2c;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(255, 255, 255, 0.05);
    padding: 1.5rem;
    border: 1px solid #444;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.mqtt-card-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: #ffffff;
}

.mqtt-button {
    padding: 0.8rem 1.5rem;
    background-color: #1565c0;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1rem;
    transition: background-color 0.3s ease, transform 0.1s ease;
    margin-top: 0.75rem;
    width: 100%;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.mqtt-button:disabled {
    background-color: #455a64;
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
}

.mqtt-gamepad {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.mqtt-gamepad button {
    margin: 0.5rem;
    padding: 1rem;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #37474f;
    color: white;
    border: 1px solid #607d8b;
}

.mqtt-gamepad button svg {
    height: 24px;
    width: 24px;
}

.connect-disconnect-button {
    margin-top: 2rem;
    padding: 0.8rem 2rem;
    font-size: 1.2rem;
    border-radius: 8px;
    font-weight: 500;
    background-color: #1b5e20;
    color: white;
    border: none;
}

.alert {
    padding: 1.2rem;
    margin-bottom: 1.5rem;
    border-radius: 8px;
    border: 1px solid transparent;
    font-size: 1rem;
    background-color: #2e2e2e;
    color: #f0f0f0;
}

.alert-title {
    font-size: 1.4rem;
    font-weight: bold;
    margin-bottom: 0.75rem;
    color: #f0f0f0;
}

.alert-description {
    font-size: 1.1rem;
    margin-bottom: 0;
    color: #cccccc;
}

.alert-destructive {
    background-color: #c62828;
    color: white;
    border-color: #c62828;
}

.alert-circle {
    height: 1.5rem;
    width: 1.5rem;
    margin-right: 0.75rem;
    display: inline-block;
    vertical-align: middle;
}

.flex {
    display: flex;
    align-items: center;
}

.items-center {
    align-items: center;
}

.justify-center {
    justify-content: center;
}

.max-w-lg {
    max-width: 32rem;
}

.w-full {
    width: 100%;
}

.absolute {
    position: absolute;
}

.top-2 {
    top: 0.5rem;
}

.right-2 {
    right: 0.5rem;
}

.text-green-500 {
    color: #2ecc71;
}

.text-red-500 {
    color: #e74c3c;
}

.font-semibold {
    font-weight: 600;
}

.space-y-4 > * + * {
    margin-top: 1.5rem;
}

.mt-8 {
    margin-top: 2rem;
}

.mb-2 {
    margin-bottom: 0.5rem;
}

.mr-2 {
    margin-right: 0.5rem;
}

.mx-2 {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
}

.ml-2 {
    margin-left: 0.5rem;
}

`;

const RobotControl = () => {
  const [client, setClient] = useState(null);
  const [ultrasonicData, setUltrasonicData] = useState("");
  const [motorSpeed, setMotorSpeed] = useState(150);
  const [motorDir, setMotorDir] = useState("forward");

  useEffect(() => {
    const mqttClient = mqtt.connect(MQTT_BROKER);
    setClient(mqttClient);

    mqttClient.on("connect", () => {
      console.log("Connected to MQTT broker");
      mqttClient.subscribe(ULTRASONIC_TOPIC);
    });

    mqttClient.on("message", (topic, message) => {
      if (topic === ULTRASONIC_TOPIC) {
        setUltrasonicData(message.toString());
      }
    });

    return () => mqttClient.end();
  }, []);

  const sendCommand = (command) => {
    if (client) {
      client.publish(COMMAND_TOPIC, command);
      console.log("Sent command:", command);
    }
  };

  const handleMotorCommand = () => {
    const direction = motorDir === "forward" ? "1" : "-1";
    sendCommand(`MOTOR1${motorDir.charAt(0).toUpperCase()}${motorSpeed}`);
  };

  const handleRelayToggle = (relayNum, state) => {
    sendCommand(`RELAY${relayNum}${state ? "ON" : "OFF"}`);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Robot Controller</h1>

      <div style={{ marginBottom: "2rem" }}>
        <h3>Ultrasonic Sensor Data</h3>
        <p>{ultrasonicData}</p>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h3>Pick Egg</h3>
        <button onClick={() => sendCommand("PICK")}>Pick Egg</button>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h3>Motor 1 Control</h3>
        <label>
          Direction:
          <select
            value={motorDir}
            onChange={(e) => setMotorDir(e.target.value)}
          >
            <option value="forward">Forward</option>
            <option value="backward">Backward</option>
          </select>
        </label>
        <br />
        <label>
          Speed: {motorSpeed}
          <input
            type="range"
            min="0"
            max="255"
            value={motorSpeed}
            onChange={(e) => setMotorSpeed(Number(e.target.value))}
          />
        </label>
        <br />
        <button onClick={handleMotorCommand}>Send Motor Command</button>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h3>Relay Control</h3>
        {[1, 2, 3].map((num) => (
          <div key={num}>
            <button onClick={() => handleRelayToggle(num, true)}>
              Relay {num} ON
            </button>
            <button onClick={() => handleRelayToggle(num, false)}>
              Relay {num} OFF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RobotControl;
