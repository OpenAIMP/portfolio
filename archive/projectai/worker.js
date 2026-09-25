export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenAIMP — AI Playground</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; background: #f8f9fa; min-height: 100vh; }
    header { position: sticky; top: 0; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); z-index: 100; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto; padding: 1rem 2rem; }
    .logo { font-size: 1.5rem; font-weight: 700; color: #4f46e5; }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #1a1a2e; }
    .subtitle { color: #666; margin-bottom: 2rem; }
    .chat-box { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); padding: 1.5rem; margin-bottom: 1.5rem; min-height: 300px; max-height: 500px; overflow-y: auto; }
    .message { margin-bottom: 1rem; padding: 0.75rem 1rem; border-radius: 8px; }
    .user-msg { background: #4f46e5; color: #fff; margin-left: 2rem; }
    .ai-msg { background: #f0f0f0; margin-right: 2rem; }
    .input-area { display: flex; gap: 0.5rem; }
    input[type="text"] { flex: 1; padding: 0.75rem 1rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }
    button { padding: 0.75rem 1.5rem; background: #4f46e5; color: #fff; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #4338ca; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    .model-select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; background: #f3f0ff; border-radius: 4px; font-size: 0.85rem; font-weight: 600; }
  </style>
</head>
<body>
  <header>
    <nav>
      <div class="logo">OpenAIMP AI</div>
      <span class="badge">⚡ Powered by Workers AI</span>
    </nav>
  </header>
  <div class="container">
    <h1>AI Playground</h1>
    <p class="subtitle">Chat with AI models running on Cloudflare's edge network — free.</p>
    <select class="model-select" id="model">
      <option value="@cf/zai-org/glm-4.7-flash">GLM-4.7 Flash (fast)</option>
      <option value="@cf/google/gemma-4-26b-a4b-it">Gemma 4 26B</option>
      <option value="@cf/nvidia/nemotron-3-120b-a12b">Nemotron 3 120B</option>
    </select>
    <div class="chat-box" id="chat">
      <div class="message ai-msg">Hi! I'm an AI running on Cloudflare Workers AI. Ask me anything!</div>
    </div>
    <div class="input-area">
      <input type="text" id="prompt" placeholder="Type your message..." onkeydown="if(event.key==='Enter')sendMsg()">
      <button id="sendBtn" onclick="sendMsg()">Send</button>
    </div>
  </div>
  <script>
    let conversation = [];
    async function sendMsg() {
      const input = document.getElementById('prompt');
      const btn = document.getElementById('sendBtn');
      const chat = document.getElementById('chat');
      const model = document.getElementById('model').value;
      const text = input.value.trim();
      if (!text) return;
      chat.innerHTML += '<div class="message user-msg">' + escapeHtml(text) + '</div>';
      input.value = '';
      btn.disabled = true;
      input.disabled = true;
      conversation.push({ role: 'user', content: text });
      const aiDiv = document.createElement('div');
      aiDiv.className = 'message ai-msg';
      aiDiv.textContent = 'Thinking...';
      chat.appendChild(aiDiv);
      chat.scrollTop = chat.scrollHeight;
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: conversation, model: model })
        });
        const data = await res.json();
        const reply = data.response || data.error || 'No response received.';
        aiDiv.textContent = reply;
        conversation.push({ role: 'assistant', content: reply });
      } catch (e) {
        aiDiv.textContent = 'Error: ' + e.message;
      }
      chat.scrollTop = chat.scrollHeight;
      btn.disabled = false;
      input.disabled = false;
      input.focus();
    }
    function escapeHtml(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }
  </script>
</body>
</html>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const body = await request.json();
        const messages = body.messages || [{ role: 'user', content: 'Hello' }];
        const model = body.model || '@cf/zai-org/glm-4.7-flash';
        
        const fullMessages = messages[0]?.role === 'system' 
          ? messages 
          : [{ role: 'system', content: 'You are a helpful, friendly AI assistant. Respond concisely and naturally. Do not use internal reasoning.' }, ...messages];
        
        const aiResponse = await env.AI.run(model, { messages: fullMessages, max_tokens: 4096 });
        
        let responseText = '';
        
        if (typeof aiResponse === 'string') {
          responseText = aiResponse;
        } else if (aiResponse.response) {
          responseText = aiResponse.response;
        } else if (aiResponse.choices && aiResponse.choices.length > 0) {
          const choice = aiResponse.choices[0];
          responseText = choice.message?.content || choice.text || '';
          if (!responseText && choice.message?.reasoning_content) {
            responseText = choice.message.reasoning_content;
          }
          if (!responseText && choice.reasoning) {
            responseText = choice.reasoning;
          }
        } else if (aiResponse.result) {
          if (typeof aiResponse.result === 'string') {
            responseText = aiResponse.result;
          } else if (aiResponse.result.response) {
            responseText = aiResponse.result.response;
          } else if (aiResponse.result.choices && aiResponse.result.choices.length > 0) {
            const choice = aiResponse.result.choices[0];
            responseText = choice.message?.content || choice.text || choice.message?.reasoning_content || '';
          }
        }
        
        if (!responseText) {
          responseText = 'The model is still thinking. Try asking again or use a different model.';
        }
        
        return new Response(JSON.stringify({ response: responseText, model: model }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/api/info') {
      return new Response(JSON.stringify({
        name: 'OpenAIMP AI Playground',
        platform: 'Cloudflare Workers AI',
        models: ['@cf/zai-org/glm-4.7-flash', '@cf/google/gemma-4-26b-a4b-it', '@cf/nvidia/nemotron-3-120b-a12b'],
        daily_limit: '10,000 Neurons/day (free plan)',
        timestamp: new Date().toISOString()
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};
