const DASHBOARD_TEMPLATE = `
Exemple de dashboard complet (température + caméra + portail + NAS) :

title: Maison - Dashboard Principal
views:
  - title: Accueil
    path: accueil
    icon: mdi:home
    cards:

      # ─── Températures ───────────────────────────────────────────────────────
      - type: horizontal-stack
        cards:
          - type: custom:mushroom-template-card
            primary: Salon
            secondary: "{{ states('sensor.temperature_salon') | round(1) }} °C"
            icon: mdi:thermometer
            icon_color: >-
              {% if states('sensor.temperature_salon') | float > 22 %}
                orange
              {% else %}
                blue
              {% endif %}
            entity: sensor.temperature_salon
            tap_action:
              action: more-info

          - type: custom:mushroom-template-card
            primary: Chambre
            secondary: "{{ states('sensor.temperature_chambre') | round(1) }} °C"
            icon: mdi:thermometer
            icon_color: >-
              {% if states('sensor.temperature_chambre') | float > 20 %}
                orange
              {% else %}
                blue
              {% endif %}
            entity: sensor.temperature_chambre
            tap_action:
              action: more-info

      # Graphique historique des températures (24 h)
      - type: custom:mini-graph-card
        name: Historique températures
        entities:
          - entity: sensor.temperature_salon
            name: Salon
            color: '#ff6b6b'
          - entity: sensor.temperature_chambre
            name: Chambre
            color: '#4fc3f7'
        hours_to_show: 24
        points_per_hour: 2
        line_width: 2
        show:
          labels: true
          legend: true
          fill: fade

      # ─── Caméra Hikvision Entrée ─────────────────────────────────────────────
      - type: custom:webrtc-camera
        entity: camera.hikvision_entree
        title: Caméra Entrée
        ui: true
        muted: true

      # ─── Portail Shelly ──────────────────────────────────────────────────────
      - type: custom:mushroom-cover-card
        entity: cover.portail_shelly
        name: Portail
        icon: mdi:gate
        show_buttons_control: true
        show_position_control: true

      # ─── NAS Synology ────────────────────────────────────────────────────────
      - type: vertical-stack
        cards:
          - type: custom:mushroom-template-card
            primary: NAS Synology
            secondary: >-
              CPU : {{ states('sensor.synology_nas_cpu_utilization_total') }}% |
              RAM : {{ states('sensor.synology_nas_memory_usage_real') }}%
            icon: mdi:nas
            icon_color: blue
            tap_action:
              action: more-info

          - type: custom:mini-graph-card
            name: NAS – CPU & RAM
            entities:
              - entity: sensor.synology_nas_cpu_utilization_total
                name: CPU
                color: '#ff6b6b'
              - entity: sensor.synology_nas_memory_usage_real
                name: RAM
                color: '#4fc3f7'
            hours_to_show: 6
            line_width: 2
            show:
              labels: true
              legend: true

# ─── Dépendances HACS requises ───────────────────────────────────────────────
# - mushroom            (Mushroom Cards)
# - mini-graph-card     (Mini Graph Card)
# - webrtc-camera       (WebRTC Camera – pour flux Hikvision)
#
# ─── Configuration caméra (configuration.yaml) ──────────────────────────────
# camera:
#   - platform: onvif
#     host: 192.168.1.100
#     username: admin
#     password: !secret hikvision_password
`;

module.exports = { DASHBOARD_TEMPLATE };
