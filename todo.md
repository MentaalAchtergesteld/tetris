## Core Mechanics
- [ ] Vanish zone
    - [ ] Making 'Board' 40 high (20 visible, 20 for a hidden buffer)
    - [ ] Updating 'BoardWidget' to properly render this new buffer
- [ ] Fixing spawn logic
    - [ ] Pieces spawn on row 18/19 (just above the visible part)
    - [ ] Proper 'block out' logic (if spawn location isn't free -> game over)
- [ ] Lock delay limit
    - [ ] Adding a limit (max 15) to spinning/moving before a piece locks
