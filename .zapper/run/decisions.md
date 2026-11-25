# Décisions assumées pendant le run — zapper/run-20261124-2137

Décisions prises pendant `/goal` là où le plan et l'entrée étaient muets ou en défaut. Chacune est
un écart au plan, porte son `TODO(A<nn>)` dans le code et reste `assumed` jusqu'à la revue humaine
de la signature.

## A01: Colonnes de date en DATETIMEOFFSET(7)

- **Category**: schema
- **Context**: le plan décrit `CreatedAt`/`UpdatedAt` de la table `Todo` en `datetime2`. Les
  entités héritent de `BaseEntity`, dont les dates sont des `DateTimeOffset`, et le mapping standard
  Dapper/RepoDb de la solution associe `DateTimeOffset` à `DATETIMEOFFSET`.
- **Options**: (1) `datetime2` avec une conversion dans le dépôt ; (2) `DATETIMEOFFSET(7)`, le
  mapping standard sans conversion.
- **Choice**: (2) `DATETIMEOFFSET(7)`.
- **Justification**: aucune conversion ni perte de décalage horaire ; c'est le type que le
  socle produit pour toutes les entités ; l'ordre du plus ancien au plus récent (77079-R02) est
  inchangé.
- **Code**: `src/backend/Nexus.ZapperTodo.Database/dbo/Tables/Todo.sql` (`TODO(A01)`).
- **Deviation from plan**: yes
- **Status**: assumed
- **Follow-up**: confirmer le type lors de la revue du schéma avant le premier déploiement de la base.

## A02: Correction hors plan du formatage du socle backend

- **Category**: other (outillage)
- **Context**: la commande de lint configurée `dotnet format --verify-no-changes` échouait déjà
  sur la ligne de base (ordre des `using`, accolades, paramètre `configuration` inutilisé), ce qui
  rendait la condition 3 du goal impossible sans toucher du code hors des blocs.
- **Options**: (1) laisser le lint en échec ; (2) appliquer le formateur sur le code existant et
  construire la fabrique de connexions à partir du paramètre `configuration`.
- **Choice**: (2), dans un commit séparé `style(backend)` (1aa99eb, `Block: none`).
- **Justification**: changement mécanique sans effet de comportement (tests existants verts) ;
  aucune règle de lint désactivée. Il réordonne aussi les `using` du test existant
  `InfrastructureServiceRegistrationTests.cs` (RG-04).
- **Code**: `src/backend/Nexus.ZapperTodo.Infrastructure/ConfigureServices.cs` (`TODO(A02)`).
- **Deviation from plan**: yes
- **Status**: assumed
- **Follow-up**: aucune hors code.

## A03: Identifiant non GUID répondu en 404 (retirée)

- **Category**: contract
- **Context**: un premier jet de l'API répondait 404 à un identifiant qui n'est pas un GUID.
- **Options**: (1) 404 ; (2) 400, comme le contrat du plan.
- **Choice**: retirée. Le commit 398fdaa répond 400, conformément au plan ; il ne reste ni écart ni
  marqueur dans le code.
- **Justification**: le plan tranche ; un écart n'était pas justifié.
- **Deviation from plan**: no (plus depuis 398fdaa)
- **Status**: superseded
- **Follow-up**: aucun.

## A04: Méta `localErrors` dans le QueryProvider

- **Category**: architecture (frontend)
- **Context**: le QueryProvider standard affiche toute erreur de requête dans le toast global. La
  liste et les formulaires de Todo doivent afficher leurs erreurs sur place (champ en erreur,
  alerte de liste) sans toast en double.
- **Options**: (1) gérer chaque erreur avec `throwOnError`/try-catch dans les composants ;
  (2) une méta `localErrors` sur les requêtes et mutations, que le provider respecte.
- **Choice**: (2).
- **Justification**: extension minime et déclarative du socle ; le comportement par défaut ne change
  pas pour les autres requêtes.
- **Code**: `src/frontend/src/core/providers/QueryProvider.tsx` (`TODO(A04)`).
- **Deviation from plan**: yes
- **Status**: assumed
- **Follow-up**: aucune hors code.

## A05: `apiFetch` dans `core/api` plutôt que `core/auth`

- **Category**: architecture (frontend)
- **Context**: le standard place le client HTTP dans `core/auth` pour joindre le jeton ; l'application
  est anonyme (nfr-security-R01), il n'y a pas de jeton.
- **Options**: (1) `core/auth` vide d'authentification ; (2) `core/api`.
- **Choice**: (2).
- **Justification**: le nom reflète le rôle ; le déplacement sera trivial si l'authentification
  arrive.
- **Code**: `src/frontend/src/core/api/apiFetch.ts` (`TODO(A05)`).
- **Deviation from plan**: yes
- **Status**: assumed
- **Follow-up**: à revoir si l'authentification Entra ID est ajoutée.

## A06: Case « fait » en `Checkbox` MUI plutôt que l'atome de formulaire

- **Category**: architecture (frontend)
- **Context**: l'atome `Checkbox` du socle exige un contexte react-hook-form ; la case « fait » d'une
  ligne n'est pas un formulaire.
