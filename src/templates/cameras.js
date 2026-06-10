const CAMERA_TEMPLATES = `
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

Note: Configurer le flux ONVIF dans configuration.yaml:
  camera:
    - platform: onvif
      host: 192.168.1.100
      username: admin
      password: !secret hikivision_password
`;

module.exports = { CAMERA_TEMPLATES };
