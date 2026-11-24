# language: fr
Fonctionnalité: Performance

  Contexte:
    Étant donné que le jeu de données de volume réaliste est chargé

  @nfr-performance-R01
  Scénario: La liste des Todos s'affiche en moins de 2 secondes avec 100 000 Todos
    Quand j'ouvre la liste des Todos
    Alors la liste est utilisable en moins de 2 secondes

  @nfr-performance-R01
  Scénario: La liste ne charge pas tous les Todos dans le navigateur
    Quand j'ouvre la liste des Todos
    Alors seule la première page de Todos et le nombre total de Todos sont chargés depuis le serveur
