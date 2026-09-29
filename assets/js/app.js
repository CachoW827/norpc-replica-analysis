const D = window.NORPC_METRICS;

const $ = (id) => document.getElementById(id);

const DISPLAY_LABELS = {
  Airport: "Airport",
  University: "University",
  W_HB_W_All: "Home-Based · Work · Work",
  W_HB_EK12_All: "Home-Based · Work · K-12 Escort",
  W_HB_O_All: "Home-Based · Work · Other",
  W_HB_O_Combined: "Home-Based · Work · K-12 Escort / Other",
  N_HB_K12_All: "Home-Based · Non-Work · K-12",
  N_HB_OMED_All: "Home-Based · Non-Work · Medical",
  N_HB_OME_All: "Home-Based · Non-Work · Maintenance",
  N_HB_K12_OMED_OME_Combined: "Home-Based · Non-Work · K-12 / Medical / Maintenance",
  N_HB_OD_Short: "Home-Based · Non-Work · Other Short",
  N_HB_OD_Long: "Home-Based · Non-Work · Other Long",
  W_NH_EK12_All: "Non-Home-Based · Work · K-12 Escort",
  W_NH_WR_All: "Non-Home-Based · Work · Work Related",
  W_NH_O_All: "Non-Home-Based · Work · Other",
  W_NH_O_Combined: "Non-Home-Based · Work · K-12 Escort / Other",
  N_NH_K12_All: "Non-Home-Based · Non-Work · K-12",
  N_NH_OME_All: "Non-Home-Based · Non-Work · Maintenance",
  N_NH_K12_OME_Combined: "Non-Home-Based · Non-Work · K-12 / Maintenance",
  N_NH_O_All: "Non-Home-Based · Non-Work · Other",
  Total: "Total"
};

const COMBINED_ORDER = [
  "Airport",
  "University",
  "W_HB_W_All",
  "W_HB_O_Combined",
  "N_HB_K12_OMED_OME_Combined",
  "N_HB_OD_Short",
  "N_HB_OD_Long",
  "W_NH_WR_All",
  "W_NH_O_Combined",
  "N_NH_K12_OME_Combined",
  "N_NH_O_All"
];

const DETAILED_ORDER = [
  "Airport",
  "University",
  "W_HB_W_All",
  "W_HB_EK12_All",
  "W_HB_O_All",
  "N_HB_K12_All",
  "N_HB_OME_All",
  "N_HB_OMED_All",
  "N_HB_OD_Short",
  "N_HB_OD_Long",
  "W_NH_WR_All",
  "W_NH_EK12_All",
  "W_NH_O_All",
  "N_NH_K12_All",
  "N_NH_OME_All",
  "N_NH_O_All"
];

const PLOT_CONFIG = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ["lasso2d", "select2d"]
};

let view = "Combined";
let selected = new Set();

function rows(name) {
  return D[name] || [];
}

function label(code) {
  return DISPLAY_LABELS[code] || D.purpose_labels?.[code] || code;
}

function formatNumber(value, decimals = 0) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function purposeCodes() {
  const available = new Set(
    rows("generation")
      .filter((row) => row.classification === view && row.analysis_purpose !== "Total")
      .map((row) => row.analysis_purpose)
  );

  const order = view === "Combined" ? COMBINED_ORDER : DETAILED_ORDER;
  return order.filter((code) => available.has(code));
}

function activeCodes() {
  if (!selected.size) {
    return ["Total"];
  }

  const selectedCodes = new Set(selected);
  return purposeCodes().filter((code) => selectedCodes.has(code));
}

