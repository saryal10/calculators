// scripts/annuityfvcalc-script.js

// Get input elements
const periodicPaymentInput = document.getElementById('periodicPayment');
const annualInterestRateInput = document.getElementById('annualInterestRate');
const numberOfYearsInput = document.getElementById('numberOfYears');
const frequencySelect = document.getElementById('frequency');
const annuityTypeRadios = document.querySelectorAll('input[name="annuityType"]');
const calculateButton = document.getElementById('calculateBtn');

// Get output elements
const futureValueElement = document.getElementById('futureValue');
const annuityChartCanvas = document.getElementById('annuityChart');
let annuityChart; // Store chart instance

// Debounce function
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Function to calculate future value and update UI
function calculateFutureValue() {
    const periodicPayment = parseFloat(periodicPaymentInput.value);
    const annualInterestRate = parseFloat(annualInterestRateInput.value) / 100;
    const numberOfYears = parseFloat(numberOfYearsInput.value);
    const frequency = parseInt(frequencySelect.value);
    const annuityType = document.querySelector('input[name="annuityType"]:checked').value;

    // Input validation
    if (isNaN(periodicPayment) || isNaN(annualInterestRate) || isNaN(numberOfYears) || isNaN(frequency)) {
        futureValueElement.textContent = '$0.00';
        updateChart(0, 0); // Clear chart
        return;
    }

    const periods = numberOfYears * frequency;
    const ratePerPeriod = annualInterestRate / frequency;
    let futureValue;

    if (ratePerPeriod === 0) {
        // Simple case for 0% interest
        futureValue = periodicPayment * periods;
    } else {
        // Future Value of Annuity formula
        futureValue = periodicPayment * ((Math.pow(1 + ratePerPeriod, periods) - 1) / ratePerPeriod);
        if (annuityType === 'due') {
            futureValue *= (1 + ratePerPeriod);
        }
    }

    futureValueElement.textContent = `$${futureValue.toFixed(2)}`;

    // Calculate total contributions and interest
    const totalContributions = periodicPayment * periods;
    const totalInterest = futureValue - totalContributions;

    updateChart(totalContributions, totalInterest);
}

function updateChart(contributions, interest) {
    if (annuityChart) {
        annuityChart.destroy();
    }

    annuityChart = new Chart(annuityChartCanvas, {
        type: 'pie',
        data: {
            labels: ['Total Contributions', 'Total Interest'],
            datasets: [{
                data: [contributions, interest],
                backgroundColor: ['#007bff', '#28a745'], // Blue and Green
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Future Value Breakdown'
                }
            }
        }
    });
}

// Event listeners
const debouncedCalculate = debounce(calculateFutureValue, 500);

periodicPaymentInput.addEventListener('input', debouncedCalculate);
annualInterestRateInput.addEventListener('input', debouncedCalculate);
numberOfYearsInput.addEventListener('input', debouncedCalculate);
frequencySelect.addEventListener('change', debouncedCalculate);
annuityTypeRadios.forEach(radio => radio.addEventListener('change', debouncedCalculate));
calculateButton.addEventListener('click', calculateFutureValue); // Immediate calculation

// Initial calculation on page load
document.addEventListener('DOMContentLoaded', calculateFutureValue);
