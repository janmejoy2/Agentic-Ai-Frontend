import React, { useState } from 'react';

const VoiceToggle = ({ voiceOn, setVoiceOn, setPopup }) => {
  return (
    <button
      className="voice-toggle-btn"
      style={{
        minWidth: '120px',
        marginLeft: '16px',
        background: voiceOn ? '#64b5f6' : '#e3f2fd', // lighter blue when ON, very light blue when OFF
        color: '#1976d2', // dark blue text for contrast
        border: 'none',
        borderRadius: '4px',
        padding: '6px 14px',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginBottom: '8px',
        boxShadow: voiceOn ? '0 2px 6px rgba(100, 181, 246, 0.15)' : 'none',
        transition: 'background 0.3s'
      }}
      onClick={() => {
        const newVoiceOn = !voiceOn;
        setVoiceOn(newVoiceOn);
        setPopup({
          show: true,
          message: newVoiceOn ? 'Voice OFF.' : 'Voice ON'
        });
        setTimeout(() => setPopup({ show: false, message: '' }), 1500);
        if (newVoiceOn && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      }}
    >
      Voice: {!voiceOn ? 'OFF' : 'ON'}
    </button>
  );
};

export default VoiceToggle;
