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
  const [ttsEnabled, setTtsEnabled] = useState(false); // Voice: OFF initially
  const [flowchartEnabled, setFlowchartEnabled] = useState(true); // Flowchart: true initially
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
          // Voice logic: play TTS only when ttsEnabled is false (Voice: OFF)
          if (msg.sender === 'bot' && !ttsEnabled && i < 2) {
            const textToSpeak = extractText(msg);
            if (textToSpeak) {
              ttsQueue.current.push(textToSpeak);
            }
            lastSpokenIndex.current = i;
            if (i === 1) setTtsEnabled(true); // Switch to ON after first two
          }
        }
        // Only process TTS if ttsEnabled is false (Voice: OFF)
        if (!ttsEnabled) {
          processQueue(ttsQueue, isSpeaking, !ttsEnabled);
        }
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
        const bodyData = { githubRepo: inputText, flowchart: flowchartEnabled };
        console.log('Sending to summarize:', bodyData);
        const res = await fetch('http://127.0.0.1:5000/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
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
      checkContentAndSpeak('Thanks for providing the details. We are working on it!');
      setStep(4);
      console.log('repo link after requirement:', githubRepo); // <-- Log repo link here

      try {
        const bodyData = { githubRepo, requestMessage: currentRequestMessage, flowchart: flowchartEnabled };
        console.log('Sending to requirement:', bodyData);
        const res = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
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
                      style={{ margin: '8px 8px 0 0', background: '#81c784', color: '#fff', border: 'none' }}
                      onClick={() => handleMoreRequirement('yes')}
                    >
                      Yes
                    </button>
                    <button
                      className="diagram-btn"
                      style={{ margin: '8px 0 0 0', background: '#e57373', color: '#fff', border: 'none' }}
                      onClick={() => handleMoreRequirement('no')}
                    >
                      No
                    </button>
                  </span>
                ),
                sender: 'bot'
              }
            ]);
            checkContentAndSpeak('Please find the above requested changes. Do you want me to help with other requirements?');
            setTimeout(() => {
              if (lastMessageRef.current) {
                lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }, 3000);
        } else {
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
      <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '72px' }}>
        <h2 className="title" style={{ margin: 0 }}>LegacyTransform AI ✨</h2>
        <div className="nav-links" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <button
            className="flowchart-toggle-btn"
            style={{
              minWidth: '120px',
              marginLeft: '16px',
              background: flowchartEnabled ? '#1976d2' : '#bdbdbd',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: flowchartEnabled ? '0 2px 6px rgba(25, 118, 210, 0.15)' : 'none',
              transition: 'background 0.3s'
            }}
            onClick={() => {
              setFlowchartEnabled((prev) => !prev);
              setPopup({ show: true, message: flowchartEnabled ? 'Flowchart: false' : 'Flowchart: true' });
              setTimeout(() => setPopup({ show: false, message: '' }), 1500);
            }}
          >
            Flowchart: {flowchartEnabled ? 'true' : 'false'}
          </button>
          <button
            className="voice-toggle-btn"
            style={{
              minWidth: '120px',
              marginLeft: '16px',
              background: ttsEnabled ? '#1976d2' : '#bdbdbd', // Blue when muted, grey when ON
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: ttsEnabled ? '0 2px 6px rgba(25, 118, 210, 0.15)' : 'none',
              transition: 'background 0.3s'
            }}
            onClick={() => {
              // Toggle ttsEnabled: false = voice ON, true = mute
              if (!ttsEnabled && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
              setTtsEnabled((prev) => !prev);
              setPopup({ show: true, message: ttsEnabled ? 'Voice: ON (audio playing)' : 'Voice: OFF (muted)' });
              setTimeout(() => setPopup({ show: false, message: '' }), 1500);
            }}
          >
            Voice: {ttsEnabled ? 'OFF' : 'ON'}
          </button>
        </div>
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