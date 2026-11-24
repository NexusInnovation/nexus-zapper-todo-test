# language: fr
Fonctionnalité: Sélecteur de langue (comportement existant)

  Contexte:
    Étant donné que l'interface est affichée en anglais

  @regression @RG-02
  Scénario: Le sélecteur propose l'anglais et le français
    Quand j'ouvre le sélecteur de langue
    Alors le sélecteur propose « English » et « Français »

  @regression @RG-02
  Scénario: Passer l'interface en français
    Étant donné que je suis sur la page introuvable
    Quand je choisis le français dans le sélecteur de langue
    Alors la page introuvable affiche le message « Page introuvable. »

  @regression @RG-02
  Scénario: Repasser l'interface en anglais
    Étant donné que je suis sur la page introuvable
    Et que je choisis le français dans le sélecteur de langue
    Quand je choisis l'anglais dans le sélecteur de langue
    Alors la page introuvable affiche le message « Page not found. »
