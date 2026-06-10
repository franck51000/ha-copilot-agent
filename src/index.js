require('dotenv').config();
const express = require('express');
const { verifyAndParseRequest, createAckEvent, createTextEvent, createDoneEvent, createErrorsEvent } = require('@copilot-extensions/preview-sdk');
const { buildHAResponse } = require('./agent');
const { HAClient } = require('./ha-client');

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

app.get('/health', async (req, res) => {
  const ha = new HAClient();
  let ha_connected = false;
  let ha_error = null;
  let ha_url = process.env.HA_URL || 'non défini';

  if (ha.isConfigured()) {
    try {
      await ha.request('GET', '/');
      ha_connected = true;
    } catch (err) {
      ha_error = err.message;
    }
  }

  res.json({
    status: 'ok',
    agent: 'HA Dashboard Copilot Agent',
    ha_url,
    ha_configured: ha.isConfigured(),
    ha_connected,
    ha_error
  });
});

// Endpoint de diagnostic HA
app.get('/test-ha', async (req, res) => {
  const ha = new HAClient();
  if (!ha.isConfigured()) {
    return res.json({ error: 'HA_URL ou HA_TOKEN manquant dans les variables Railway' });
  }

  try {
    // Test 1 : ping API
    const api = await ha.request('GET', '/');
    // Test 2 : lecture config Lovelace
    const lovelace = await ha.getLovelaceConfig();
    res.json({
      success: true,
      ha_version: api.version || 'inconnue',
      lovelace_mode: lovelace.mode || 'storage',
      nb_views: lovelace.views ? lovelace.views.length : 0,
      views: lovelace.views ? lovelace.views.map(v => ({ title: v.title, path: v.path })) : [],
      raw_lovelace_sample: JSON.stringify(lovelace).substring(0, 500)
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

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
