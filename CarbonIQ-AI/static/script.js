
const $ = (id) => document.getElementById(id);
let chart;

const sliders = [
    ["electricity", "electricityOut"],
    ["carKm", "carKmOut"],
    ["motorcycleKm", "motorcycleKmOut"],
    ["busKm", "busKmOut"],
    ["wasteKg", "wasteKgOut"]
];

function getInputs() {
    return {
        electricity_kwh: Number($("electricity").value),
        car_km: Number($("carKm").value),
        motorcycle_km: Number($("motorcycleKm").value),
        bus_passenger_km: Number($("busKm").value),
        waste_kg: Number($("wasteKg").value)
    };
}

async function calculate() {
    const data = getInputs();
    const reduction = Number($("saving").value);

    $("savingOut").value = reduction + "%";
    $("newElectricity").textContent =
        (data.electricity_kwh * (1 - reduction / 100)).toFixed(0) + " kWh/day";

    try {
        const [baseResponse, proposedResponse] = await Promise.all([
            fetch("/api/calculate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
            }),
            fetch("/api/calculate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    ...data,
                    electricity_kwh:
                        data.electricity_kwh * (1 - reduction / 100)
                })
            })
        ]);

        if (!baseResponse.ok || !proposedResponse.ok) {
            throw new Error("The server returned an error. Check the VS Code terminal.");
        }

        const base = await baseResponse.json();
        const proposed = await proposedResponse.json();

        // Support both response formats used in our project versions.
        const baseTotal = base.total_kg ?? base.baseline?.total_kg;
        const proposedTotal = proposed.total_kg ?? proposed.proposed?.total_kg;

        if (baseTotal === undefined || proposedTotal === undefined) {
            throw new Error("Unexpected API response. Check app.py and carbon_calculator.py.");
        }

        $("baselineTotal").textContent = Number(baseTotal).toLocaleString();
        $("scenarioTotal").textContent = Number(proposedTotal).toLocaleString();

        const reductionPercent = baseTotal > 0
            ? ((baseTotal - proposedTotal) / baseTotal) * 100
            : 0;

        $("reduction").textContent = reductionPercent.toFixed(1) + "%";

        const recommendations =
            base.recommendations ??
            base.baseline?.recommendations ??
            [];

        $("recommendations").replaceChildren();

        recommendations.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = item;
            $("recommendations").appendChild(li);
        });

        const baseBreakdown = base.breakdown ??
            [
                {label: "Electricity", value: base.electricity_kg ?? base.baseline?.electricity_kg ?? 0},
                {label: "Transport", value: base.transport_kg ?? base.baseline?.transport_kg ?? 0},
                {label: "Waste", value: base.waste_kg_co2e ?? base.waste_kg ?? base.baseline?.waste_kg ?? 0}
            ];

        const proposedBreakdown = proposed.breakdown ??
            [
                {label: "Electricity", value: proposed.electricity_kg ?? proposed.proposed?.electricity_kg ?? 0},
                {label: "Transport", value: proposed.transport_kg ?? proposed.proposed?.transport_kg ?? 0},
                {label: "Waste", value: proposed.waste_kg_co2e ?? proposed.waste_kg ?? proposed.proposed?.waste_kg ?? 0}
            ];

        if (typeof Chart !== "undefined" && $("comparisonChart")) {
            if (chart) chart.destroy();

            chart = new Chart($("comparisonChart"), {
                type: "bar",
                data: {
                    labels: ["Electricity", "Transport", "Waste"],
                    datasets: [
                        {
                            label: "Baseline (kg CO₂e)",
                            data: baseBreakdown.map(x => x.value),
                            backgroundColor: "#7e9e8a"
                        },
                        {
                            label: "Proposed (kg CO₂e)",
                            data: proposedBreakdown.map(x => x.value),
                            backgroundColor: "#b8f36b"
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {y: {beginAtZero: true}}
                }
            });
        }
    } catch (error) {
        console.error("CarbonIQ calculation failed:", error);
        $("baselineTotal").textContent = "Error";
        $("scenarioTotal").textContent = "Error";
        $("reduction").textContent = "—";
    }
}

sliders.forEach(([slider, output]) => {
    if ($(slider) && $(output)) {
        $(slider).addEventListener("input", () => {
            $(output).value = $(slider).value;
            calculate();
        });
    }
});

if ($("saving")) {
    $("saving").addEventListener("input", calculate);
}

if ($("applyBtn")) {
    $("applyBtn").addEventListener("click", calculate);
}

if ($("resetBtn")) {
    $("resetBtn").addEventListener("click", () => location.reload());
}

calculate();

const visionForm = $("visionForm");

if (visionForm) {
    visionForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const imageInput = $("visionImage");
        const resultBox = $("visionResult");
        const file = imageInput?.files?.[0];

        if (!file) {
            resultBox.textContent = "Please select an image first.";
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        resultBox.textContent = "Analyzing image… this may take a moment.";

        try {
            const response = await fetch("/api/detect", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Image analysis failed.");
            }

            const counts = result.counts || {};
            const entries = Object.entries(counts);

            resultBox.textContent = entries.length
                ? "Detected objects: " + entries.map(
                    ([name, count]) => `${name}: ${count}`
                  ).join(", ")
                : "Analysis complete. No supported objects were detected.";
        } catch (error) {
            console.error("CarbonIQ image analysis failed:", error);
            resultBox.textContent =
                "Image analysis failed. Check the VS Code terminal for details.";
        }
    });
}
