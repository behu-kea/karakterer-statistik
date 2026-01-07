// Valid Danish grades
const VALID_GRADES = [-3, 0, 2, 4, 7, 10, 12];
const FAILING_GRADES = [-3, 0];

// Register Chart.js datalabels plugin
Chart.register(ChartDataLabels);

let distributionChart = null;

// Get DOM elements
const gradesInput = document.getElementById("grades-input");
const analyzeBtn = document.getElementById("analyze-btn");
const clearBtn = document.getElementById("clear-btn");
const resultsSection = document.getElementById("results");

// Event listeners
analyzeBtn.addEventListener("click", analyzeGrades);
clearBtn.addEventListener("click", clearAll);
gradesInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    analyzeGrades();
  }
});

function parseGrades(input) {
  const grades = input
    .split(",")
    .map((g) => {
      const trimmed = g.trim();
      // Handle '00' as 0
      if (trimmed === "00" || trimmed === "0") return 0;
      // Handle '02' as 2
      if (trimmed === "02") return 2;
      return parseFloat(trimmed);
    })
    .filter((g) => !isNaN(g) && VALID_GRADES.includes(g));

  return grades;
}

function calculateMean(grades) {
  const sum = grades.reduce((acc, grade) => acc + grade, 0);
  return sum / grades.length;
}

function calculateMedian(grades) {
  const sorted = [...grades].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    // For even number of grades, return the lower middle value
    return sorted[mid - 1];
  }
  return sorted[mid];
}

function calculateMode(grades) {
  const frequency = {};
  grades.forEach((grade) => {
    frequency[grade] = (frequency[grade] || 0) + 1;
  });

  const maxFreq = Math.max(...Object.values(frequency));
  const modes = Object.keys(frequency)
    .filter((grade) => frequency[grade] === maxFreq)
    .map(Number);

  if (modes.length === grades.length) {
    return "No mode";
  }

  return modes.length === 1 ? modes[0] : modes.join(", ");
}

function calculateVariance(grades, mean) {
  const squaredDiffs = grades.map((grade) => Math.pow(grade - mean, 2));
  return squaredDiffs.reduce((acc, val) => acc + val, 0) / grades.length;
}

function calculateStdDev(variance) {
  return Math.sqrt(variance);
}

function calculatePassRate(grades) {
  const passed = grades.filter(
    (grade) => !FAILING_GRADES.includes(grade)
  ).length;
  const failed = grades.length - passed;
  return { rate: (passed / grades.length) * 100, failed };
}

// Normal distribution removed

function displayStatistics(grades) {
  const mean = calculateMean(grades);
  const median = calculateMedian(grades);
  const mode = calculateMode(grades);
  const variance = calculateVariance(grades, mean);
  const stdDev = calculateStdDev(variance);
  const passRateData = calculatePassRate(grades);

  document.getElementById("mean").textContent = mean.toFixed(2);
  document.getElementById("median").textContent = median;
  document.getElementById("mode").textContent =
    mode === "No mode" ? "Ingen" : mode;
  document.getElementById("pass-rate").textContent =
    passRateData.rate.toFixed(1) + "%";
  document.getElementById("total").textContent = grades.length;
  document.getElementById(
    "failed-count"
  ).textContent = `${passRateData.failed} dumpet`;

  return { mean, median, mode, variance, stdDev, passRate: passRateData.rate };
}

function createDistributionChart(grades) {
  const ctx = document.getElementById("distribution-chart").getContext("2d");

  // Count frequency of each grade
  const frequency = {};
  VALID_GRADES.forEach((grade) => (frequency[grade] = 0));
  grades.forEach((grade) => frequency[grade]++);

  // Destroy existing chart
  if (distributionChart) {
    distributionChart.destroy();
  }

  // Single dataset to keep consistent bar widths; color bars per status
  const datasets = [
    {
      label: "Antal studerende",
      data: VALID_GRADES.map((grade) => frequency[grade]),
      backgroundColor: VALID_GRADES.map((grade) =>
        FAILING_GRADES.includes(grade)
          ? "rgba(231, 76, 60, 0.7)"
          : "rgba(52, 152, 219, 0.7)"
      ),
      borderColor: VALID_GRADES.map((grade) =>
        FAILING_GRADES.includes(grade)
          ? "rgba(231, 76, 60, 1)"
          : "rgba(52, 152, 219, 1)"
      ),
      borderWidth: 2,
    },
  ];

  // Normal distribution overlay removed

  distributionChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: VALID_GRADES.map((g) => (g === 0 ? "00" : g === 2 ? "02" : g)),
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            // Custom legend to explain colors without affecting bar widths
            generateLabels: function () {
              return [
                {
                  text: "Dumpet",
                  fillStyle: "rgba(231, 76, 60, 0.7)",
                  strokeStyle: "rgba(231, 76, 60, 1)",
                  lineWidth: 2,
                },
                {
                  text: "Bestået",
                  fillStyle: "rgba(52, 152, 219, 0.7)",
                  strokeStyle: "rgba(52, 152, 219, 1)",
                  lineWidth: 2,
                },
              ];
            },
          },
          onClick: function () {}, // No toggling needed
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const percentage = (
                (context.parsed.y / grades.length) *
                100
              ).toFixed(1);
              return `Studerende: ${context.parsed.y} (${percentage}%)`;
            },
          },
        },
        datalabels: {
          display: true,
          anchor: "end",
          align: "top",
          formatter: function (value, context) {
            // Only show labels for bar chart, not line
            if (context.dataset.type === "line") return "";
            return value > 0 ? value : "";
          },
          font: {
            weight: "bold",
            size: 12,
          },
          color: "#666",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grace: "10%",
          ticks: {
            stepSize: 1,
          },
          title: {
            display: false,
          },
          grid: {
            display: false,
          },
        },
        x: {
          title: {
            display: true,
            text: "Karakter",
          },
          grid: {
            display: false,
          },
        },
        // Removed secondary axis for normal curve
      },
    },
  });
}

// Normal distribution toggle removed

function analyzeGrades() {
  const input = gradesInput.value.trim();

  if (!input) {
    alert("Indtast venligst nogle karakterer!");
    return;
  }

  const grades = parseGrades(input);

  if (grades.length === 0) {
    alert(
      "Ingen gyldige karakterer fundet. Brug venligst danske karakterer: -3, 00, 02, 4, 7, 10, 12"
    );
    return;
  }

  if (grades.length < 2) {
    alert("Indtast venligst mindst 2 karakterer for meningsfuld statistik.");
    return;
  }

  // Calculate and display statistics
  displayStatistics(grades);

  // Create chart
  createDistributionChart(grades);

  // Show results
  resultsSection.style.display = "block";
  resultsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function clearAll() {
  gradesInput.value = "";
  resultsSection.style.display = "none";

  if (distributionChart) {
    distributionChart.destroy();
    distributionChart = null;
  }
}
