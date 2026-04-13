export const T = {
  bg:        "#0f1117",
  surface:   "#1a1d27",
  surface2:  "#22263a",
  border:    "#2a2d3e",
  text:      "#e8eaf0",
  muted:     "#6b7280",
  faint:     "#9ca3af",
  indigo:    "#818cf8",
  indigoDim: "#818cf820",
  amber:     "#fbbf24",
  amberDim:  "#fbbf2420",
  green:     "#34d399",
  greenDim:  "#34d39920",
  purple:    "#a78bfa",
  purpleDim: "#a78bfa20",
  teal:      "#2dd4bf",
  tealDim:   "#2dd4bf20",
  red:       "#f87171",
  redDim:    "#f8717120",
  yellow:    "#facc15",
  yellowDim: "#facc1520",
};

export const LINKS = {
  pw:          "https://docs.google.com/document/d/1SD2t9J7jYZUnN9QDOr2TWgtfkEkOfe4yuxYYb1_WwLY",
  hgh:         "https://docs.google.com/spreadsheets/d/1ywm_L1vvndS-_P25hh3Sxl0C6mtun6HDlRpvmfbnVvE",
  celestial:   "https://docs.google.com/spreadsheets/d/1ZfPTMRu8Z8CbOAjk553jq-O5vtywZ5_8jlU6GNQuaDA",
  zamar:       "https://docs.google.com/document/d/1bKBxGl7Xc5oy0tsubTGdkszbkzbpFTyzkBOTo-3kIUw",
  hghPlaylist: "https://www.youtube.com/playlist?list=PLoFyCfy6CTrdrzLP1bQJrtBcD6BINBZBZ",
};

export function formatSunday(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
