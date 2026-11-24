# language: fr
Fonctionnalité: Modifier le titre d'un Todo

  @77080-R01
  Plan du scénario: Ouvrir le mode édition du titre
    Étant donné un Todo existant « Acheter du lait »
    Et que j'ouvre la liste des Todos
    Quand <action> du Todo « Acheter du lait »
    Alors le titre est remplacé par un champ « Modifier le titre » prérempli avec « Acheter du lait »
    Et les boutons « Enregistrer » et « Annuler » sont affichés

    Exemples:
      | action                               |
      | je clique sur le bouton « Modifier » |
      | je double-clique sur le titre        |

  @77080-R02
  Plan du scénario: Enregistrer un nouveau titre
    Étant donné que le Todo « Acheter du lait » est en mode édition
    Quand je remplace le titre par « Acheter du pain » et que je valide avec <action>
    Alors le Todo affiche le titre « Acheter du pain »
    Et son Id est inchangé
    Et le mode édition est fermé

    Exemples:
      | action                    |
      | le bouton « Enregistrer » |
      | la touche Entrée          |

  @77080-R03
  Scénario: Les espaces de début et de fin du titre modifié sont retirés
    Étant donné que le Todo « Acheter du lait » est en mode édition
    Quand je remplace le titre par «   Acheter du pain   » et que j'enregistre
    Alors le Todo affiche le titre « Acheter du pain »

  @77080-R04
  Plan du scénario: Un titre modifié vide ou composé uniquement d'espaces est refusé
    Étant donné que le Todo « Acheter du lait » est en mode édition
    Quand je remplace le titre par <titre> et que j'enregistre
    Alors la modification est refusée
    Et un message d'erreur s'affiche dans le champ
    Et le titre enregistré du Todo reste « Acheter du lait »

    Exemples:
      | titre                                 |
      | un titre vide                         |
      | un titre composé uniquement d'espaces |

  @77080-R05
  Plan du scénario: Annuler la modification du titre
    Étant donné que le Todo « Acheter du lait » est en mode édition
    Et que j'ai remplacé le titre par « Acheter du pain » sans enregistrer
    Quand j'annule avec <action>
    Alors le mode édition est fermé
    Et le Todo affiche le titre « Acheter du lait »

    Exemples:
      | action                |
      | le bouton « Annuler » |
      | la touche Échap       |

  @77080-R06
  Scénario: Modifier le titre d'un Todo inexistant retourne une erreur « introuvable »
    Quand je modifie le titre d'un Todo dont l'Id n'existe pas
    Alors une erreur « introuvable » est retournée

  @77080-R07
  Scénario: Un titre modifié de 200 caractères est accepté
    Étant donné que le Todo « Acheter du lait » est en mode édition
    Quand je remplace le titre par un titre de 200 caractères et que j'enregistre
    Alors le Todo affiche le nouveau titre de 200 caractères

  @77080-R07
  Scénario: Un titre modifié de plus de 200 caractères est refusé
    Étant donné que le Todo « Acheter du lait » est en mode édition
    Quand je remplace le titre par un titre de 201 caractères et que j'enregistre
    Alors la modification est refusée
    Et un message d'erreur s'affiche dans le champ
    Et le titre enregistré du Todo reste « Acheter du lait »

  @77080-R08
  Scénario: Un titre modifié est conservé après rechargement de la page
    Étant donné que le Todo « Acheter du lait » est en mode édition
    Et que je remplace le titre par « Acheter du pain » et que j'enregistre
    Quand je recharge la page
    Alors le Todo affiche le titre « Acheter du pain »
