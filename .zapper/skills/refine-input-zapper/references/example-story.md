# Example story

A filled-in story file, for illustration only. It would live at
`.zapper/input/stories/1234-add-item-to-cart/1234-add-item-to-cart.md`, next to an `assets/`
folder holding `product-page.png` and `cart-badge.png`.

What it shows:

- The description is the user story, with only the context needed to read the criteria.
- Each criterion is one observable behaviour with concrete values, written so a test can check it.
- The only hypothesis left is one the team could not settle during the walkthrough.
- Mockups point to the story's own `assets/`.

---

```markdown
# Add an item to the cart

## Description

As a shopper, I want to add a product to my cart from its product page so that I can buy it
later in the same visit.

The cart is kept for the browser session only; signed-in carts are out of scope.

## Hypotheses

- The quantity selector allows at most 10 units per product. Open because: the mockup shows a
  selector but no source states the limit.

## Acceptance criteria

- The product page shows an "Add to cart" button when the product is in stock.
- The "Add to cart" button is disabled and labelled "Out of stock" when the product has no stock.
- Selecting "Add to cart" adds the chosen quantity of the product to the cart.
- Adding a product already in the cart increases its quantity instead of adding a second line.
- After the product is added, the cart badge in the header shows the total number of units.
- After the product is added, a confirmation message names the product and stays visible for
  5 seconds.
- The quantity selector does not accept a value lower than 1.

## Mockups

![Product page with the Add to cart button](./assets/product-page.png)

![Header cart badge after adding a product](./assets/cart-badge.png)

## Origin

Work item 1234; prototype screen "Product"; code src/web/catalog/product-page
```
