const CAMERA_TEMPLATES = `
Exemple carte caméra Hikvision (WebRTC):
  type: custom:webrtc-camera
  entity: camera.hikvision_entree
  ui: true
  muted: true

Exemple picture-glance:
  type: picture-glance
  title: Entrée
  camera_image: camera.hikvision_entree
  camera_view: live
  entities:
    - entity: binary_sensor.motion_entree

Note: Configurer le flux ONVIF dans configuration.yaml:
  camera:
    - platform: onvif
      host: 192.168.1.100
      username: admin
      password: !secret hikvision_password
`;

module.exports = { CAMERA_TEMPLATES };
