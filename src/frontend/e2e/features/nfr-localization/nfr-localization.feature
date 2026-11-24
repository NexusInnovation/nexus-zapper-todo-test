# language: fr
Fonctionnalité: Localisation

  @nfr-localization-R01
  Scénario: L'interface est en français par défaut
    Étant donné un visiteur sans préférence de langue enregistrée
    Quand j'ouvre la liste des Todos
    Alors la page s'intitule « Mes Todos »
    Et le bouton « Ajouter » est affiché

  @nfr-localization-R01
  Scénario: L'interface passe en anglais avec le sélecteur de langue
    Étant donné que j'ouvre la liste des Todos
    Quand je choisis l'anglais dans le sélecteur de langue
    Alors les libellés et messages de la liste des Todos sont affichés en anglais
    Et aucun libellé de la liste des Todos ne reste en français

  @nfr-localization-R01
  Scénario: Les messages d'erreur sont traduits en anglais
    Étant donné que j'ouvre la liste des Todos
    Et que je choisis l'anglais dans le sélecteur de langue
    Quand je crée un Todo avec un titre vide
    Alors le message d'erreur est affiché en anglais

  @nfr-localization-R01
  Scénario: L'interface revient en français avec le sélecteur de langue
    Étant donné que j'ouvre la liste des Todos
    Et que je choisis l'anglais dans le sélecteur de langue
    Quand je choisis le français dans le sélecteur de langue
    Alors la page s'intitule « Mes Todos »
