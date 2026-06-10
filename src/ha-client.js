class HAClient {
  constructor() {
    this.baseUrl = (process.env.HA_URL || '').replace(/\/$/, '');
    this.token = process.env.HA_TOKEN || '';
  }

  isConfigured() {
    return !!(this.baseUrl && this.token);
  }

  async request(method, path, body) {
    const url = `${this.baseUrl}/api${path}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HA API ${res.status}: ${text}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  async getLovelaceConfig() {
    return this.request('GET', '/lovelace/config');
  }

  async updateLovelaceConfig(config) {
    return this.request('POST', '/lovelace/config', config);
  }

  async getStates() {
    return this.request('GET', '/states');
  }

  async getEntitiesByDomain(domain) {
    const states = await this.getStates();
    const filtered = domain
      ? states.filter(s => s.entity_id.startsWith(domain + '.'))
      : states;
    return filtered.map(e => ({
      entity_id: e.entity_id,
      state: e.state,
      friendly_name: e.attributes?.friendly_name || ''
    }));
  }

  normalizeView(view) {
    if (!view || typeof view !== 'object') {
      throw new Error('La vue fournie est invalide');
    }

    const title = typeof view.title === 'string' ? view.title.trim() : '';
    if (!title) {
      throw new Error('Le titre de la vue est obligatoire');
    }

    const path = typeof view.path === 'string' && view.path.trim()
      ? view.path.trim()
      : title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'view';

    return {
      ...view,
      title,
      path,
      cards: Array.isArray(view.cards) ? view.cards : []
    };
  }

  async addViewToDashboard(view) {
    const config = await this.getLovelaceConfig();
    const normalizedView = this.normalizeView(view);
    if (!config.views) config.views = [];
    config.views.push(normalizedView);
    await this.updateLovelaceConfig(config);
    return { success: true, message: `Vue "${normalizedView.title}" ajoutée au dashboard !` };
  }

  async addCardToView(viewIndex, card) {
    const config = await this.getLovelaceConfig();
    if (!config.views || !config.views[viewIndex]) {
      throw new Error(`Vue ${viewIndex} introuvable dans le dashboard`);
    }
    if (!config.views[viewIndex].cards) config.views[viewIndex].cards = [];
    config.views[viewIndex].cards.push(card);
    await this.updateLovelaceConfig(config);
    return { success: true, message: `Carte ajoutée à la vue "${config.views[viewIndex].title}" !` };
  }
}

module.exports = { HAClient };
