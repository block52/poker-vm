import { colors, hexToRgba } from "./utils/colorConfig"

// Static button styles - computed once and reused
export const BUTTON_STYLES = {
  deal: {
    background: `linear-gradient(to right, ${hexToRgba(colors.brand.primary, 0.9)}, ${hexToRgba(colors.brand.primary, 0.9)})`,
    borderColor: hexToRgba(colors.brand.primary, 0.5),
    boxShadow: `0 0 15px ${hexToRgba(colors.brand.primary, 0.3)}`
  },

  newHand: {
    background: `linear-gradient(to right, ${colors.brand.secondary}, ${colors.brand.primary})`,
    borderColor: hexToRgba(colors.brand.primary, 0.6)
  },

  muck: {
    background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
    borderColor: colors.ui.borderColor
  },

  show: {
    background: `linear-gradient(to right, ${colors.brand.primary}, ${colors.brand.primary})`,
    borderColor: colors.brand.primary
  },

  smallBlind: {
    background: `linear-gradient(to right, ${colors.accent.success}, ${hexToRgba(colors.accent.success, 0.8)})`,
    borderColor: colors.accent.success
  },

  smallBlindAmount: {
    backgroundColor: hexToRgba(colors.ui.bgDark, 0.8),
    color: colors.brand.primary,
    borderColor: hexToRgba(colors.accent.success, 0.2)
  },

  bigBlind: {
    background: `linear-gradient(to right, ${colors.accent.success}, ${hexToRgba(colors.accent.success, 0.8)})`,
    borderColor: colors.accent.success
  },

  bigBlindAmount: {
    backgroundColor: hexToRgba(colors.ui.bgDark, 0.8),
    color: colors.brand.primary,
    borderColor: hexToRgba(colors.accent.success, 0.2)
  },

  fold: {
    default: {
      background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.borderColor})`,
      borderColor: colors.ui.borderColor,
      color: "white"
    },
    hover: {
      background: `linear-gradient(to right, ${colors.accent.danger}, ${hexToRgba(colors.accent.danger, 0.8)})`,
      borderColor: colors.accent.danger,
      boxShadow: `0 0 10px ${hexToRgba(colors.accent.danger, 0.4)}`
    }
  },

  call: {
    default: {
      background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
      borderColor: colors.ui.borderColor,
      color: "white"
    },
    hover: {
      background: `linear-gradient(to right, ${colors.brand.primary}, ${hexToRgba(colors.brand.primary, 0.9)})`,
      borderColor: colors.brand.primary,
      boxShadow: `0 0 15px ${hexToRgba(colors.brand.primary, 0.2)}`
    }
  },

  raise: {
    default: {
      background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
      borderColor: colors.ui.borderColor,
      color: "white"
    },
    hover: {
      background: `linear-gradient(to right, ${colors.accent.glow}, ${hexToRgba(colors.accent.glow, 0.9)})`,
      borderColor: colors.accent.glow,
      boxShadow: `0 0 15px ${hexToRgba(colors.accent.glow, 0.2)}`
    }
  },

  slider: {
    default: {
      background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
      borderColor: colors.ui.borderColor,
      color: "white"
    },
    hover: {
      background: `linear-gradient(to right, ${colors.ui.bgDark}, ${colors.ui.bgMedium})`,
      borderColor: colors.accent.glow
    }
  },

  pot: {
    default: {
      background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
      borderColor: colors.ui.borderColor,
      color: "white"
    },
    hover: {
      background: `linear-gradient(to right, ${colors.ui.bgDark}, ${colors.ui.bgMedium})`,
      borderColor: colors.accent.glow
    }
  },

  allIn: {
    default: {
      background: `linear-gradient(to right, ${colors.ui.bgMedium}, ${colors.ui.bgDark})`,
      borderColor: colors.ui.borderColor,
      color: "white"
    },
    hover: {
      background: `linear-gradient(to right, ${colors.accent.glow}, ${hexToRgba(colors.accent.glow, 0.9)})`,
      borderColor: colors.accent.glow
    }
  }
};

// Dynamic styles that depend on component state - keep these as functions or useMemo
export const getDynamicInputStyle = (isInvalid: boolean) => ({
  backgroundColor: colors.ui.bgMedium,
  borderColor: isInvalid ? colors.accent.danger : colors.ui.borderColor,
  color: isInvalid ? colors.accent.danger : "white"
});

export const getDynamicMinMaxTextStyle = (isInvalid: boolean) => ({
  color: isInvalid ? colors.accent.danger : colors.ui.textSecondary
});