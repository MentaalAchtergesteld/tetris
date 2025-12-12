## Core Mechanics
- [x] Vanish zone
    - [x] Making 'Board' 40 high (20 visible, 20 for a hidden buffer)
    - [x] Updating 'BoardWidget' to properly render this new buffer
- [x] Fixing spawn logic
    - [x] Pieces spawn on row 18/19 (just above the visible part)
    - [x] Proper 'block out' logic (if spawn location isn't free -> game over)
- [ ] Lock delay limit
    - [ ] Adding a limit (max 15) to spinning/moving before a piece locks
