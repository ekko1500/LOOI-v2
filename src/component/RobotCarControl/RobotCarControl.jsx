import React, { useState, useEffect, useCallback } from "react";
import mqtt from "mqtt";

// MQTT URL
const MQTT_BROKER = "wss://broker.hivemq.com:8884/mqtt";
const ULTRASONIC_TOPIC = "robot/status";
const MQTT_URL = "broker.hivemq.com";
const MQTT_PORT = 8000;
const MQTT_COMMAND_TOPIC = "robot/command";
const MQTT_RESPONSE_TOPIC = "robot/status";

// Define the command list
const COMMANDS = {
  general: [
    { name: "Sweep", command: "8|Y", description: "Starts sweeping motion." },
  ],
  car: [
    { name: "Stop", command: "S", description: "Stop Moveent" },
    { name: "Forward", command: "F", description: "Moves forward." },
    { name: "Backward", command: "B", description: "Moves backward." },
    { name: "Left", command: "L", description: "Turns left." },
    { name: "Right", command: "R", description: "Turns right." },
  ],
  waterTank: [
    {
      name: "Get Status",
      command: "status",
      description: "Requests water levels.",
    },
    { name: "Pump 1 On", command: "8|1", description: "Turns on pump 1." },
    {
      name: "Pump 1 Off",
      command: "8|Q",
      description: "Turns off pump 1.",
    },
    { name: "Pump 2 On", command: "8|2", description: "Turns on pump 2." },
    {
      name: "Pump 2 Off",
      command: "8|W",
      description: "Turns off pump 2.",
    },

    { name: "Fan On", command: "8|3", description: "Turns on the fan." },
    {
      name: "Fan Off",
      command: "8|E",
      description: "Turns off the fan.",
    },
  ],
};

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

