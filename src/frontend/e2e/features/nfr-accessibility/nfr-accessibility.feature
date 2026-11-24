# language: fr
Fonctionnalité: Accessibilité

  @nfr-accessibility-R01
  Scénario: Les contrôles sont étiquetés
    Étant donné un Todo existant « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Quand j'ouvre le mode édition du Todo « Acheter du lait »
    Alors le champ « Titre du Todo » a un nom accessible
    Et la case « Fait » a un nom accessible
    Et le champ « Modifier le titre » a un nom accessible

  @nfr-accessibility-R01
  Scénario: Les Todos se gèrent entièrement au clavier
    Étant donné que j'ouvre la liste des Todos
    Quand je crée, coche, modifie puis supprime un Todo en utilisant uniquement le clavier
    Alors chaque action aboutit sans utiliser la souris
    Et la touche Entrée valide la saisie
    Et la touche Échap annule la modification du titre

  @nfr-accessibility-R01
  Scénario: Le focus est visible sur chaque contrôle
    Étant donné un Todo existant « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Quand je parcours les contrôles de la page avec la touche Tab
    Alors chaque contrôle qui reçoit le focus affiche un indicateur de focus visible

  @nfr-accessibility-R01
  Scénario: Les messages d'erreur sont annoncés aux technologies d'assistance
    Étant donné que j'ouvre la liste des Todos
    Quand je crée un Todo avec un titre vide
    Alors le message « Le titre est obligatoire. » est annoncé comme une alerte

  @nfr-accessibility-R01
  Plan du scénario: La page ne présente aucune violation WCAG 2.1 AA détectable automatiquement
    Étant donné <état>
    Quand j'ouvre la liste des Todos
    Alors l'analyse automatique d'accessibilité ne détecte aucune violation WCAG 2.1 AA

    Exemples:
      | état                                                      |
      | aucun Todo                                                |
      | un Todo fait « Appeler le plombier »                      |

  @nfr-accessibility-R01 @manual
  Scénario: Audit WCAG 2.1 AA manuel
    Une analyse automatique ne couvre qu'une partie des critères WCAG 2.1 AA (ordre de lecture,
    pertinence des libellés, restitution par un lecteur d'écran). Un humain vérifie la page avec un
    lecteur d'écran (NVDA ou VoiceOver) et la grille WCAG 2.1 AA.

    Étant donné la liste des Todos avec un Todo fait et un Todo non fait
    Quand un auditeur parcourt la page avec un lecteur d'écran et la grille WCAG 2.1 AA
    Alors chaque critère WCAG 2.1 AA applicable est respecté
