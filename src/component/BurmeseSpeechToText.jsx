import React, { useState, useEffect, useRef } from 'react';

function BurmeseSpeechToText() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    let SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError('Your browser does not support the Web Speech API.');
      console.error('SpeechRecognition not supported.');
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'my-MM'; // Burmese

    recognition.onstart = () => {
      console.log('Speech recognition started.');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      console.log('Final:', finalTranscript);
      console.log('Interim:', interimTranscript);

      setTranscript((prev) => prev + finalTranscript);
    };

    recognition.onend = () => {
      console.log('Speech recognition stopped.');
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
        setError(`Start error: ${err.message}`);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '1rem' }}>
      <h1>Burmese Speech to Text</h1>
      <p>Current language: မြန်မာ (my-MM)</p>

      <textarea
        value={transcript}
        readOnly
        rows={5}
        cols={60}
        placeholder="Spoken text will appear here..."
        style={{ padding: '0.5rem', fontSize: '1rem', width: '100%' }}
      />

      <div style={{ marginTop: '1rem' }}>
        <button onClick={startListening} disabled={isListening}>
          {isListening ? 'Listening...' : 'Start Listening'}
        </button>
        <button onClick={stopListening} disabled={!isListening}>
          Stop Listening
        </button>
        <button onClick={clearTranscript} disabled={!transcript}>
          Clear Text
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!error && !recognitionRef.current && <p>Initializing speech recognition...</p>}
    </div>
  );
}

export default BurmeseSpeechToText;
