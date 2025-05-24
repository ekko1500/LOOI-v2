import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { loadLabeledImages } from '../utils/labeledDescriptors';

const FaceRecognition = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [faceMatcher, setFaceMatcher] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      const labeledDescriptors = await loadLabeledImages();
      const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
      setFaceMatcher(matcher);
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (faceMatcher) {
      navigator.mediaDevices.getUserMedia({ video: {} }).then((stream) => {
        videoRef.current.srcObject = stream;
      });
    }
  }, [faceMatcher]);

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !faceMatcher) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      resizedDetections.forEach(detection => {
        const box = detection.detection.box;
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

        faceapi.draw.drawDetections(canvas, [detection]);
        const drawBox = new faceapi.draw.DrawBox(box, { label: bestMatch.toString() });
        drawBox.draw(canvas);
      });
    }, 200);
  };

  return (
    <div style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        onPlay={handleVideoOnPlay}
        style={{ width: '720px', height: '560px', position: 'absolute' }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
};

export default FaceRecognition;
