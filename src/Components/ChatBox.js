import React from 'react';

const ChatBox = ({ messages, lastMessageRef }) => (
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
          ref={idx === messages.length - 1 ? lastMessageRef : null}
        >
          <p>
            {msg.sender === 'bot' ? '🤖 ' : '🧑 '}
            {msg.text}
          </p>
          {msg.file && msg.sender !== 'bot' && <p>📎 {msg.file.name}</p>}
        </div>
      ))
    )}
  </div>
);

export default ChatBox;