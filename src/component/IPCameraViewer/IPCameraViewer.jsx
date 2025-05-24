import React, { useState } from "react";
import "./IPCameraViewer.css";

const IPCameraViewer = () => {
  const [ip, setIp] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleConnect = () => {
    if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      setError("Please enter a valid IP address (e.g. 192.168.252.7)");
      setUrl("");
      return;
    }

    const streamUrl = `https://${ip}:8080/video`;
    setUrl(streamUrl);
    setError("");
  };

  return (
    <div className="camera-container">
      <h1 className="camera-title">IP Camera Viewer</h1>

      <input
        type="text"
        placeholder="Enter IP (e.g. 192.168.252.7)"
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        className="camera-input"
      />

      <button onClick={handleConnect} className="camera-button">
        Connect
      </button>

      {error && <div className="camera-error">{error}</div>}

      {url && (
        <div className="camera-frame">
          <img
            src={url}
            alt="Live Stream"
            onError={() => {
              setError(
                "Unable to load video. Check the IP, port, or HTTPS permissions."
              );
              setUrl("");
            }}
          />
        </div>
      )}
    </div>
  );
};

export default IPCameraViewer;