- **Options**: (1) envelopper chaque ligne dans un formulaire ; (2) `Checkbox` MUI directe.
- **Choice**: (2).
- **Justification**: pas de formulaire artificiel par ligne ; même rendu MUI.
- **Code**: `src/frontend/src/modules/todos/TodoListPage/TodoListItem.tsx` (`TODO(A06)`).
- **Deviation from plan**: yes
- **Status**: assumed
- **Follow-up**: aucune hors code.

## A07: Case « fait » `aria-disabled` pendant sa requête

- **Category**: accessibility
- **Context**: le plan dit la case « désactivée pendant sa requête ». Un `disabled` natif fait
  perdre le focus clavier (il retombe sur `body`), ce qui fait échouer le parcours clavier de
  nfr-accessibility-R01.
- **Options**: (1) `disabled` natif ; (2) `aria-disabled="true"`, changement ignoré tant que la
  requête court, opacité réduite.
- **Choice**: (2).
- **Justification**: même protection contre le double envoi, annoncée aux technologies
  d'assistance, et le focus reste sur la case (WCAG 2.4.3).
- **Code**: `src/frontend/src/modules/todos/TodoListPage/TodoListItem.tsx` (`TODO(A07)`).
- **Deviation from plan**: yes
- **Status**: assumed
- **Follow-up**: à inclure dans l'audit manuel lecteur d'écran (scénario `@manual`).

## A08: Test existant `app.smoke.test.tsx` mis à jour (RG-01)

- **Category**: other (test existant modifié)
- **Context**: test existant de la zone **RG-01** (coquille de l'application). La route par défaut
  affiche désormais la page « Mes Todos » au lieu du tableau de bord (77079-R01), et la page a
  besoin des providers de requêtes et de toast.
- **Options**: (1) supprimer le test ; (2) le garder et l'adapter au nouveau titre et aux providers.
- **Choice**: (2), dans le commit bc07d11 (bloc todo-page).
- **Justification**: le test garde son intention (route par défaut et coquille avec la route
  active) ; seul le comportement exigé par 77079-R01 change.
- **Code**: `src/frontend/src/test/app.smoke.test.tsx` (`TODO(A08)`).
- **Deviation from plan**: yes
- **Status**: assumed
- **Follow-up**: aucune hors code.

## A09: Test existant `InfrastructureServiceRegistrationTests.cs` étendu (RG-04)

- **Category**: other (test existant modifié)
- **Context**: test existant de la zone **RG-04** (hôte de l'API et accès aux données). Le dépôt
  `ITodoRepository` doit être enregistré (77078-R08, 77079-R06) ; ses `using` avaient aussi été
  réordonnés par A02.
- **Options**: (1) un nouveau fichier de test ; (2) un cas de plus dans le fichier existant.
- **Choice**: (2), dans le commit ab08eb7 (bloc todo-api). Aucun cas existant n'est modifié.
- **Justification**: l'enregistrement des services est déjà testé là.
- **Code**: `src/backend/tests/Nexus.ZapperTodo.UnitTests/Infrastructure/InfrastructureServiceRegistrationTests.cs` (`TODO(A09)`).
- **Deviation from plan**: yes
- **Status**: assumed
- **Follow-up**: aucune hors code.

## A10: Nom accessible du sélecteur de langue avec la langue visible (RG-02)

- **Category**: accessibility
- **Context**: axe signalait `label-content-name-mismatch` : le bouton affiche « fr » alors que son
  nom était « Changer de langue » (WCAG 2.5.3, nfr-accessibility-R01). Corriger change le nom
  accessible, que le test de régression existant de **RG-02** (sélecteur de langue,
  `e2e/steps/regression/shell.steps.ts`) reconnaissait par une expression exacte.
- **Options**: (1) parenthèse « (FR) » (ignorée par axe) ; (2) « Changer de langue : FR » /
  « Change language: EN » ; (3) masquer le texte visible.
- **Choice**: (2), et l'expression du test de régression accepte le suffixe `: FR|EN` ; les
  assertions du test sont inchangées.
- **Justification**: le nom contient le texte visible, sans perte d'information.
- **Code**: `src/frontend/src/core/layout/components/LanguageSwitcher.tsx`,
  `src/frontend/e2e/steps/regression/shell.steps.ts` (`TODO(A10)`).
- **Deviation from plan**: yes
- **Status**: assumed
- **Follow-up**: aucune hors code.

## A11: Frontend du runner BDD servi en build de production

- **Category**: other (outillage de test)
- **Context**: nfr-performance-R01 (< 2 s, 100 000 Todos, « serveurs chauds ») mesurait 2,1 à 2,4 s
  avec le serveur de développement Vite (modules non groupés, React en mode développement), alors
  que SQL répond en ~14 ms à chaud.
- **Options**: (1) garder le serveur de développement ; (2) `vite build` puis `vite preview`
  (bundle réellement livré), mesure dans le navigateur (`performance.now()` au rAF) et
  préchauffage de l'API dans l'étape de volume.
- **Choice**: (2) ; seuil et scénario inchangés.
- **Justification**: la mesure porte sur ce que l'utilisateur charge ; résultat ~330 ms.
- **Code**: `src/frontend/playwright.config.ts` (`TODO(A11)`).
- **Deviation from plan**: yes
- **Status**: assumed
- **Follow-up**: mesurer aussi en environnement déployé (latence réseau réelle).
