const CLIMATE_TEMPLATES = `
Exemple mushroom-climate-card:
  type: custom:mushroom-climate-card
  entity: climate.salon
  hvac_modes: [heat, cool, heat_cool, 'off']
  show_temperature_control: true

Exemple mini-graph-card température:
  type: custom:mini-graph-card
  entities:
    - entity: sensor.temperature_salon
      name: Salon
    - entity: sensor.temperature_chambre
      name: Chambre
  hours_to_show: 24
  line_color: '#ff6b6b'
`;

module.exports = { CLIMATE_TEMPLATES };
