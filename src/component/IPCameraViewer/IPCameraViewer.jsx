import React, { useState } from "react";
import "./IPCameraViewer.css";
import RemoteController from "../RemoteController/RemoteController";

const IPCameraViewer = () => {
  const [ip, setIp] = useState("192.168.193.36"); //10.134.151.203
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleConnect = () => {
    if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      setError("Please enter a valid IP address (e.g. 192.168.252.7)");
      setUrl("");
      return;
    }

    const streamUrl = `http://${ip}:8080/video`;
    setUrl(streamUrl);
    setError("");
  };

  return (
    <div className="camera-container">
      {!url && (
        <>
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
        </>
      )}

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

          <RemoteController />
        </div>
      )}
    </div>
  );
};

export default IPCameraViewer;
