const getEngine = (name) => {
  switch (name) {
    case "texas_holdem":
      return TexasHoldemEngine;
    case "omaha":
      return OmahaEngine;
    case "omaha_hi_lo":
      return OmahaHiLoEngine;

    default:
      throw new Error(`Unknown engine: ${name}`);
  }
};
