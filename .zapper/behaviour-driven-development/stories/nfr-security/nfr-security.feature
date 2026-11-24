# language: fr
Fonctionnalité: Sécurité

  @nfr-security-R01
  Scénario: L'application est accessible sans connexion
    Étant donné un visiteur qui ne s'est jamais connecté
    Quand j'ouvre la liste des Todos
    Alors la page « Mes Todos » est affichée
    Et aucune connexion n'est demandée

  @nfr-security-R02
  Scénario: Un titre contenant du balisage HTML est affiché comme du texte
    Étant donné que j'ouvre la liste des Todos
    Quand je crée un Todo avec le titre « <b>Acheter</b> du lait »
    Alors la liste affiche littéralement le titre « <b>Acheter</b> du lait »
    Et aucune partie du titre n'est mise en forme

  @nfr-security-R02
  Scénario: Un titre contenant un script n'est jamais exécuté
    Étant donné que j'ouvre la liste des Todos
    Quand je crée un Todo avec le titre « <img src=x onerror=alert(1)> »
    Alors la liste affiche littéralement le titre « <img src=x onerror=alert(1)> »
    Et aucun script du titre n'est exécuté
