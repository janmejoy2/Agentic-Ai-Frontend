export function extractTextFromJSX(node) {
  if (typeof node === 'string' || typeof node === 'number') {
    return node.toString();
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromJSX).join(' ');
  }
  if (node && node.props && node.props.children) {
    return extractTextFromJSX(node.props.children);
  }
  return '';
}

export function extractText(msg) {
  if (typeof msg.text === 'string' || typeof msg.text === 'number') {
    return msg.text.toString();
  } else if (typeof msg.text === 'object') {
    return extractTextFromJSX(msg.text);
  }
  return '';
}