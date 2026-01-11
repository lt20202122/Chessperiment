# Visual Feedback System - Implementation Plan

## Design Philosophy

- **Minimal & Clear**: Don't clutter the piece, use small badges/indicators
- **Color-Coded**: Each state has a distinct color scheme
- **Animated**: Smooth transitions and subtle pulses for active states
- **Layered**: Multiple indicators can stack without overlapping

## Visual Indicator Specifications

### 1. **Cooldown Timer** 🔵

**Position**: Top-right corner of piece
**Design**:

- Small circular badge (20x20px)
- White/light blue background with dark text
- Shows remaining turns as a number
- Circular progress ring around the badge (depletes as cooldown decreases)
- Pulse animation when cooldown is active

**Colors**:

- Background: `bg-blue-100 dark:bg-blue-900/40`
- Text: `text-blue-900 dark:text-blue-100`
- Ring: `stroke-blue-500`

**States**:

- Cooldown > 0: Visible with number
- Cooldown = 0: Fade out with success animation

---

### 2. **Charge Meter** ⚡

**Position**: Top-left corner of piece
**Design**:

- Horizontal bar (30x6px) or lightning bolt icon with number
- Fills up as charge increases
- Glows when fully charged
- Spark animation when charge increases

**Colors**:

- Background: `bg-amber-100 dark:bg-amber-900/40`
- Fill: `bg-gradient-to-r from-amber-400 to-yellow-500`
- Glow: `shadow-[0_0_10px_rgba(251,191,36,0.6)]`

**States**:

- Charging: Partially filled bar
- Fully Charged: Full bar + glow + pulse
- Discharged: Empty bar, fades out

---

### 3. **Mode Indicator** 🔄

**Position**: Bottom-right corner of piece
**Design**:

- Small icon badge (16x16px)
- Toggle switch icon or mode-specific icon
- Subtle glow when active

**Colors**:

- Mode ON: `bg-purple-500/20 text-purple-400 border-purple-400/30`
- Mode OFF: `bg-gray-500/20 text-gray-400 border-gray-400/30`

**States**:

- Active: Bright purple with glow
- Inactive: Dimmed gray

---

### 4. **Has Logic Indicator** ✨

**Position**: Bottom-left corner of piece
**Design**:

- Tiny sparkle/star icon (12x12px)
- Indicates piece has custom logic/triggers
- Subtle shimmer animation

**Colors**:

- `text-amber-400` with `drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]`

**States**:

- Always visible if piece has any logic blocks
- Pulses when a trigger fires (brief animation)

---

### 5. **Transformation Preview** 🔀

**Position**: Overlay on entire piece (semi-transparent)
**Design**:

- When transformation is queued/pending
- Show ghost image of target piece type
- Fade in/out animation

**Colors**:

- Overlay: `bg-white/10 dark:bg-black/20`
- Border: `border-2 border-dashed border-purple-400`

**Animation**:

- Morph animation from current piece to new piece
- Duration: 300ms ease-in-out

---

### 6. **Under Threat Warning** ⚠️

**Position**: Entire piece border
**Design**:

- Pulsing red border/glow
- Danger icon in top-center (optional)
- Only shows when piece is being attacked

**Colors**:

- Border: `ring-2 ring-red-500/60`
- Glow: `shadow-[0_0_15px_rgba(239,68,68,0.5)]`

**Animation**:

- Pulse every 1.5s
- Fade in when threat detected, fade out when safe

---

### 7. **Variable Display** 📊

**Position**: Tooltip on hover (not always visible)
**Design**:

- Small popup showing all custom variables
- Format: `varName: value`
- Only for debugging/advanced users

**Colors**:

- Background: `bg-stone-900/95 dark:bg-white/95`
- Text: `text-white dark:text-stone-900`

---

### 8. **Trigger Fire Animation** 💥

**Position**: Emanating from piece center
**Design**:

- Brief particle burst when a trigger executes
- Color-coded by trigger type:
  - on-move: Blue particles
  - on-capture: Red particles
  - on-threat: Orange particles
  - on-environment: Green particles
  - on-var: Purple particles

**Animation**:

- 8-12 particles radiate outward
- Fade out over 400ms
- Particles are small circles (4px diameter)

---

### 9. **Effect Execution Flash** ✅

**Position**: Brief overlay on piece
**Design**:

- Quick flash when an effect executes
- Color-coded by effect type:
  - kill: Red flash
  - transformation: Purple flash
  - modify-var: Blue flash
  - cooldown: Cyan flash
  - charge: Yellow flash
  - mode: Purple flash
  - prevent: Orange flash

**Animation**:

- Duration: 200ms
- Opacity: 0 → 0.3 → 0

---

## Layout & Stacking

```
┌─────────────────┐
│ ⚡ Charge    🔵 │  ← Top corners
│                 │
│    [PIECE]      │  ← Center (piece image)
│                 │
│ ✨ Logic    🔄  │  ← Bottom corners
└─────────────────┘
     ⚠️ Threat      ← Border/glow effects
```

## Component Structure

### New Component: `PieceStateIndicators.tsx`

```tsx
interface PieceStateIndicatorsProps {
  variables: Record<string, number>;
  hasLogic: boolean;
  isUnderThreat?: boolean;
  size: number; // piece size for scaling
}
```

### Integration Points

1. **PieceRenderer.tsx**: Add indicators as overlay
2. **Board.tsx** (play mode): Pass piece state data
3. **CustomPiece class**: Expose variables and state

## Implementation Steps

1. **Create PieceStateIndicators component** (new file)
2. **Update PieceRenderer** to accept and display indicators
3. **Update Board.tsx** to pass piece variables to renderer
4. **Add trigger/effect animations** (particle system)
5. **Add CSS animations** for pulses, glows, flashes
6. **Test with example pieces** that have all states

## Accessibility Considerations

- All indicators have tooltips explaining their meaning
- Color-blind friendly: Use icons + colors
- High contrast mode support
- Screen reader announcements for state changes

## Performance Optimizations

- Use CSS transforms for animations (GPU accelerated)
- Memoize indicator components
- Only render visible indicators
- Debounce rapid state changes
- Use requestAnimationFrame for particle animations

---

## Example Visual Mockup (Text-based)

```
Normal Piece:
┌─────┐
│  ♟  │
└─────┘

Piece with Cooldown (3 turns):
┌─────┐
│  ♟ ③│  ← Blue badge with "3"
└─────┘

Piece Charging (50%):
┌─────┐
│⚡▓▓░░│  ← Half-filled amber bar
│  ♟  │
└─────┘

Piece with Multiple States:
┌─────┐
│⚡▓▓▓ ③│  ← Charge + Cooldown
│  ♟  │
│✨   🔄│  ← Has Logic + Mode Active
└─────┘
   ⚠️     ← Red glow (under threat)
```

## Color Palette Reference

- **Cooldown**: Blue (#3B82F6)
- **Charge**: Amber/Yellow (#F59E0B → #EAB308)
- **Mode**: Purple (#A855F7)
- **Logic**: Amber (#F59E0B)
- **Threat**: Red (#EF4444)
- **Transform**: Purple (#A855F7)
- **Success**: Green (#10B981)
- **Neutral**: Gray (#6B7280)
