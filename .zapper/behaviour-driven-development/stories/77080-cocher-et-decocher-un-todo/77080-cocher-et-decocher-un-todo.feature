# language: fr
Fonctionnalité: Cocher et décocher un Todo

  @77080-cocher-et-decocher-un-todo-R01
  Scénario: Chaque Todo affiche une case « Fait » reflétant son état
    Étant donné un Todo fait « Appeler le plombier »
    Et un Todo non fait « Acheter du lait »
    Quand j'ouvre la liste des Todos
    Alors la case « Fait » du Todo « Appeler le plombier » est cochée
    Et la case « Fait » du Todo « Acheter du lait » n'est pas cochée

  @77080-cocher-et-decocher-un-todo-R02
  Scénario: Cocher un Todo non fait le marque comme fait
    Étant donné un Todo non fait « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Quand je coche le Todo « Acheter du lait »
    Alors l'état « fait » du Todo « Acheter du lait » est vrai
    Et le titre « Acheter du lait » est barré et grisé

  @77080-cocher-et-decocher-un-todo-R02
  Scénario: L'état coché est conservé après rechargement de la page
    Étant donné un Todo non fait « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Et que je coche le Todo « Acheter du lait »
    Quand je recharge la page
    Alors la case « Fait » du Todo « Acheter du lait » est cochée

  @77080-cocher-et-decocher-un-todo-R03
  Scénario: Décocher un Todo fait le remet à non fait
    Étant donné un Todo fait « Appeler le plombier »
    Et que j'ouvre la liste des Todos
    Quand je décoche le Todo « Appeler le plombier »
    Alors l'état « fait » du Todo « Appeler le plombier » est faux
    Et le titre « Appeler le plombier » n'est ni barré ni grisé

  @77080-cocher-et-decocher-un-todo-R04
  Scénario: Cocher un Todo ne modifie ni son titre, ni son Id, ni les autres Todos
    Étant donné un Todo non fait « Acheter du lait »
    Et un Todo non fait « Appeler le plombier »
    Et que j'ouvre la liste des Todos
    Quand je coche le Todo « Acheter du lait »
    Alors le Todo coché garde le titre « Acheter du lait » et le même Id
    Et l'état « fait » du Todo « Appeler le plombier » est toujours faux

  @77080-cocher-et-decocher-un-todo-R04
  Scénario: Décocher un Todo ne modifie ni son titre, ni son Id, ni les autres Todos
    Étant donné un Todo fait « Acheter du lait »
    Et un Todo fait « Appeler le plombier »
    Et que j'ouvre la liste des Todos
    Quand je décoche le Todo « Acheter du lait »
    Alors le Todo décoché garde le titre « Acheter du lait » et le même Id
    Et l'état « fait » du Todo « Appeler le plombier » est toujours vrai

  @77080-cocher-et-decocher-un-todo-R05
  Scénario: Changer l'état d'un Todo inexistant retourne une erreur « introuvable »
    Quand je change l'état « fait » d'un Todo dont l'Id n'existe pas
    Alors une erreur « introuvable » est retournée
