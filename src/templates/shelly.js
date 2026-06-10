const SHELLY_TEMPLATES = `
Exemple carte portail Shelly (Mushroom):
  type: custom:mushroom-cover-card
  entity: cover.portail_shelly
  name: Portail
  icon: mdi:gate
  show_buttons_control: true
  show_position_control: true

Alternative Bubble Card:
  type: custom:bubble-card
  card_type: cover
  entity: cover.portail_shelly
  name: Portail Principal
  icon: mdi:gate
`;

module.exports = { SHELLY_TEMPLATES };
