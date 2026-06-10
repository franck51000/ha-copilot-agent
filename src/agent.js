const OpenAI = require('openai');
const { getSystemPrompt } = require('./prompts/system');
const { HAClient } = require('./ha-client');

const haClient = new HAClient();

const HA_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_ha_entities',
      description: 'Récupère les entités disponibles dans Home Assistant par domaine (sensor, climate, camera, cover, switch, light, media_player, etc.)',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Le domaine HA : sensor, climate, camera, cover, switch, light, media_player, binary_sensor...'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_lovelace_config',
      description: 'Récupère la configuration actuelle du dashboard Lovelace de Home Assistant',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_view_to_dashboard',
      description: 'Ajoute une nouvelle vue (onglet) au dashboard Lovelace existant sans supprimer les vues existantes',
      parameters: {
        type: 'object',
        properties: {
          view: {
            type: 'object',
            description: 'La configuration complète de la vue Lovelace (title, icon, cards[])'
          }
        },
        required: ['view']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_full_dashboard',
      description: 'Remplace complètement le dashboard Lovelace. Utiliser seulement si demandé explicitement.',
      parameters: {
        type: 'object',
        properties: {
          config: {
            type: 'object',
            description: 'La configuration Lovelace complète (title, views[])'
          }
        },
        required: ['config']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_card_to_view',
      description: 'Ajoute une carte à une vue existante du dashboard',
      parameters: {
        type: 'object',
        properties: {
          view_index: {
            type: 'number',
            description: 'Index de la vue (0 = première vue)'
          },
          card: {
            type: 'object',
            description: 'La configuration de la carte Lovelace'
          }
        },
        required: ['view_index', 'card']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_lovelace_dashboards',
      description: 'Retourne la liste de tous les tableaux de bord (dashboards) Lovelace existants dans Home Assistant',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_dashboard',
      description: 'Crée un nouveau tableau de bord (dashboard) autonome dans Home Assistant avec un titre, une icône et une URL personnalisés. Utilise cet outil quand l\'utilisateur veut un NOUVEAU TABLEAU DE BORD séparé, pas juste un onglet dans le dashboard existant.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Le titre affiché du tableau de bord (ex: "Camera Maison")'
          },
          icon: {
            type: 'string',
            description: 'Icône Material Design Icon (ex: "mdi:camera")'
          },
          url_path: {
            type: 'string',
            description: 'Chemin URL du tableau de bord (ex: "camera-maison"). Généré automatiquement depuis le titre si absent.'
          },
          require_admin: {
            type: 'boolean',
            description: 'Restreindre l\'accès aux administrateurs. Par défaut false.'
          },
          show_in_sidebar: {
            type: 'boolean',
            description: 'Afficher dans la barre latérale. Par défaut true.'
          }
        },
        required: ['title']
      }
    }
  }
];

async function executeTool(toolName, args, onChunk) {
  switch (toolName) {
    case 'get_ha_entities':
      return await haClient.getEntitiesByDomain(args.domain || '');

    case 'get_lovelace_config':
      return await haClient.getLovelaceConfig();

    case 'add_view_to_dashboard':
      return await haClient.addViewToDashboard(args.view);

    case 'update_full_dashboard':
      await haClient.updateLovelaceConfig(args.config);
      return { success: true, message: 'Dashboard complet mis à jour dans Home Assistant !' };

    case 'add_card_to_view':
      return await haClient.addCardToView(args.view_index, args.card);

    case 'get_lovelace_dashboards':
      return await haClient.getLoveLaceDashboards();

    case 'create_dashboard':
      return await haClient.createDashboard(args);

    default:
      throw new Error(`Outil inconnu: ${toolName}`);
  }
}

async function buildHAResponse(messages, userToken, onChunk) {
  const openai = new OpenAI({
    apiKey: userToken,
    baseURL: 'https://api.githubcopilot.com',
    defaultHeaders: {
      'Copilot-Integration-Id': 'ha-dashboard-agent'
    }
  });

  const haConnected = haClient.isConfigured();
  const systemMessage = {
    role: 'system',
    content: getSystemPrompt(haConnected)
  };

  const tools = haConnected ? HA_TOOLS : [];
  const conversationMessages = [systemMessage, ...messages];

  let iterations = 0;
  const MAX_ITERATIONS = 6;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: conversationMessages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      stream: false,
      temperature: 0.2,
      max_tokens: 4096
    });

    const choice = response.choices[0];
    const msg = choice.message;

    // Pas de tool call → réponse finale
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      await onChunk(msg.content || '');
      break;
    }

    // Ajouter le message assistant avec tool_calls
    conversationMessages.push(msg);

    // Exécuter chaque tool call
    for (const toolCall of msg.tool_calls) {
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || '{}');

      const labels = {
        get_ha_entities: '🔍 Récupération des entités HA',
        get_lovelace_config: '📋 Lecture du dashboard actuel',
        add_view_to_dashboard: '✨ Création de la vue dans HA',
        update_full_dashboard: '🏠 Mise à jour du dashboard complet',
        add_card_to_view: '🃏 Ajout de la carte dans HA',
        get_lovelace_dashboards: '📋 Liste des tableaux de bord',
        create_dashboard: '🆕 Création du tableau de bord dans HA'
      };

      await onChunk(`\n${labels[toolName] || `⚙️ ${toolName}`}...\n`);

      try {
        const result = await executeTool(toolName, args, onChunk);
        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      } catch (err) {
        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: err.message })
        });
        await onChunk(`\n❌ Erreur : ${err.message}\n`);
      }
    }
  }
}

module.exports = { buildHAResponse };
