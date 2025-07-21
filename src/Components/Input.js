import React, { useState, useEffect, useRef } from 'react';
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

  function formatSummaryGrouped(summary) {
  const sections = summary.split('\n\n* ').map(s => s.trim().replace(/^\* /, ''));
  return (
    <div>
      <strong>Summary:</strong>
      <ul>
        {sections.map((section, idx) => {
          const [heading, ...rest] = section.split(':');
          const cleanHeading = heading.replace(/^\*+\s*/, '').replace(/^\*+\s*/, '').replace(/\*+/g, '').trim();
          const content = rest.join(':').trim();
          return (
            <li key={idx}>
              <strong>{cleanHeading}:</strong>
              <div style={{ marginLeft: '12px', marginTop: '4px' }}>
                {content
                  .split('\n')
                  .filter(line => line.trim())
                  .map((line, i) => (
                    <div key={i}>{line.replace(/^\*+\s*/, '').replace(/\*+/g, '').trim()}</div>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
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
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                text: (
                  <>
                    <div><strong>MR Details:</strong></div>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{data.mr_details}</pre>
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

      <div className="chat-box" ref={chatBoxRef}>
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
              {/* {msg.sender === 'bot' && msg.showDownload && (
                <button className="download-btn" onClick={downloadHardcodedFile}>
                  Link to Merge Request
                </button>
              )} */}
            </div>
          ))
        )}
      </div>

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