# language: fr
Fonctionnalité: Créer un Todo

  @77078-R01
  Scénario: Le formulaire de création est affiché
    Quand j'ouvre la liste des Todos
    Alors un champ « Titre du Todo » est affiché avec le texte indicatif « Nouveau Todo… »
    Et un bouton « Ajouter » est affiché

  @77078-R02
  Scénario: Un titre de 200 caractères est accepté
    Étant donné que j'ouvre la liste des Todos
    Quand je crée un Todo avec un titre de 200 caractères
    Alors le Todo est ajouté à la liste

  @77078-R02
  Scénario: Un titre de plus de 200 caractères est refusé
    Étant donné que j'ouvre la liste des Todos
    Quand je crée un Todo avec un titre de 201 caractères
    Alors la création est refusée
    Et un message d'erreur s'affiche sous le champ
    Et aucun Todo n'est ajouté

  @77078-R02
  Scénario: La longueur maximale est vérifiée après retrait des espaces de début et de fin
    Étant donné que j'ouvre la liste des Todos
    Quand je crée un Todo avec un titre de 200 caractères entouré d'espaces
    Alors le Todo est ajouté à la liste

  @77078-R03
  Plan du scénario: Créer un Todo avec un titre non vide
    Étant donné que j'ouvre la liste des Todos
    Quand je saisis le titre « Acheter du lait » et que je valide avec <action>
    Alors un Todo « Acheter du lait » est enregistré avec un nouvel Id interne unique
    Et son état « fait » est faux

    Exemples:
      | action                |
      | le bouton « Ajouter » |
      | la touche Entrée      |

  @77078-R04
  Scénario: Les espaces de début et de fin du titre sont retirés
    Étant donné que j'ouvre la liste des Todos
    Quand je crée un Todo avec le titre «   Acheter du lait   »
    Alors un Todo « Acheter du lait » est enregistré

  @77078-R05
  Scénario: Le formulaire est réinitialisé après une création réussie
    Étant donné que j'ouvre la liste des Todos
    Et que la création d'un Todo avec un titre vide a affiché le message « Le titre est obligatoire. »
    Quand je crée un Todo avec le titre « Acheter du lait »
    Alors le champ « Titre du Todo » est vide
    Et aucun message d'erreur n'est affiché
    Et le Todo « Acheter du lait » apparaît dans la liste

  @77078-R06
  Plan du scénario: Un titre vide ou composé uniquement d'espaces est refusé
    Étant donné que j'ouvre la liste des Todos
    Quand je crée un Todo avec <titre>
    Alors la création est refusée
    Et aucun Todo n'est ajouté
    Et le message « Le titre est obligatoire. » s'affiche sous le champ

    Exemples:
      | titre                                  |
      | un titre vide                          |
      | un titre composé uniquement d'espaces  |

  @77078-R07
  Scénario: Les doublons de titre sont permis
    Étant donné un Todo existant « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Quand je crée un Todo avec le titre « Acheter du lait »
    Alors deux Todos « Acheter du lait » existent
    Et leurs Id sont différents

  @77078-R08
  Scénario: Un Todo créé est toujours présent après rechargement de la page
    Étant donné que j'ouvre la liste des Todos
    Et que je crée un Todo avec le titre « Acheter du lait »
    Quand je recharge la page
    Alors le Todo « Acheter du lait » apparaît dans la liste
