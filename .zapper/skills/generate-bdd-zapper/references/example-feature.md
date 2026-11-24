# Example: filled-in story

Shortened from the example story `1234-add-item-to-cart` of `refine-input-zapper`. The story's
acceptance criteria stay in `.zapper/input/`; the requirement IDs exist only as tags in the
`.feature` file.

Criteria of the story (in `.zapper/input/stories/1234-add-item-to-cart/`), with the ID each one
gets:

- `1234-R01`: The product page shows an "Add to cart" button when the product is in stock.
- `1234-R02`: The "Add to cart" button is disabled and labelled "Out of stock" when the product has
  no stock.
- `1234-R03`: Adding a product already in the cart increases its quantity instead of adding a second
  line.
- `1234-R04`: After the product is added, the cart badge in the header shows the total number of
  units.

## 1234-add-item-to-cart.feature

```gherkin
Feature: Add an item to the cart

  Background:
    Given a shopper on the page of a product

  @1234-R01
  Scenario: Add to cart is offered when the product is in stock
    Given the product is in stock
    Then the "Add to cart" button is enabled

  @1234-R02
  Scenario: Add to cart is disabled when the product is out of stock
    Given the product has no stock
    Then the "Add to cart" button is disabled
    And its label is "Out of stock"

  @1234-R03
  Scenario: Adding a product already in the cart increases its quantity
    Given the product is already in the cart with a quantity of 1
    When the shopper adds 2 units of the product
    Then the cart has one line for the product
    And the quantity of that line is 3

  @1234-R04
  Scenario: The cart badge shows the total number of units
    Given the cart holds 2 units
    When the shopper adds 3 units of the product
    Then the cart badge shows 5
```

Points to copy: tags on the line above `Scenario`, business wording instead of screen mechanics,
one behaviour per scenario, scenario names that state the behaviour. When the project's language
is not English, add the `# language: <code>` header and use that language's keywords.

## nfr-performance.feature

Non-functional requirements are tagged the same way, in the `nfr-<category>` folder. Statements of
`non-functional-requirements.md`, with their IDs:

- `nfr-performance-R01`: Searching the catalogue and listing the orders stay fast on large
  volumes; filtering and paging are done on the server.
- `nfr-security-R04`: Hosting stays in the required geographic region.

```gherkin
Feature: Performance

  Background:
    Given the realistic-volume dataset is loaded

  @nfr-performance-R01
  Scenario Outline: A large list loads within its threshold
    When the user opens the "<screen>" screen
    Then the first page is displayed in at most <seconds> seconds

    Examples:
      | screen    | seconds |
      | Catalogue | 3       |
      | Orders    | 2       |

  @nfr-performance-R01
  Scenario: Paging is done on the server
    When the user opens the "Catalogue" screen
    Then only the first page of results and the total count are loaded
```

```gherkin
Feature: Security

  @nfr-security-R04 @manual
  Scenario: Hosting region
    No automated check can read the region of the hosted resources from the application.

    Given the production resources are listed in the hosting portal
    When a reviewer reads the region of each resource
    Then every region is in the required geographic area
```

Points to copy: the dataset step and a number plus unit on every timing check, one scenario for
the threshold and one for server-side paging, thresholds proposed then confirmed in the
walkthrough, and for a `@manual` scenario the reason in its description plus steps a
human can carry out. The glue excludes `@manual` from the run command.
