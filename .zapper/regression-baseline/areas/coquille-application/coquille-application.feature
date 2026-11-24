# language: fr
Fonctionnalité: Coquille de l'application et navigation (comportement existant)

  Contexte:
    Étant donné que l'interface est affichée en anglais

  @regression @RG-01
  Scénario: Une adresse inconnue mène à la page introuvable
    Quand j'ouvre une adresse inconnue de l'application
    Alors la page « 404 » s'affiche avec le message « Page not found. »
    Et l'onglet du navigateur s'intitule « Zapper Todo »

  @regression @RG-01
  Scénario: La page de vérification de disponibilité répond
    Quand j'ouvre la page de vérification de disponibilité de l'application
    Alors la page affiche « alive »

  @regression @RG-01
  Scénario: Ouvrir la navigation sur un écran étroit
    Étant donné que l'écran est étroit
    Quand j'ouvre le menu de navigation
    Alors la navigation principale s'affiche