function purposeRank(code) {
  if (code === "Total") {
    return -1;
  }

  const index = purposeCodes().indexOf(code);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function sortByPurposeOrder(items) {
  return items.slice().sort(
    (a, b) => purposeRank(a.analysis_purpose) - purposeRank(b.analysis_purpose)
  );
}

function selectedRows(name) {
  const active = new Set(activeCodes());

  return rows(name).filter(
    (row) => row.classification === view && active.has(row.analysis_purpose)
  );
}

function renderCards(id, items) {
  $(id).innerHTML = items
    .map(
      ([title, value]) =>
        `<div class="metric-card"><b>${value}</b><span>${title}</span></div>`
    )
    .join("");
}

function renderTable(id, headers, bodyRows) {
  $(id).innerHTML = `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${bodyRows
          .map(
            (row) =>
              `<tr>${row.map((value) => `<td>${value}</td>`).join("")}</tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function niceStep(value, targetTicks = 5) {
  const raw = value / targetTicks;
  const power = 10 ** Math.floor(Math.log10(raw || 1));
  const scaled = raw / power;

  const factor =
    scaled <= 1 ? 1 :
    scaled <= 2 ? 2 :
    scaled <= 2.5 ? 2.5 :
    scaled <= 5 ? 5 : 10;

  return factor * power;
}

function chartLayout(title, xTitle, yTitle, extra = {}) {
  const base = {
    title: {
      text: `<b>${title}</b>`,
      x: 0.01,
      font: { size: 15, color: "#203747" }
    },
    paper_bgcolor: "#fff",
    plot_bgcolor: "#fff",
    font: {
      family: "Inter, Segoe UI, Arial, sans-serif",
      size: 11,
      color: "#425565"
    },
    margin: { l: 86, r: 24, t: 55, b: 88 },
    xaxis: {
      title: { text: `<b>${xTitle}</b>`, standoff: 22 },
      gridcolor: "#e4eaee",
      zeroline: false,
      automargin: true,
      ticklabelstandoff: 8
    },
    yaxis: {
      title: { text: `<b>${yTitle}</b>`, standoff: 22 },
      gridcolor: "#e4eaee",
      zeroline: false,
      automargin: true,
      ticklabelstandoff: 8
    },
    hovermode: "x unified",
    hoverlabel: {
      bgcolor: "#ffffff",
      bordercolor: "#cfd9e2",
      font: {
        family: "Inter, Segoe UI, Arial, sans-serif",
        size: 12,
        color: "#203747"
      },
      align: "left"
    },
    legend: {
      orientation: "h",
      x: 0,
      xanchor: "left",
      y: -0.22,
      yanchor: "top"
    }
  };

  const merged = { ...base, ...extra };

  if (extra.xaxis) {
    merged.xaxis = {
      ...base.xaxis,
      ...extra.xaxis,
      title: { ...base.xaxis.title, ...(extra.xaxis.title || {}) }
    };
  }

  if (extra.yaxis) {
    merged.yaxis = {
      ...base.yaxis,
      ...extra.yaxis,
      title: { ...base.yaxis.title, ...(extra.yaxis.title || {}) }
    };
  }

  return merged;
}

function legendSpace(seriesCount) {
  if (seriesCount <= 1) {
    return { bottom: 88, height: 430 };
  }

  const rowsNeeded = Math.ceil(seriesCount / 2);

  return {
    bottom: 95 + rowsNeeded * 24,
    height: 430 + rowsNeeded * 24
  };
}

function roundUp(value, interval) {
  return Math.max(interval, Math.ceil(value / interval) * interval);
}

function selectedTlfdMax(measure) {
  return measure === "Miles" ? 60 : 120;
}

function renderPurposeOptions() {
  const codes = purposeCodes();

  $("purposeOptions").innerHTML = codes
    .map(
      (code) => `
        <label class="purpose-option">
          <input
            type="checkbox"
            value="${code}"
            ${selected.has(code) ? "checked" : ""}
          >
          <span>${label(code)}</span>
        </label>
      `
    )
    .join("");

  $("purposeButtonText").textContent = selected.size
    ? `Purposes (${selected.size}/${codes.length})`
    : "Purposes (All Trips)";

  $("purposeOptions")
    .querySelectorAll("input")
    .forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          selected.add(input.value);
        } else {
          selected.delete(input.value);
        }

        $("purposeButtonText").textContent = selected.size
          ? `Purposes (${selected.size}/${codes.length})`
          : "Purposes (All Trips)";

        renderAll();
      });
    });
}

