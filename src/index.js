require('dotenv').config();
const express = require('express');
const { verifyAndParseRequest, createAckEvent, createTextEvent, createDoneEvent, createErrorsEvent } = require('@copilot-extensions/preview-sdk');
const { buildHAResponse } = require('./agent');

const app = express();

// Capturer le body brut pour la vérification de signature GitHub
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => { data += chunk; });
  req.on('end', () => {
    req.rawBody = data;
    req.body = JSON.parse(data || '{}');
    next();
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok', agent: 'HA Dashboard Copilot Agent' }));

app.post('/', async (req, res) => {
  const signature = req.headers['github-public-key-signature'];
  const keyId = req.headers['github-public-key-identifier'];
  const tokenForUser = req.headers['x-github-token'] || req.headers.authorization?.replace('Bearer ', '');

  try {
    if (process.env.NODE_ENV === 'production') {
      await verifyAndParseRequest(req.rawBody, signature, keyId, { token: tokenForUser });
    }
  } catch (err) {
    console.error('Signature invalide:', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(createAckEvent());

  try {
    const messages = req.body.messages || [];
    await buildHAResponse(messages, tokenForUser, (text) => {
      res.write(createTextEvent(text));
    });
  } catch (err) {
    console.error('Erreur agent:', err);
    res.write(createErrorsEvent([{ type: 'agent', code: 'error', message: err.message }]));
  }

  res.write(createDoneEvent());
  res.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🏠 HA Copilot Agent démarré sur le port ${PORT}`));
