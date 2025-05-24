import "./App.css";
import Chatbot from "./component/Chatbot/Chatbot";
import GgleTTSVoice from "./component/GgleTTSVoice/GgleTTSVoice";
import GoogleTTS from "./component/GoogleTTS/GoogleTTS";
import TogetherChatbot from "./component/Together/Together";
import TogetherTTS from "./component/TogetherTTS/TogetherTTS";
import TTSComponent from "./component/TTSComponent";
import FaceDisplay from "./component/FaceDisplay/FaceDisplay";
import FaceDisplayTTS from "./component/FaceDisplayTTS/FaceDisplayTTS";
import Menu from "./component/Menu/Menu";
import RobotCarControl from "./component/RobotCarControl/RobotCarControl";
import { useState } from "react";
import MQTTClient from "./component/MQTTListener/MQTTListener";
import IPCameraViewer from "./component/IPCameraViewer/IPCameraViewer";
import RoboticArmDashboard from "./component/RoboticArmDashboard/RoboticArmDashboard";

function App() {
  const [selectedComponent, setSelectedComponent] = useState(null);

  // { id: "mqtt-client", name: "MQTT Client" },
  // { id: "ipcam-viewer", name: "IP Cam Viewer" },

  const renderComponent = () => {
    switch (selectedComponent) {
      case "google-voice":
        return <GgleTTSVoice />;
      case "together-chat":
        return <TogetherChatbot />;
      case "together-tts":
        return <TogetherTTS />;
      case "google-tts":
        return <GoogleTTS />;
      case "tts-component":
        return <TTSComponent />;
      case "face-display":
        return <FaceDisplay />;
      case "face-display-tts":
        return <FaceDisplayTTS />;
      case "robot-car":
        return <RobotCarControl />;
      case "mqtt-client":
        return <MQTTClient />;
      case "ipcam-viewer":
        return <IPCameraViewer />;
      default:
        return <GgleTTSVoice />;
    }
  };

  return (
    <div className="App dark-theme">
      <Menu onSelectComponent={setSelectedComponent} />

      {renderComponent()}
      {/* <RoboticArmDashboard /> */}
    </div>
  );
}

export default App;
