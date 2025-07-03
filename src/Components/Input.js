import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [step, setStep] = useState(0); // 0: greet, 1: ask repo, 2: ask request, 3: processing

  const API_ENDPOINT = 'http://127.0.0.1:5000/requirement';

  useEffect(() => {
    setMessages([
      {
        text: 'Hello! Please start the conversation.',
        sender: 'bot'
      }
    ]);
    setStep(1);
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) {
      alert('Cannot send empty message');
      return;
    }

    const newMessage = { text: inputText, file: selectedFile, sender: 'user' };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setSelectedFile(null);

    if (step === 1) {
      setMessages((prev) => [
        ...prev,
        {
          text: 'Please provide your github-repo-link:',
          sender: 'bot'
        }
      ]);
      setStep(2);
    } else if (step === 2) {
      setGithubRepo(inputText);
      setMessages((prev) => [
        ...prev,
        {
          text: 'Now, please provide your request message:',
          sender: 'bot'
        }
      ]);
      setStep(3);
    } else if (step === 3) {
      const currentRequestMessage = inputText;
      setRequestMessage(currentRequestMessage);

      setMessages((prev) => [
        ...prev,
        {
          text: 'Thanks for providing the details. We are working on it!',
          sender: 'bot'
        }
      ]);
      setStep(4);

      try {
        const res = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            githubRepo,
            requestMessage: currentRequestMessage
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => [
            ...prev,
            {
              text: 'In progress...',
              sender: 'bot'
            }
          ]);

          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                text: (
                  <>
                    <div>
                      <strong>MR Details:</strong>
                      <pre style={{ whiteSpace: 'pre-wrap' }}>{data.mr_details}</pre>
                    </div>
                    <div>
                      <a href={data.mr_link} target="_blank" rel="noopener noreferrer">
                        View Merge Request
                      </a>
                    </div>
                  </>
                ),
                sender: 'bot',
                showDownload: true
              }
            ]);
          }, 3000);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              text: 'There was an error processing your request. Please try again.',
              sender: 'bot'
            }
          ]);
        }
      } catch (error) {
        console.error('Error:', error);
        setMessages((prev) => [
          ...prev,
          {
            text: 'There was an error processing your request. Please try again.',
            sender: 'bot'
          }
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

      <div className="chat-box">
        {messages.length === 0 ? (
          <div className="placeholder">
            👋 <strong>Start the conversation!</strong>
            <p>Type your message and attach a file below.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-message ${msg.sender === 'bot' ? 'bot-message' : 'user-message'}`}
            >
              <p>
                {msg.sender === 'bot' ? '🤖 ' : '🧑 '}
                {msg.text}
              </p>
              {msg.file && msg.sender !== 'bot' && <p>📎 {msg.file.name}</p>}
              {/* Uncomment below to enable download button */}
              {/* {msg.sender === 'bot' && msg.showDownload && (
                <button className="download-btn" onClick={downloadHardcodedFile}>
                  Download File
                </button>
              )} */}
            </div>
          ))
        )}
      </div>

      <div className="input-area">
        <label className="file-label" title="Attach a file">
          <span className="plus-icon">+</span>
          <input type="file" onChange={handleFileChange} />
        </label>

        <input
          type="text"
          placeholder="Please type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          className="input-textarea"
        />
        {/* <button onClick={handleSend} title="Send">➤</button> */}
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