function setView(newView) {
  view = newView;

  $("combinedBtn").classList.toggle("active", view === "Combined");
  $("detailedBtn").classList.toggle("active", view === "Detailed");

  // Combined and Detailed do not share the same complete purpose list.
  // Start each analysis view from All Trips.
  selected.clear();

  renderPurposeOptions();
  renderAll();
}

function renderGeneration() {
  let generation = selectedRows("generation");
  const showingTotal = !selected.size;

  const totalTrips = showingTotal
    ? Number(generation[0]?.trips || 0)
    : generation.reduce((sum, row) => sum + Number(row.trips || 0), 0);

  renderCards("generationCards", [
    [showingTotal ? "All Classified Trips" : "Selected Trips", formatNumber(totalTrips)],
    ["Trips / Household", formatNumber(totalTrips / D.metadata.regional_households, 1)],
    ["Trips / Person", formatNumber(totalTrips / D.metadata.regional_population, 1)],
    ["Share of Classified Trips", `${formatNumber(100 * totalTrips / D.metadata.classified_trips, 1)}%`]
  ]);

  generation = sortByPurposeOrder(generation);

  const maxTrips = Math.max(...generation.map((row) => Number(row.trips)), 1);
  const step = niceStep(maxTrips);
  const axisMax = Math.ceil(maxTrips / step) * step;

  const trace = {
    type: "bar",
    orientation: "h",
    x: generation.map((row) => Number(row.trips)),
    y: generation.map((row) => label(row.analysis_purpose)),
    marker: { color: "#1f5f8b" },
    hovertemplate: "%{x:,.0f} trips<extra></extra>"
  };

  const layout = chartLayout(
    "Trips by Purpose",
    "Number of Trips",
    "Trip Purpose",
    {
      height: Math.max(360, 120 + generation.length * 31),
      margin: { l: 300, r: 24, t: 55, b: 88 },
      xaxis: {
        range: [0, axisMax],
        dtick: step,
        tickformat: ",d"
      },
      yaxis: {
        categoryorder: "array",
        categoryarray: generation.map((row) => label(row.analysis_purpose)),
        autorange: "reversed"
      },
      hovermode: "closest"
    }
  );

  Plotly.react("generationChart", [trace], layout, PLOT_CONFIG);

  renderTable(
    "generationTable",
    ["Purpose", "Trips", "Trips / Household", "Trips / Person", "Trip Share"],
    generation.map((row) => [
        label(row.analysis_purpose),
        formatNumber(row.trips),
        formatNumber(row.trips_per_household, 1),
        formatNumber(row.trips_per_person, 1),
        `${formatNumber(100 * row.trip_share, 1)}%`
      ])
  );
}

function tlfdTraces(measure, axisMax) {
  const tlfd = selectedRows("tlfd").filter(
    (row) => row.measure === measure && Number(row.bin_start) < axisMax
  );

  return activeCodes().map((code) => {
    const series = tlfd
      .filter((row) => row.analysis_purpose === code)
      .sort((a, b) => Number(a.bin_start) - Number(b.bin_start));

    return {
      type: "scatter",
      mode: "lines",
      name: label(code),
      x: series.map((row) => Number(row.bin_start)),
      y: series.map((row) => 100 * Number(row.share || 0)),
      line: { width: 2 },
      hovertemplate: "%{y:.1f}%<extra>%{fullData.name}</extra>"
    };
  });
}

function renderTlfdChart({
  elementId,
  measure,
  title,
  xTitle,
  tickInterval
}) {
  const axisMax = selectedTlfdMax(measure);
  const traces = tlfdTraces(measure, axisMax);
  const seriesCount = traces.length;

  // Keep a clear separation between the x-axis title and the legend.
  // More selected purposes receive more dedicated legend space below the plot.
  const legendRows = seriesCount <= 1 ? 0 : Math.ceil(seriesCount / 2);
  const legendGap = seriesCount <= 1 ? 0 : 58;
  const bottomMargin = 92 + legendGap + legendRows * 24;
  const chartHeight = 430 + legendGap + legendRows * 24;

  const layout = chartLayout(
    title,
    xTitle,
    "Share of Trips (%)",
    {
      height: chartHeight,
      margin: { l: 86, r: 24, t: 55, b: bottomMargin },
      xaxis: {
        type: "linear",
        range: [0, axisMax],
        tickmode: "linear",
        tick0: 0,
        dtick: tickInterval,
        fixedrange: false
      },
      yaxis: {
        rangemode: "tozero"
      },
      legend: {
        orientation: "h",
        x: 0,
        xanchor: "left",
        y: -0.42,
        yanchor: "top"
      }
    }
  );

  Plotly.react(elementId, traces, layout, PLOT_CONFIG);
}