const IOTCommandApp = () => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [pahoReady, setPahoReady] = useState(false);

  const [ultrasonicData, setUltrasonicData] = useState("{}");

  const [waterTank1DistanceCm, setWaterTank1DistanceCm] = useState(50); // Distance from sensor to water surface (cm)
  const [waterTank2DistanceCm, setWaterTank2DistanceCm] = useState(70); // Distance from sensor to water surface (cm)
  const [distanceSensorCm, setDistanceSensorCm] = useState(150); // General distance sensor (cm)

  const MAX_TANK_HEIGHT_CM = 100; // Example: 100 cm tall tank

  // Function to calculate water level percentage
  // distanceCm: distance from the sensor (at the top of the tank) to the water surface
  const calculateWaterLevelPercentage = (distanceCm) => {
    // If distance is less than 0, it means water is above the sensor, so 100%
    if (distanceCm <= 0) return 100;
    // If distance is greater than or equal to tank height, tank is empty (0%)
    if (distanceCm >= MAX_TANK_HEIGHT_CM) return 0;

    // Water level is MAX_TANK_HEIGHT_CM - distanceCm
    const waterLevel = MAX_TANK_HEIGHT_CM - distanceCm;
    return Math.max(0, Math.min(100, (waterLevel / MAX_TANK_HEIGHT_CM) * 100));
  };

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
        console.log("Ultrasonic Data:", JSON.parse(message.toString()));
      }
    });

    return () => mqttClient.end();
  }, []);

  // Simulate sensor data updates using useEffect and setInterval
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate fluctuations for Water Tank 1 (e.g., filling/draining slowly)
      setWaterTank1DistanceCm((prev) => {
        const change = (Math.random() - 0.5) * 5; // Random change between -2.5 and +2.5 cm
        return Math.max(0, Math.min(MAX_TANK_HEIGHT_CM + 10, prev + change)); // Keep within reasonable bounds
      });

      // Simulate fluctuations for Water Tank 2
      setWaterTank2DistanceCm((prev) => {
        const change = (Math.random() - 0.5) * 7; // Random change between -3.5 and +3.5 cm
        return Math.max(0, Math.min(MAX_TANK_HEIGHT_CM + 10, prev + change));
      });

      // Simulate fluctuations for general distance sensor
      setDistanceSensorCm((prev) => {
        const change = (Math.random() - 0.5) * 20; // Random change between -10 and +10 cm
        return Math.max(10, Math.min(300, prev + change)); // Keep within 10-300 cm range
      });
    }, 2000); // Update every 2 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const waterTank1Level = calculateWaterLevelPercentage(waterTank1DistanceCm);
  const waterTank2Level = calculateWaterLevelPercentage(waterTank2DistanceCm);

  // Helper function to get text color based on level
  const getLevelTextColor = (level) => {
    if (level < 20) return "red"; // Low level
    if (level < 50) return "orange"; // Medium level
    return "green"; // High level
  };

  // Dynamically load the Paho MQTT library
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js";
    script.async = true;
    script.onload = () => {
      setPahoReady(true);
    };
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
    if (client) {
      client.disconnect();
      setIsConnected(false);
      setClient(null);
    }
  };

  useEffect(() => {
    if (pahoReady) {
      connectClient();
    }
    return () => disconnectClient();
  }, [connectClient, pahoReady]);

  const sendCommand = (command) => {
    if (!client || !isConnected) {
      setError("MQTT is not connected.");
      return;
    }
    const message = new window.Paho.MQTT.Message(command);
    message.destinationName = MQTT_COMMAND_TOPIC;
    client.send(message);
    setMessage(`Sent: ${command}`);
  };

  const RobotCarControl = () => {
    setMessage(null);
  };

  // Inject CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = styles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Gamepad UI for Car Control
  const renderCarGamepad = () => {
    return (
      <div className="mqtt-gamepad">
        <button
          className="mqtt-button mb-2"
          onClick={() => sendCommand("8|F")}
          disabled={!isConnected}
          title="Forward"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M12 19V6M5 12l7-7 7 7" />
          </svg>
        </button>
        <div className="flex">
          <button
            className="mqtt-button mr-2"
            onClick={() => sendCommand("8|L")}
            disabled={!isConnected}
            title="Left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="mqtt-button mx-2"
            onClick={() => sendCommand("8|B")}
            disabled={!isConnected}
            title="Backward"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
          <button
            className="mqtt-button ml-2"
            onClick={() => sendCommand("8|R")}
            disabled={!isConnected}
            title="Right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M5 12h14m-7 7l7-7-7-7" />
            </svg>
          </button>
        </div>
        <button
          className="mqtt-button mt-2 "
          onClick={() => sendCommand("8|S")}
          disabled={!isConnected}
          title="Stop"
          style={{
            fontSize: "15px",
          }}
        >
          Stop
        </button>
        <button
          className="mqtt-button mt-4"
          onClick={() => sendCommand("9|P")}
          disabled={!isConnected}
          title="Sweep"
          style={{
            fontSize: "15px",
          }}
        >
          Pick
        </button>
      </div>
    );
  };

  return (
    <>
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

      

        .dashboard-card {
          margin-top: 2rem; /* mt-8 */
          border-radius: 0.75rem; /* rounded-xl */
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* shadow-2xl */
          padding: 1.5rem; /* p-6 */
        }

        @media (min-width: 768px) { /* md breakpoint */
          .dashboard-card {
            padding: 2rem; /* md:p-8 */
          }
          .dashboard-title {
            font-size: 2.25rem; /* md:text-4xl */
          }
          .sensor-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)); /* md:grid-cols-3 */
          }
        }

        .dashboard-title {
          font-size: 1.875rem; /* text-3xl */
          font-weight: 800; /* font-extrabold */
          margin-bottom: 2rem; /* mb-8 */
          text-align: center;
        }

        .sensor-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);

          gap: 1.5rem; /* gap-6 */
        }

        .sensor-card {
          border: 1px solid #e5e7eb; /* border-gray-200 */
          border-radius: 0.5rem; /* rounded-lg */
          padding: 1.5rem; /* p-6 */
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-md */
          transition: box-shadow 0.3s ease-in-out; /* transition-shadow duration-300 */
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .sensor-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* hover:shadow-lg */
        }

        .sensor-card-title {
          font-size: 1.25rem; /* text-xl */
          font-weight: 600; /* font-semibold */
          margin-bottom: 0.75rem; /* mb-3 */
        }

        .sensor-card-value {
          font-size: 3rem; /* text-5xl */
          font-weight: 700; /* font-bold */
          margin-bottom: 0.5rem; /* mb-2 */
        }

        .sensor-card-sub-value {
          font-size: 1rem; /* text-md */
          color: #6b7280; /* text-gray-500 */
          margin-bottom: 1rem; /* mb-4 */
        }

        .progress-bar-container {
          width: 100%;
          background-color: #e5e7eb; /* bg-gray-200 */
          border-radius: 9999px; /* rounded-full */
          height: 1rem; /* h-4 */
          margin-bottom: 1rem; /* mb-4 */
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 9999px; /* rounded-full */
          transition: width 0.5s ease-out; /* transition-all duration-500 ease-out */
        }

        .sensor-icon-text {
          color: #9ca3af; /* text-gray-400 */
          font-size: 0.875rem; /* text-sm */
          margin-top: auto; /* mt-auto */
          display: flex;
          align-items: center;
        }

        .sensor-icon {
          height: 1.5rem; /* h-6 */
          width: 1.5rem; /* w-6 */
          display: inline-block;
          margin-right: 0.5rem; /* mr-2 */
        }

        .footer-text {
          font-size: 0.875rem; /* text-sm */
          color: #6b7280; /* text-gray-500 */
          margin-top: 2rem; /* mt-8 */
          text-align: center;
        }
        `}
      </style>
      <div className="mqtt-app">
        <h1 className="mqtt-title">IOT Control Panel</h1>

        {/* Connection Status */}
        <div className="mqtt-status">
          Status:{" "}
          <strong
            className={isConnected ? "mqtt-connected" : "mqtt-disconnected"}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </strong>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mqtt-message">
            <p>{message}</p>
            <button variant="outline" size="sm" onClick={RobotCarControl}>
              Clear
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mqtt-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="alert-circle h-4 w-4"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* Command Groups */}
        <div className="mqtt-command-groups">
          {Object.entries(COMMANDS).map(([groupName, commands]) => {
            if (groupName === "car") {
              return (
                <div className="mqtt-card" key={groupName}>
                  <h2 className="mqtt-card-title">Car Control</h2>
                  {renderCarGamepad()}
                </div>
              );
            }
            return (
              <div className="mqtt-card" key={groupName}>
                <h2 className="mqtt-card-title">
                  {groupName.charAt(0).toUpperCase() + groupName.slice(1)}{" "}
                  Commands
                </h2>
                <div className="space-y-4">
                  {commands.map((cmd) => (
                    <button
                      key={cmd.command}
                      className="mqtt-button"
                      onClick={() => sendCommand(cmd.command)}
                      disabled={!isConnected}
                      title={cmd.description}
                    >
                      {cmd.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center">
          {isConnected ? (
            <button
              variant="destructive"
              onClick={disconnectClient}
              className="connect-disconnect-button"
            >
              Disconnect
            </button>
          ) : (
            <button
              variant="outline"
              onClick={connectClient}
              className="connect-disconnect-button"
              disabled={!pahoReady}
            >
              Connect
            </button>
          )}
        </div>

        <div className="dashboard-card">
          <h1 className="dashboard-title">Ultrasonic Sensor Dashboard</h1>

          <div className="sensor-grid">
            <SensorCard title="1" distance={JSON.parse(ultrasonicData).d1} />
            <SensorCard title="2" distance={JSON.parse(ultrasonicData).d2} />
            <SensorCard title="3" distance={JSON.parse(ultrasonicData).d3} />
          </div>

          <p className="footer-text">
            *Sensor readings are simulated and update every 2 seconds.
          </p>
        </div>
      </div>
    </>
  );
};

export default IOTCommandApp;

// Reusable SensorCard component for displaying individual sensor data
const SensorCard = ({ distance, title = "1" }) => {
  // Calculate water level percentage (7cm = 100%)
  const level = Math.min(Math.max(0, ((7 - distance) / 7) * 100), 100);

  // Determine color based on level
  const getColor = (level) => {
    if (level < 20) return "#ef4444"; // red-500
    if (level < 50) return "#f59e0b"; // amber-500
    return "#22c55e"; // green-500
  };

  return (
    <div className="sensor-card">
      <h2 className="sensor-card-title">
        {title === "1"
          ? "Water Tank 1"
          : title == "2"
          ? "Water Tank 2"
          : "Distance Sensor"}
      </h2>
      <p className="sensor-card-value" style={{ color: getColor(level) }}>
        {distance} cm
      </p>
      <p className="sensor-card-sub-value">
        {level.toFixed(0)}
        {title == "3" ? "" : "% full"}
      </p>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{
            width: `${level}%`,
            backgroundColor: getColor(level),
          }}
        ></div>
      </div>

      <div className="sensor-icon-text">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="sensor-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8c1.622 0 3.104.561 4.25 1.503l-1.5 1.5a5.002 5.002 0 00-5.5 0l-1.5-1.5A7.002 7.002 0 0112 8z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 14c-1.622 0-3.104-.561-4.25-1.503l-1.5-1.5a5.002 5.002 0 00-5.5 0l-1.5-1.5A7.002 7.002 0 0112 14z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 20c-1.622 0-3.104-.561-4.25-1.503l-1.5-1.5a5.002 5.002 0 00-5.5 0l-1.5-1.5A7.002 7.002 0 0112 20z"
          />
        </svg>
        {title === "1"
          ? "Water Level Sensor"
          : title == "2"
          ? "Water Level Sensor"
          : "Distance Sensor"}
      </div>
    </div>
  );
};
