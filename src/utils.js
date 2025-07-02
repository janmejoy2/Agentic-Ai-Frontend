export const downloadFile = (messages) => {
  const content = messages.map((msg, i) => {
    return `Message ${i + 1}: ${msg.text}${msg.file ? ` | File: ${msg.file.name}` : ''}`;
  }).join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'chat.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