function renderDistribution() {
  const distribution = selectedRows("distribution");
  const showingTotal = !selected.size;

  const totalTrips = showingTotal
    ? Number(distribution[0]?.trips || 0)
    : distribution.reduce((sum, row) => sum + Number(row.trips || 0), 0);

  const weighted = (field) => {
    if (showingTotal) {
      return Number(distribution[0]?.[field] || 0);
    }

    if (!totalTrips) {
      return 0;
    }

    return distribution.reduce(
      (sum, row) => sum + Number(row[field] || 0) * Number(row.trips || 0),
      0
    ) / totalTrips;
  };

  renderCards("distributionCards", [
    ["Average Trip Length", `${formatNumber(weighted("average_miles"), 1)} miles`],
    ["Average Travel Time", `${formatNumber(weighted("average_minutes"), 1)} minutes`],
    [showingTotal ? "All Classified Trips" : "Selected Trips", formatNumber(totalTrips)],
    [showingTotal ? "Displayed Series" : "Selected Purposes", showingTotal ? "All Trips" : formatNumber(distribution.length)]
  ]);

  renderTlfdChart({
    elementId: "distanceChart",
    measure: "Miles",
    title: "Trip Length Frequency · Miles",
    xTitle: "Trip Length (miles)",
    tickInterval: 5
  });

  renderTlfdChart({
    elementId: "timeChart",
    measure: "Minutes",
    title: "Trip Length Frequency · Minutes",
    xTitle: "Trip Duration (minutes)",
    tickInterval: 10
  });

  renderTable(
    "distributionTable",
    ["Purpose", "Average Miles", "Median Miles", "Average Minutes", "Median Minutes"],
    sortByPurposeOrder(distribution).map((row) => [
      label(row.analysis_purpose),
      formatNumber(row.average_miles, 1),
      formatNumber(row.median_miles, 1),
      formatNumber(row.average_minutes, 1),
      formatNumber(row.median_minutes, 1)
    ])
  );
}

function renderMode() {
  const mode = selectedRows("mode");
  const modes = ["Auto", "On-Demand Auto", "Walk / Bike", "Transit", "Other"];

  const traces = activeCodes().map((code) => ({
    type: "bar",
    name: label(code),
    x: modes,
    y: modes.map(
      (modeName) =>
        100 * Number(
          mode.find(
            (row) =>
              row.analysis_purpose === code &&
              row.mode_group === modeName
          )?.share || 0
        )
    ),
    hovertemplate: "%{y:.1f}%<extra>%{fullData.name}</extra>"
  }));

  const legend = legendSpace(traces.length);

  const layout = chartLayout(
    "Mode Share",
    "Travel Mode",
    "Share of Trips (%)",
    {
      height: 460 + Math.max(0, legend.height - 430),
      margin: { l: 86, r: 24, t: 55, b: legend.bottom },
      barmode: "group",
      bargap: 0.28,
      bargroupgap: 0.22
    }
  );

  Plotly.react("modeChart", traces, layout, PLOT_CONFIG);

  renderTable(
    "modeTable",
    ["Purpose", ...modes],
    activeCodes().map((code) => [
      label(code),
      ...modes.map((modeName) =>
        `${formatNumber(
          100 * Number(
            mode.find(
              (row) =>
                row.analysis_purpose === code &&
                row.mode_group === modeName
            )?.share || 0
          ),
          2
        )}%`
      )
    ])
  );
}

