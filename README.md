# 🏠 HA Copilot Dashboard Agent

GitHub Copilot Extension pour générer des dashboards Home Assistant modernes.

## Utilisation

Dans GitHub Copilot Chat :
```
@ha-dashboard Crée un dashboard avec mes capteurs de température
@ha-dashboard Dashboard caméras Hikivision temps réel
@ha-dashboard Carte contrôle portail Shelly
@ha-dashboard Monitoring NAS Synology
```

## Dépendances HACS

- [Mushroom Cards](https://github.com/piitaya/lovelace-mushroom)
- [Bubble Card](https://github.com/Clooos/Bubble-Card)
- [Mini Graph Card](https://github.com/kalkih/mini-graph-card)
- [WebRTC Camera](https://github.com/AlexxIT/WebRTC)
- [Layout Card](https://github.com/thomasloven/lovelace-layout-card)
- [Auto Entities](https://github.com/thomasloven/lovelace-auto-entities)

## Déploiement Railway

1. Connecter ce repo à [Railway](https://railway.app)
2. Ajouter la variable `NODE_ENV=production`
3. Copier l'URL Railway dans le Webhook URL du GitHub App
