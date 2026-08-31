/** Dummy homepage inventory preview until a public API or CMS exists. */
export const DUMMY_INVENTORY_PREVIEW = {
  stats: [
    { id: "stock", icon: "box", labelKey: "lpPrevInStock", value: "12,458", change: "+8% vs last week" },
    { id: "low", icon: "warn", labelKey: "lpPrevLow", value: "234", change: "+3% vs last week" },
    { id: "alerts", icon: "bell", labelKey: "lpPrevAlerts", value: "24", change: "+12% vs last week" },
  ],
  chart: {
    max: 8000,
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    points: [2200, 3100, 2800, 4300, 5200, 6400, 7800],
  },
  topParts: [
    { id: "p1", name: "Spark Plug", sku: "NGK-BKR6E", qty: "1,248", image: "/parts/spark-plug.svg" },
    { id: "p2", name: "Oil Filter", sku: "OF-2041", qty: "987", image: "/parts/oil-filter.svg" },
    { id: "p3", name: "Brake Pad", sku: "BP-330", qty: "765", image: "/parts/brake-pad.svg" },
  ],
};
