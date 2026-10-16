"""
CarbonIQ AI demo calculator.
IMPORTANT: The emission factors below are illustrative placeholders for a hackathon demo.
Replace them with current, documented factors from appropriate official sources before
presenting results as real-world estimates.
"""

# Illustrative factors only; units are kg CO2e per input unit.
ELECTRICITY_FACTOR = 0.70       # kg CO2e / kWh
CAR_FACTOR = 0.19               # kg CO2e / vehicle-km
MOTORCYCLE_FACTOR = 0.08        # kg CO2e / vehicle-km
BUS_FACTOR = 0.10               # kg CO2e / passenger-km (requires passenger-km input)
WASTE_FACTOR = 0.50             # kg CO2e / kg waste; simplified demo assumption

def as_number(data, key, default=0.0, minimum=0.0, maximum=1_000_000.0):
    try:
        value = float(data.get(key, default))
    except (TypeError, ValueError):
        value = default
    return max(minimum, min(value, maximum))

def calculate_emissions(data):
    electricity_kwh = as_number(data, "electricity_kwh")
    car_km = as_number(data, "car_km")
    motorcycle_km = as_number(data, "motorcycle_km")
    bus_passenger_km = as_number(data, "bus_passenger_km")
    waste_kg = as_number(data, "waste_kg")

    electricity = electricity_kwh * ELECTRICITY_FACTOR
    transport = (
        car_km * CAR_FACTOR
        + motorcycle_km * MOTORCYCLE_FACTOR
        + bus_passenger_km * BUS_FACTOR
    )
    waste = waste_kg * WASTE_FACTOR
    total = electricity + transport + waste

    return {
        "electricity_kg": round(electricity, 2),
        "transport_kg": round(transport, 2),
        "waste_kg_co2e": round(waste, 2),
        "total_kg": round(total, 2),
        "breakdown": [
            {"label": "Electricity", "value": round(electricity, 2)},
            {"label": "Transport", "value": round(transport, 2)},
            {"label": "Waste", "value": round(waste, 2)}
        ],
        "factors": {
            "electricity_kg_per_kwh": ELECTRICITY_FACTOR,
            "car_kg_per_vehicle_km": CAR_FACTOR,
            "motorcycle_kg_per_vehicle_km": MOTORCYCLE_FACTOR,
            "bus_kg_per_passenger_km": BUS_FACTOR,
            "waste_kg_per_kg": WASTE_FACTOR
        },
        "note": "Demo estimate only. Factors are illustrative placeholders, not verified official factors."
    }

def build_recommendations(data, result):
    options = [
        ("Electricity", result["electricity_kg"],
         "Test a 10–20% reduction in electricity use by switching off unused equipment and improving operating schedules."),
        ("Transport", result["transport_kg"],
         "Encourage shared transport, public transport, walking, or cycling where practical; use actual travel data for better estimates."),
        ("Waste", result["waste_kg_co2e"],
         "Measure waste by category and improve reuse, recycling, and composting where suitable.")
    ]
    options.sort(key=lambda x: x[1], reverse=True)
    recommendations = [f"Prioritize {options[0][0].lower()}, currently the largest estimated source in this scenario. {options[0][2]}"]
    recommendations.extend(x[2] for x in options[1:])
    recommendations.append("Compare one change at a time, then test a combined scenario. These are suggestions, not guaranteed savings.")
    return recommendations
