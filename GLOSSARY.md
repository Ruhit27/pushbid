# Push Bid

A public leaderboard of products where position is decided only by how much each product's owner has spent. There are no votes and no reviews.

## Language

### Listings

**Listing**:
One product website or X @handle shown on the leaderboard, identified by its normalized link.
_Avoid_: Product (on the board), entry, item, ad

**Category**:
The single topic a Listing belongs to, which also has its own boards.
_Avoid_: Tag, section

**Click**:
One visit sent from Push Bid to a Listing's link.
_Avoid_: View, visit, impression

### Ranking

**Spend**:
The total amount put toward a Listing within a Board's time window.
_Avoid_: Bid, price, budget

**Claim**:
One paid act of putting an amount toward a Listing, which places it on the boards.
_Avoid_: Bid, purchase, order

**Raise**:
A Claim made on a Listing that is already on the board, adding to its Spend.
_Avoid_: Rebid, top-up

**Rank**:
A Listing's position on a Board. Higher Spend ranks higher, and on equal Spend the Listing that got there first keeps the higher Rank.
_Avoid_: Spot, place, position

**Board**:
An ordered ranking of Listings by Spend over a time window, overall or within one Category.
_Avoid_: Leaderboard (when a specific board is meant), list

**All-time Board**:
The Board ranking Listings by everything they have ever spent. It never resets.

**Today Board**:
The Board ranking Listings by Spend since the current UTC midnight. It resets at the next UTC midnight.

**Daily Board**:
The Board for one past or current UTC calendar day. Once that day ends, it is frozen as an archive.

**Checkout**:
A Claim waiting for its payment through Dodo Payments. It becomes a Claim only once the payment succeeds; users hold no balance.
_Avoid_: Order, pending claim, credits

**Demo Listing**:
A Listing added as sample content, which can be removed in bulk before launch.
_Avoid_: Fake listing, seed

### People

**Admin**:
A user who can create, edit and remove Listings and Categories.
_Avoid_: Moderator, owner
