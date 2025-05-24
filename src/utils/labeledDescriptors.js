import * as faceapi from 'face-api.js';

// Manually list the names here (matching folder names in /public/known_faces)
const labels = ['kmoons'];

export async function loadLabeledImages() {
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];

      // Load multiple images per label if needed
      for (let i = 1; i <= 1; i++) {
        const imgUrl = `/known_faces/${label}/${i}.jpg`;
        const img = await faceapi.fetchImage(imgUrl);

        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          descriptions.push(detection.descriptor);
        } else {
          console.warn(`No face detected for ${label} in image ${i}`);
        }
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}
