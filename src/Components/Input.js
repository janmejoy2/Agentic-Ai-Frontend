import React, { useState, useEffect, useRef } from 'react';
import { extractText, extractTextFromJSX } from './utils';
import { formatSummaryGrouped,formatMrDetails } from './MessageFormatters';
import { processQueue } from './tts';
import ChatBox from './ChatBox';
import './Input.css';

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


  useEffect(() => {
    if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    if (messages.length === 0) return;
    // Queue up any new bot messages
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
    // eslint-disable-next-line
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

    const newMessage = { text: inputText, file: selectedFile, sender: 'user' };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setSelectedFile(null);

    if (step === 2) {
      setGithubRepo(inputText);
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
            text: formatSummaryGrouped(data.summary),
            sender: 'bot'
          },
          { text: 'Now, please provide your requirement:', sender: 'bot' }
        ]);
        console.log('repo link:', inputText);
  setStep(3);
}
      } catch (error) {
        console.error('Summary fetch error:', error);
      }
    } else if (step === 3) {
      const currentRequestMessage = inputText;
      setRequestMessage(currentRequestMessage);

      setMessages((prev) => [
        ...prev,
        { text: 'Thanks for providing the details. We are working on it!', sender: 'bot' }
      ]);
      setStep(4);
        console.log('repo link after requirement:', githubRepo); // <-- Log repo link here

      try {
        const res = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ githubRepo, requestMessage: currentRequestMessage }),
        });
        
        if (res.ok) {
  const data = await res.json();
  console.log("data of reponse", data);

  setTimeout(() => {
    setMessages((prev) => [
      ...prev,
      {
        text: formatMrDetails(data.mr_details, data),
        sender: 'bot',
        showDownload: true
      }
    ]);
}, 3000);
      }
      else {
        setMessages((prev) => [
          ...prev,
          { text: 'There was an error processing your request. Please try again.', sender: 'bot' }
        ]);
      }
    } catch (error) {
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