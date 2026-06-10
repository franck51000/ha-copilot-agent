const CAMERA_TEMPLATES = `
Exemple vue dédiée caméras Hikivision:
  title: Caméras
  path: cameras
  icon: mdi:cctv
  cards:
    - type: grid
      columns: 2
      square: false
      cards:
        - type: custom:webrtc-camera
          entity: camera.hikivision_entree
          name: Entrée
          ui: true
          muted: true
        - type: picture-glance
          title: Jardin
          camera_image: camera.hikivision_jardin
          camera_view: live
          entities:
            - entity: binary_sensor.motion_jardin

Exemple carte caméra Hikivision (WebRTC):
  type: custom:webrtc-camera
  entity: camera.hikivision_entree
  ui: true
  muted: true

Exemple picture-glance:
  type: picture-glance
  title: Entrée
  camera_image: camera.hikivision_entree
  camera_view: live
  entities:
    - entity: binary_sensor.motion_entree

Bonnes pratiques:
  - Pour une demande de vue caméra, créer une vue dédiée avec title, path, icon et cards
  - Utiliser custom:webrtc-camera pour le direct si disponible
  - Utiliser picture-glance comme fallback ou pour afficher les binary_sensor de mouvement
  - Organiser plusieurs caméras dans une grille responsive

Note: Configurer le flux ONVIF dans configuration.yaml:
  camera:
    - platform: onvif
      host: 192.168.1.100
      username: admin
      password: !secret hikivision_password
`;

module.exports = { CAMERA_TEMPLATES };
