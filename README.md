# 🩸 Sombre - Système Foundry VTT

> *“Sombre est un jeu de rôle d’horreur visant à reproduire la tension et la brutalité des films du même genre.”*

---

## 📖 À propos du jeu

**Sombre** est une œuvre protégée de **Johan Scipion**.  
Il s’agit d’un jeu de rôle conçu pour émuler l’expérience des films d’horreur à l’écran : tension rapide, survie incertaine, personnages fragiles et ambiance viscérale.

Ce système Foundry VTT est une adaptation non-officielle destinée à faciliter le jeu en ligne.

---

## ⚠️ Respect de l’œuvre originale

Ce module respecte la volonté de l’auteur de Sombre **Johan Scipion** :

- Les **règles du jeu ne sont pas reproduites intégralement**
- Les **contenus sensibles ou protégés ne sont pas redistribués**
- Les **traits et personnalités ne sont pas inclus dans ce module**

👉 Ces éléments doivent être importés par les utilisateurs eux-mêmes grâce à leurs ouvrages personnels.

---

## 📦 Compendiums & contenu utilisateur

Afin de respecter les droits de l’auteur, ce système ne fournit pas les listes de :

- Traits
- Personnalités
- Contenus descriptifs complets issus des fanzines
- Rendez vous sur https://www.terresetranges.net/ pour vous procurer les livrets en physique

### ✔️ Chargement des Traits et Personnalités

Les Traits et Personnalités doivent être importés dans Foundry via des compendiums utilisateur.

#### 🔧 Étapes d’installation :

##### Manuellement

1. Ouvrir l’onglet **Compendiums**
2. Créer un nouveau compendium de type **Item**
3. Nommer les packs  :
   - `sombre-traits`
   - `sombre-personnalities`
4. Importer vos données personnelles (JSON ou saisie manuelle)
5. Associer ces compendiums au système Sombre
6. Les items doivent respecter les patterns suivant : 
   - `{
    "name": "Nom du trait",
    "type": "trait",
    "system": {
      "Name": "Nom du trait",
      "Description": "Description du trait",
      "Type": "Normal/Surnaturel",
      "Category": "Avantage/Désavantage"
    }
  }`
   - `{
    "name": "Nom de la personnalité",
    "type": "personnality",
    "system": {
      "Name": "Nom de la personnalité",
      "Equilibre": "Premier stade",
      "Perturbe": "Deuxième stade",
      "Desaxe": "Troisième stade"
    }
  }`

##### Via le module conçu pour (recommandé)

1. Se rendre sur le dépôt : https://github.com/GreenDodow/sombre-classic-compendium-module
2. Suivre le mode d'emploi dans le readme

---

## 🎭 Philosophie du système

Ce module ne cherche pas à remplacer le livre de base, mais à :

- fluidifier la gestion des fiches
- accélérer la mise en place des parties
- conserver l’esprit minimaliste et brutal du jeu

---

## ⚖️ Licence & droits

Sombre est une œuvre protégée de **Johan Scipion**.

Ce projet est une adaptation technique non commerciale destinée à un usage privé.

Tous les droits du jeu original appartiennent à son auteur **Johan Scipion**.

---

## 🕯️ Note finale

> *“Dans Sombre, les personnages ne sont pas faits pour survivre longtemps… mais pour mourir de façon mémorable.”*
