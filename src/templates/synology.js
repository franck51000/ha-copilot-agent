const SYNOLOGY_TEMPLATES = `
Exemple dashboard NAS Synology:
  type: vertical-stack
  cards:
    - type: custom:mushroom-template-card
      primary: NAS Synology
      secondary: >-
        CPU: {{ states('sensor.synology_nas_cpu_utilization_total') }}% |
        RAM: {{ states('sensor.synology_nas_memory_usage_real') }}%
      icon: mdi:nas
      icon_color: blue

    - type: custom:mini-graph-card
      entities:
        - entity: sensor.synology_nas_cpu_utilization_total
          name: CPU
        - entity: sensor.synology_nas_memory_usage_real
          name: RAM
      hours_to_show: 6
`;

module.exports = { SYNOLOGY_TEMPLATES };
