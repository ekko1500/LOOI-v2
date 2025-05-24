import React, { useState } from "react";
import "./Menu.css";
import RobotCarControl from "../RobotCarControl/RobotCarControl";

const Menu = ({ onSelectComponent }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "google-voice", name: "Google Voice Assistant" },
    // { id: "together-chat", name: "Together AI Chat" },
    // { id: "together-tts", name: "Together TTS" },
    // { id: "google-tts", name: "Google TTS" },
    // { id: "tts-component", name: "TTS Component" },
    // { id: "face-display", name: "Face Display" },
    // { id: "face-display-tts", name: "Face Display (Web TTS)" },
    { id: "robot-car", name: "Robot Car Control" },
    { id: "mqtt-client", name: "MQTT Client" },
    { id: "ipcam-viewer", name: "IP Cam Viewer" },
  ];

  const handleItemClick = (id) => {
    onSelectComponent(id);
    setIsOpen(false);
  };

  return (
    <div className="menu-container">
      <button className="menu-button" onClick={() => setIsOpen(!isOpen)}>
        Menu ☰
      </button>
      {isOpen && (
        <div className="menu-dropdown">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="menu-item"
              onClick={() => handleItemClick(item.id)}
            >
              {item.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;
