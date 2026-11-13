// Colour tokens, one source for the CSS and for scripts/contrast.mjs. See docs/design/DESIGN.md §3.3.
export const palettes = {
  light: {
    paper: '#F5F2EA', card: '#FBF9F4', sunk: '#EDE9DF', ink: '#17202A', 'ink-soft': '#545D67', faint: '#686F77', rule: '#DCD6C8', 'rule-strong': '#858A85',
    trace: '#2747C9', 'trace-soft': '#E3E7FA', 'on-trace': '#FFFFFF', marker: '#F7DD72',
    pass: '#2A7042', 'pass-soft': '#E1EFE4', fail: '#B3261E', 'fail-soft': '#F6E0DD', inc: '#8A5800', 'inc-soft': '#F5E8CF',
    'L-phy': '#A8336F', 'L-mac': '#6445BD', 'L-rlc': '#1F5FA8', 'L-pdcp': '#17767D', 'L-rrc': '#2A7042', 'L-nas': '#A84A06', 'L-ap': '#535C66',
  },
  dark: {
    paper: '#11161C', card: '#171D24', sunk: '#0C1015', ink: '#E8E6E0', 'ink-soft': '#A9AFB6', faint: '#868D95', rule: '#28303A', 'rule-strong': '#5F6873',
    trace: '#93A6FF', 'trace-soft': '#1E2747', 'on-trace': '#0E1428', marker: '#5C4E14',
    pass: '#6CC48A', 'pass-soft': '#16281D', fail: '#FF8A80', 'fail-soft': '#3A1C1A', inc: '#E8B04B', 'inc-soft': '#33270F',
    'L-phy': '#F08BC1', 'L-mac': '#B9A2FF', 'L-rlc': '#8CC2FF', 'L-pdcp': '#6FD3D8', 'L-rrc': '#6CC48A', 'L-nas': '#FFA66B', 'L-ap': '#A9B4C3',
  },
};
