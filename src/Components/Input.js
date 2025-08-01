import React, { useState, useEffect, useRef } from 'react';
import { extractText, extractTextFromJSX } from './utils';
import { formatSummaryGrouped,formatMrDetails } from './MessageFormatters';
import { processQueue, speakTTS } from './tts';
import ChatBox from './ChatBox';
import './Input.css';
import StatusPopup from './StatusPopup';
import SummaryWithDiagram from './Summarydigarm';

const HARDCODED_FILE = {
  name: 'sample.txt',
  content: 'This is a hardcoded file content for download.'
};

const downloadHardcodedFile = () => {
  const element = document.createElement('a');
  const file = new Blob([HARDCODED_FILE.content], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = HARDCODED_FILE.name;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const Input = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [step, setStep] = useState(2); 
  const chatBoxRef = useRef(null);
  const lastSpokenIndex = useRef(-1);
  const ttsQueue = useRef([]);
  const isSpeaking = useRef(false);
  const [ttsEnabled, setTtsEnabled] = useState(true); 
  const lastMessageRef = useRef(null);
  const [popup, setPopup] = useState({ show: false, message: '' });


  useEffect(() => {
    if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    if (messages.length === 0) return;
    for (let i = lastSpokenIndex.current + 1; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.sender === 'bot' && ttsEnabled && i < 2) {
        const textToSpeak = extractText(msg);
        if (textToSpeak) {
          ttsQueue.current.push(textToSpeak);
        }
        lastSpokenIndex.current = i;
        if (i === 1) setTtsEnabled(false);
      }
    }
    processQueue(ttsQueue, isSpeaking, ttsEnabled);
  }, [messages, ttsEnabled]);

  const API_ENDPOINT = 'http://127.0.0.1:5000/requirement';

  useEffect(() => {
  setMessages([
    {
      text: 'Hi there! I am Legacy AI, your assistant for transforming legacy code into modern code.',
      sender: 'bot'
    },
    {
      text: 'Please provide your GitHub repo link:',
      sender: 'bot'
    }
  ]);
}, []); 

// useEffect(() => {
//   if (chatBoxRef.current) {
//     chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
//   }
// }, [messages]); 

  const handleSend = async () => {
    if (!inputText.trim()) {
      alert('Cannot send empty message');
      return;
    }
    const handleMoreRequirement = (answer) => {
  if (answer === 'yes') {
    setMessages((prev) => [
      ...prev,
      { text: 'Please provide your requirement:', sender: 'bot' }
    ]);
    speakTTS('Please provide your requirement.');
    setStep(3);
  } else {
    setMessages((prev) => [
      ...prev,
      {
        text: (
          <span>
            Thank you for using LegacyTransform AI!
            <br />
            <button
              className="diagram-btn"
              style={{
                marginTop: '12px',
                background: '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                cursor: 'pointer'
              }}
              onClick={() => window.location.reload()}
            >
              Start a New Chat
            </button>
          </span>
        ),
        sender: 'bot'
      }
    ]);
    speakTTS('Thank you for using LegacyTransform AI! ');
    setStep(2);
  }
};

    const newMessage = { text: inputText, file: selectedFile, sender: 'user' };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setSelectedFile(null);

    if (step === 2) {
      setGithubRepo(inputText);
      setTimeout(() => {
        setPopup({ show: true, message: 'Generating Summary, Please wait..' });
        speakTTS('Generating Summary');
      }, 1000);
      try {
        const res = await fetch('http://127.0.0.1:5000/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ githubRepo: inputText }),
        });

        if (res.ok) {
  const data = await res.json();
  setMessages((prev) => [
  ...prev,
  {
    text: (
      <SummaryWithDiagram
        summary={data.summary}
        diagramUrl={`http://localhost:5000/diagrams/${data.plantuml_png.split('\\').pop()}`}
      />
    ),
    sender: 'bot'
  },
  { text: 'Now, please provide your requirement:', sender: 'bot' }
]);
speakTTS('Here is your summary. Now, please provide your requirement.');

  console.log('repo link:', inputText);
  setStep(3);
  setPopup({ show: false, message: '' });
}
      } catch (error) {
        setPopup({ show: false, message: '' });
        console.error('Summary fetch error:', error);
      }
    } else if (step === 3) {
      setTimeout(() => {
        setPopup({ show: true, message: 'Generating merge request...' });
        speakTTS('Generating merge request, applying code changes, please wait ');
      }, 1000);
      const currentRequestMessage = inputText;
      setRequestMessage(currentRequestMessage);

      setMessages((prev) => [
        ...prev,
        { text: 'Thanks for providing the details. We are working on it!', sender: 'bot' }
      ]);
      speakTTS('Thanks for providing the details. We are working on it!');
      setStep(4);
        console.log('repo link after requirement:', githubRepo); // <-- Log repo link here

      try {
        const res = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ githubRepo, requestMessage: currentRequestMessage }),
        });
        
        if (res.ok) {
          setPopup({ show: false, message: '' });
  const data = await res.json();
  console.log("data of reponse", data);

      setTimeout(() => {
  setMessages((prev) => [
    ...prev,
    {
      text: formatMrDetails(data.mr_details, data),
      sender: 'bot',
      showDownload: true
    },
    {
      text: (
        <span>
          Please find the above requested changes.<br />
          Do you want me to help with other requirements?
          <br />
          <button
            className="diagram-btn"
            style={{ margin: '8px 8px 0 0',
              background: '#81c784', // light green
              color: '#fff',
              border: 'none'
             }}
            onClick={() => handleMoreRequirement('yes')}
          >
            Yes
          </button>
          <button
            className="diagram-btn"
            style={{ margin: '8px 0 0 0',
               background: '#e57373', // light red
              color: '#fff',
              border: 'none'
             }}
            onClick={() => handleMoreRequirement('no')}
          >
            No
          </button>
        </span>
      ),
      sender: 'bot'
    }
  ]);
  speakTTS('Please find the above requested changes. Do you want me to help with other requirements?');
}, 3000);
      }
      else {
        setMessages((prev) => [
          ...prev,
          { text: 'There was an error processing your request. Please try again.', sender: 'bot' }
        ]);
      }
    } catch (error) {
      setPopup({ show: false, message: '' });
      console.error('Request error:', error);
      setMessages((prev) => [
        ...prev,
        { text: 'There was an error processing your request. Please try again.', sender: 'bot' }
      ]);
    }
  }
};

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setFileError('');
  };

  return (
    <div className="agentic-container">
      <nav className="navbar">
        <div className="nav-links"></div>
        <h2 className="title">LegacyTransform AI ✨</h2>
      </nav>
    <StatusPopup message={popup.message} show={popup.show} />
      <ChatBox messages={messages} lastMessageRef={lastMessageRef} />
      <div className="input-area">
        <input
          type="text"
          placeholder="Please type your message and press ENTER to send"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          className="input-textarea"
        />
      </div>

      {selectedFile && !fileError && (
        <div className="file-preview">
          <p>📁 Selected file: {selectedFile.name}</p>
        </div>
      )}
      {fileError && (
        <div className="file-error">
          <p>{fileError}</p>
        </div>
      )}
    </div>
  );
};

export default Input;