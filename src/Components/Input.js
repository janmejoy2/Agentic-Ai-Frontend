import React, { useState, useEffect, useRef } from 'react';
import { extractText } from './utils';
import { formatMrDetails } from './MessageFormatters';
import { processQueue, speakTTS } from './tts';
import ChatBox from './ChatBox';
import './Input.css';
import StatusPopup from './StatusPopup';
import SummaryWithDiagram from './Summarydigarm';

const Input = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [githubRepo, setGithubRepo] = useState('');
  const [step, setStep] = useState(2);
  const lastSpokenIndex = useRef(-1);
  const ttsQueue = useRef([]);
  const isSpeaking = useRef(false);
  const [ttsEnabled, setTtsEnabled] = useState(true); 
  const lastMessageRef = useRef(null);
  const [popup, setPopup] = useState({ show: false, message: '' });


  useEffect(() => {
    // Scroll to the last message with a slight delay to ensure DOM is updated
    const scrollToBottom = () => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    // Use setTimeout to ensure DOM is fully updated before scrolling
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    if (messages.length === 0) return;
    
    // Function to check if text is rendered and start TTS
    const checkAndStartTTS = () => {
      // Check if the last message is visible and rendered
      if (lastMessageRef.current && lastMessageRef.current.offsetHeight > 0) {
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
      } else {
        // If not rendered yet, try again after a short delay
        setTimeout(checkAndStartTTS, 100);
      }
    };
    
    // Start checking for text rendering
    const ttsTimeoutId = setTimeout(checkAndStartTTS, 200);
    
    // Cleanup timeouts on unmount or when messages change
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(ttsTimeoutId);
    };
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
    // Function to check if content is rendered and start TTS
  const checkContentAndSpeak = (textToSpeak, checkElement = null) => {
    const checkRendered = () => {
      // If a specific element is provided, check that element
      if (checkElement && checkElement.current && checkElement.current.offsetHeight > 0) {
        speakTTS(textToSpeak);
        return;
      }
      
      // Otherwise check the last message
      if (lastMessageRef.current && lastMessageRef.current.offsetHeight > 0) {
        speakTTS(textToSpeak);
        return;
      }
      
      // If not rendered yet, try again after a short delay
      setTimeout(checkRendered, 100);
    };
    
    // Start checking after a brief initial delay
    setTimeout(checkRendered, 200);
  };

  const handleMoreRequirement = (answer) => {
  if (answer === 'yes') {
    setMessages((prev) => [
      ...prev,
      { text: 'Please provide your requirement:', sender: 'bot' }
    ]);
    // Check if content is rendered before speaking
    checkContentAndSpeak('Please provide your requirement.');
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
    // Check if content is rendered before speaking
    checkContentAndSpeak('Thank you for using LegacyTransform AI! ');
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
                 // Check if content is rendered before speaking
         checkContentAndSpeak('Here is your summary. Now, please provide your requirement.');

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
        speakTTS('Generating merge request, applying code changes, please wait');
      }, 1000);
      const currentRequestMessage = inputText;

      setMessages((prev) => [
        ...prev,
        { text: 'Thanks for providing the details. We are working on it!', sender: 'bot' }
      ]);
             // Check if content is rendered before speaking
       checkContentAndSpeak('Thanks for providing the details. We are working on it!');
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
     // Check if content is rendered before speaking
   checkContentAndSpeak('Please find the above requested changes. Do you want me to help with other requirements?');
  
  // Force scroll to bottom after MR details are displayed
  setTimeout(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
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

      {selectedFile && (
        <div className="file-preview">
          <p>📁 Selected file: {selectedFile.name}</p>
        </div>
      )}
    </div>
  );
};

export default Input;