export const APP_TAB_BAR_TINT = "#111111"

export const APP_TAB_ITEMS = {
  media: {
    title: "Diary",
    sf: { default: "film", selected: "film.fill" },
    md: "movie",
    webIcon: { default: "film-outline", selected: "film" },
  },
  food: {
    title: "Food",
    sf: { default: "fork.knife", selected: "fork.knife.circle.fill" },
    md: "restaurant",
    webIcon: { default: "restaurant-outline", selected: "restaurant" },
  },
  insights: {
    title: "Analytics",
    sf: { default: "chart.xyaxis.line", selected: "chart.bar.fill" },
    md: "bar_chart_4_bars",
    webIcon: { default: "bar-chart-outline", selected: "bar-chart" },
  },
  profile: {
    title: "Profile",
    sf: { default: "person.crop.circle", selected: "person.crop.circle.fill" },
    md: "account_circle",
    webIcon: { default: "person-circle-outline", selected: "person-circle" },
  },
  search: {
    title: "Search",
    sf: "magnifyingglass",
    md: "search",
    webIcon: { default: "search-outline", selected: "search" },
  },
} as const
