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

  generateBaseViewPath(title, explicitPath) {
    if (typeof explicitPath === 'string' && explicitPath.trim()) {
      return explicitPath.trim();
    }

    const generatedPath = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return generatedPath || 'view';
  }

  normalizeView(view, existingViews = []) {
    if (!view || typeof view !== 'object') {
      throw new Error('La vue doit être un objet non nul');
    }

    const title = typeof view.title === 'string' ? view.title.trim() : '';
    if (!title) {
      throw new Error('Le titre de la vue est obligatoire et doit être une chaîne non vide');
    }

    const basePath = this.generateBaseViewPath(title, view.path);

    const existingPaths = new Set(
      existingViews
        .map(existingView => existingView?.path)
        .filter(path => typeof path === 'string' && path.trim())
    );

    let path = basePath;
    let suffix = 2;
    while (existingPaths.has(path)) {
      path = `${basePath}-${suffix}`;
      suffix++;
    }

    return {
      ...view,
      title,
      path,
      cards: Array.isArray(view.cards) ? view.cards : []
    };
  }

  async addViewToDashboard(view) {
    const config = await this.getLovelaceConfig();
    if (!config.views) config.views = [];
    const normalizedView = this.normalizeView(view, config.views);
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

  // ── Standalone dashboards (HA 2021.7+) ────────────────────────────────────

  async getLovelaceDashboards() {
    return this.request('GET', '/lovelace/dashboards');
  }

  generateDashboardUrlPath(title, explicitUrlPath) {
    if (typeof explicitUrlPath === 'string' && explicitUrlPath.trim()) {
      return explicitUrlPath.trim();
    }

    const generated = title
      .toLowerCase()
      .normalize('NFD')
      // remove diacritical marks (accents) after NFD decomposition
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return generated || 'dashboard';
  }

  async createDashboard({ title, icon, url_path, require_admin = false, show_in_sidebar = true }) {
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new Error('Le titre du tableau de bord est obligatoire');
    }

    const urlPath = this.generateDashboardUrlPath(title.trim(), url_path);

    const body = {
      icon: icon || undefined,
      title: title.trim(),
      url_path: urlPath,
      require_admin,
      show_in_sidebar,
      mode: 'storage'
    };

    const created = await this.request('POST', '/lovelace/dashboards', body);

    // Initialize the new dashboard with an empty view so HA accepts it
    const initialConfig = {
      views: [
        {
          title: title.trim(),
          icon: icon || undefined,
          path: 'home',
          cards: []
        }
      ]
    };

    await this.request('POST', `/lovelace/dashboards/${urlPath}/config`, initialConfig);

    return {
      success: true,
      url_path: urlPath,
      dashboard: created,
      message: `Tableau de bord "${title.trim()}" créé avec succès (url_path: ${urlPath}) !`
    };
  }
}

module.exports = { HAClient };