function renderDiurnal() {
  const diurnal = selectedRows("diurnal");

  const bins = [...new Set(diurnal.map((row) => Number(row.start_15min)))]
    .sort((a, b) => a - b);

  const timeLabel = (minutes) => {
    const hour24 = Math.floor(minutes / 60) % 24;
    const minute = minutes % 60;
    const hour12 = hour24 % 12 || 12;
    const period = hour24 < 12 ? "AM" : "PM";

    return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
  };

  const xValues = bins.map(timeLabel);

  const traces = activeCodes().map((code) => ({
    type: "scatter",
    mode: "lines",
    name: label(code),
    x: xValues,
    y: bins.map(
      (bin) =>
        100 * Number(
          diurnal.find(
            (row) =>
              row.analysis_purpose === code &&
              Number(row.start_15min) === bin
          )?.share || 0
        )
    ),
    hovertemplate: "%{y:.1f}%<extra>%{fullData.name}</extra>"
  }));

  const legend = legendSpace(traces.length);

  const twoHourTicks = Array.from(
    { length: 12 },
    (_, i) => timeLabel(i * 120)
  );

  const layout = chartLayout(
    "Trip Departure Time Distribution",
    "Trip Departure Time",
    "Share of Trips (%)",
    {
      height: 470 + Math.max(0, legend.height - 430),
      margin: { l: 94, r: 24, t: 55, b: legend.bottom },
      xaxis: {
        type: "category",
        categoryorder: "array",
        categoryarray: xValues,
        tickmode: "array",
        tickvals: twoHourTicks,
        ticktext: twoHourTicks,
        ticklabelstandoff: 10
      },
      yaxis: {
        rangemode: "tozero",
        tickformat: ".1f",
        ticklabelstandoff: 10
      }
    }
  );

  Plotly.react("diurnalChart", traces, layout, PLOT_CONFIG);

  renderTable(
    "diurnalTable",
    ["Purpose", "Peak Hour", "Peak Hour Share"],
    activeCodes().map((code) => {
      const purposeRows = diurnal.filter(
        (row) => row.analysis_purpose === code
      );

      const shareByBin = new Map(
        purposeRows.map((row) => [
          Number(row.start_15min),
          Number(row.share || 0)
        ])
      );

      // Rolling 60-minute window using four consecutive 15-minute bins.
      // This allows peak hours such as 5:15 PM – 6:15 PM.
      const rollingHours = bins.map((start) => {
        const share = [0, 15, 30, 45].reduce((sum, offset) => {
          const bin = (start + offset) % 1440;
          return sum + Number(shareByBin.get(bin) || 0);
        }, 0);

        return { start, share };
      });

      const peak = rollingHours.reduce(
        (best, current) => current.share > best.share ? current : best
      );

      const peakHourLabel = (start) => {
        const end = (start + 60) % 1440;
        return `${timeLabel(start)} – ${timeLabel(end)}`;
      };

      return [
        label(code),
        peakHourLabel(peak.start),
        `${formatNumber(100 * peak.share, 1)}%`
      ];
    })
  );
}

function renderAll() {
  renderGeneration();
  renderDistribution();
  renderMode();
  renderDiurnal();
}

renderCards("dataStats", [
  ["NORPC Resident Population", formatNumber(D.metadata.regional_population)],
  ["NORPC Resident Households", formatNumber(D.metadata.regional_households)],
  ["Classified Resident Internal-Internal Trips", formatNumber(D.metadata.classified_trips)],
  ["Unresolved Resident Internal-Internal Trips", formatNumber(D.metadata.unresolved_trips)]
]);

$("combinedBtn").addEventListener("click", () => setView("Combined"));
$("detailedBtn").addEventListener("click", () => setView("Detailed"));

$("purposeButton").addEventListener("click", (event) => {
  event.stopPropagation();
  $("purposePanel").classList.toggle("open");
});

$("purposePanel").addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", () => {
  $("purposePanel").classList.remove("open");
});

$("selectAll").addEventListener("click", () => {
  selected = new Set(purposeCodes());
  renderPurposeOptions();
  renderAll();
});

$("clearAll").addEventListener("click", () => {
  selected.clear();
  renderPurposeOptions();
  renderAll();
});

setView("Combined");
