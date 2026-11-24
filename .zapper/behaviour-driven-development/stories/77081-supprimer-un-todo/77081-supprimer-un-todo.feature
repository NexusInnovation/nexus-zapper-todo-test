# language: fr
Fonctionnalité: Supprimer un Todo

  @77081-R01
  Scénario: Chaque Todo affiche un bouton « Supprimer »
    Étant donné un Todo existant « Acheter du lait »
    Quand j'ouvre la liste des Todos
    Alors le Todo « Acheter du lait » affiche un bouton « Supprimer »

  @77081-R02
  Scénario: Une confirmation est demandée avant la suppression
    Étant donné un Todo existant « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Quand je clique sur « Supprimer » pour le Todo « Acheter du lait »
    Alors la confirmation « Supprimer « Acheter du lait » ? » est demandée
    Et le Todo « Acheter du lait » n'est pas encore supprimé

  @77081-R03
  Scénario: Un Todo supprimé n'apparaît plus dans la liste
    Étant donné un Todo existant « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Quand je supprime le Todo « Acheter du lait » en confirmant
    Alors le Todo « Acheter du lait » n'apparaît plus dans la liste

  @77081-R03
  Scénario: Un Todo supprimé n'apparaît plus après rechargement de la page
    Étant donné un Todo existant « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Et que je supprime le Todo « Acheter du lait » en confirmant
    Quand je recharge la page
    Alors le Todo « Acheter du lait » n'apparaît plus dans la liste

  @77081-R04
  Scénario: Annuler la confirmation conserve le Todo
    Étant donné un Todo existant « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Quand je clique sur « Supprimer » pour le Todo « Acheter du lait » et que j'annule la confirmation
    Alors le Todo « Acheter du lait » apparaît dans la liste

  @77081-R05
  Scénario: Seul le Todo ciblé par son Id est supprimé parmi deux Todos de même titre
    Étant donné deux Todos existants « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Quand je supprime en confirmant le premier des deux Todos « Acheter du lait »
    Alors un seul Todo « Acheter du lait » reste dans la liste
    Et c'est le second, dont l'Id n'était pas ciblé

  @77081-R06
  Scénario: Supprimer un Todo inexistant retourne une erreur « introuvable »
    Quand je supprime un Todo dont l'Id n'existe pas
    Alors une erreur « introuvable » est retournée

  @77081-R07
  Scénario: Le message de liste vide s'affiche après la suppression du dernier Todo
    Étant donné un Todo existant « Acheter du lait »
    Et que c'est le seul Todo
    Et que j'ouvre la liste des Todos
    Quand je supprime le Todo « Acheter du lait » en confirmant
    Alors le message « Aucun Todo pour l'instant. » s'affiche
