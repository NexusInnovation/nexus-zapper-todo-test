# language: fr
Fonctionnalité: Autres exigences

  @nfr-other-R01
  Scénario: Les Todos sont conservés côté serveur entre les sessions
    Étant donné que j'ai créé le Todo « Acheter du lait » et que je l'ai coché
    Quand j'ouvre la liste des Todos dans une nouvelle session de navigateur, sans données locales
    Alors le Todo « Acheter du lait » apparaît dans la liste
    Et sa case « Fait » est cochée
    Et son Id est le même qu'à sa création
