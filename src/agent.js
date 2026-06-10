const OpenAI = require('openai');
const { getSystemPrompt } = require('./prompts/system');

async function buildHAResponse(messages, userToken, onChunk) {
  const openai = new OpenAI({
    apiKey: userToken,
    baseURL: 'https://api.githubcopilot.com',
    defaultHeaders: {
      'Copilot-Integration-Id': 'ha-dashboard-agent'
    }
  });

  const systemMessage = { role: 'system', content: getSystemPrompt() };

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [systemMessage, ...messages],
    stream: true,
    temperature: 0.3,
    max_tokens: 4096
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      await onChunk(content);
    }
  }
}

module.exports = { buildHAResponse };
