# language: fr
Fonctionnalité: Consulter la liste des Todos

  @77079-R01
  Scénario: La page s'intitule « Mes Todos »
    Quand j'ouvre la liste des Todos
    Alors la page s'intitule « Mes Todos »

  @77079-R02
  Scénario: Chaque Todo est affiché avec son titre et sa case « fait », du plus ancien au plus récent
    Étant donné les Todos suivants, créés dans cet ordre :
      | titre               | fait |
      | Acheter du lait     | non  |
      | Appeler le plombier | oui  |
    Quand j'ouvre la liste des Todos
    Alors la liste affiche, dans cet ordre :
      | titre               | case « fait » |
      | Acheter du lait     | non cochée    |
      | Appeler le plombier | cochée        |

  @77079-R03
  Scénario: Un Todo fait est visuellement distingué
    Étant donné un Todo fait « Appeler le plombier »
    Et un Todo non fait « Acheter du lait »
    Quand j'ouvre la liste des Todos
    Alors le titre « Appeler le plombier » est barré et grisé
    Et le titre « Acheter du lait » n'est ni barré ni grisé

  @77079-R04
  Scénario: Un message indique que la liste est vide
    Étant donné aucun Todo
    Quand j'ouvre la liste des Todos
    Alors le message « Aucun Todo pour l'instant. » s'affiche

  @77079-R04
  Scénario: Le message de liste vide disparaît dès qu'il existe un Todo
    Étant donné aucun Todo
    Et que j'ouvre la liste des Todos
    Quand je crée un Todo avec le titre « Acheter du lait »
    Alors le message « Aucun Todo pour l'instant. » n'est plus affiché

  @77079-R05
  Scénario: Deux Todos de même titre sont affichés distinctement
    Étant donné deux Todos existants « Acheter du lait »
    Quand j'ouvre la liste des Todos
    Alors la liste affiche deux lignes « Acheter du lait »

  @77079-R06
  Scénario: La liste affiche les Todos enregistrés côté serveur après rechargement
    Étant donné un Todo existant « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Quand je recharge la page
    Alors le Todo « Acheter du lait » apparaît dans la liste
