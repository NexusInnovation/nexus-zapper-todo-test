# language: fr
Fonctionnalité: Hôte de l'API et accès aux données (comportement existant)

  @regression @RG-04
  Scénario: Le point de santé de l'API répond qu'elle est disponible
    Étant donné que l'API est démarrée
    Quand on consulte le point de santé de l'API
    Alors l'API répond avec succès « Healthy »
