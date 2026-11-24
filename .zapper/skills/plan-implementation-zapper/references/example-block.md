# Example: filled-in block

For illustration only. It plans the story `1234-add-item-to-cart` (the example story of
`refine-input-zapper`), whose BDD requirements are `1234-R01` to `1234-R07`. The block would live at
`.zapper/run/plan/cart/cart.md`, next to its `hypotheses.md`.

What it shows:

- Binding shared contracts and invariants, suggested touchpoints and implementation freedom.
- The block owns the step definitions of the scenarios tagged with its requirement IDs, and depends
  on the BDD runner block.
- Conventions come from the project's own skills and from existing code to model on.
- The story's open hypothesis is carried over with an ID and a ready-to-copy marker.

## README.md building blocks

```markdown
| #   | Block                                        | Depends on | Requirements      | Hypotheses |
| --- | -------------------------------------------- | ---------- | ----------------- | ---------- |
| 1   | [BDD runner](bdd-runner/bdd-runner.md)       | —          | none              | 0          |
| 2   | [Catalog read](catalog-read/catalog-read.md) | 1          | none              | 0          |
| 3   | [Cart](cart/cart.md)                         | 1, 2       | 1234-R01…1234-R07 | 1          |
```

## cart/cart.md

```markdown
# Cart

## Purpose

Keeps the session cart and lets the shopper add a product to it from the product page.

## Requirements

- 1234-R01…1234-R07

## Scenarios

Write the step definitions of these scenarios, reusing the shared steps of the BDD runner block, and
run them by tag until they pass.

- [1234-add-item-to-cart.feature](../../../behaviour-driven-development/stories/1234-add-item-to-cart/1234-add-item-to-cart.feature):
  `@1234-R01`, `@1234-R02`, `@1234-R03`, `@1234-R04`, `@1234-R05`, `@1234-R06`, `@1234-R07`

## Depends on

- [BDD runner](../bdd-runner/bdd-runner.md): runner, shared steps, test fixtures
- [Catalog read](../catalog-read/catalog-read.md): product and stock lookup

## Contracts and invariants

- Cart owns session cart state. Adding an existing product merges quantities; rejected additions
  leave the cart unchanged. The header consumes this block's cart response instead of storing a
  separate count.
- Product and stock lookup is owned by Catalog read; consume its contract without redefining it.
- Validate the quantity server-side and mirror the rule in the selector (1234-H01).
- Internal file names, helpers and state decomposition are left to the implementer.

## Touchpoints

### Modules and components

- Cart module (new): session cart, add-item rule (merge into an existing line).
- Header (existing): shows the cart badge.

### Frontend pages

- Product page (`/products/:productId`): Add to cart button, quantity selector, confirmation
  message.

### API endpoints

| Method | Route             | Parameters                                 | Response           | Purpose                 |
| ------ | ----------------- | ------------------------------------------ | ------------------ | ----------------------- |
| GET    | `/api/cart`       | none (session cookie)                      | lines, total units | Read the cart and badge |
| POST   | `/api/cart/items` | body: `productId: string`, `quantity: int` | updated cart       | Add or merge a line     |

### Data

| Entity or table | Access         | Source system                |
| --------------- | -------------- | ---------------------------- |
| Cart, CartLine  | created, write | new (session store)          |
| Product stock   | read           | existing (inventory service) |

## Conventions and references

- Skill `api-endpoint-conventions`: route naming, validation and error responses.
- [src/web/catalog/product-page](../../../../src/web/catalog/product-page): page to extend.
- [D02](../decisions.md): the cart is kept in the server session store.

## Completion evidence

- Owned scenarios pass; focused checks cover merging quantities and leaving state unchanged on
  rejected additions. Existing product and header journeys remain valid.

## Hypotheses

[hypotheses.md](hypotheses.md): 1234-H01. Add its TODO at the specified rule placement.
```

## cart/hypotheses.md

```markdown
# Hypotheses: Cart

## 1234-H01: Maximum quantity per product

- **Marker**:
  `TODO(1234-H01): Assumed a maximum of 10 units per product. Confirm the limit with the product owner.`
- **Where**: the authoritative add-item quantity rule used by `POST /api/cart/items`.
```

In the code, the implementer then writes, for example in TypeScript:

```typescript
// TODO(1234-H01): Assumed a maximum of 10 units per product. Confirm the limit with the product owner.
const MAX_QUANTITY_PER_PRODUCT = 10;
```
