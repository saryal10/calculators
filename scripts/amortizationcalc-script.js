// scripts/amortizationcalc-script.js

// Get references to input elements
const loanAmountInput = document.getElementById('loanAmount');
const annualInterestRateInput = document.getElementById('annualInterestRate');
const loanTermYearsInput = document.getElementById('loanTermYears');
const calculateButton = document.getElementById('calculateBtn'); // Get the button

// Get references to output elements
const monthlyPaymentElement = document.getElementById('monthlyPayment');
const amortizationScheduleDiv = document.getElementById('amortizationSchedule');
const amortizationChartCanvas = document.getElementById('amortizationChart');
let amortizationChart; // To store the Chart.js instance

// --- Debounce Function ---
// This function takes a function and a delay, and returns a new function
// that will only execute the original function after the specified delay
// has passed without being called again.
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
// --- End Debounce Function ---


// Function to calculate amortization and update UI
function calculateAmortization() {
    const loanAmount = parseFloat(loanAmountInput.value);
    const annualInterestRate = parseFloat(annualInterestRateInput.value);
    const loanTermYears = parseFloat(loanTermYearsInput.value);

    // Basic validation
    if (isNaN(loanAmount) || loanAmount <= 0 ||
        isNaN(annualInterestRate) || annualInterestRate < 0 ||
        isNaN(loanTermYears) || loanTermYears <= 0) {
        monthlyPaymentElement.textContent = '$0.00';
        amortizationScheduleDiv.style.display = 'none';
        // Clear chart if inputs are invalid
        if (amortizationChart) {
            amortizationChart.destroy();
            amortizationChart = null;
        }
        return;
    }

    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;

    let monthlyPayment;
    if (annualInterestRate === 0) {
        // Simple case for 0% interest
        monthlyPayment = loanAmount / numberOfPayments;
    } else {
        // Amortization formula
        monthlyPayment = (loanAmount * monthlyInterestRate) /
                         (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments));
    }


    // Display monthly payment
    monthlyPaymentElement.textContent = `$${monthlyPayment.toFixed(2)}`;

    // Generate amortization schedule and update chart data
    generateSchedule(loanAmount, monthlyInterestRate, numberOfPayments, monthlyPayment);
}

// Function to generate and display the amortization table and update the chart
function generateSchedule(principal, monthlyInterestRate, numberOfPayments, monthlyPayment) {
    let balance = principal;
    let totalInterestPaid = 0;
    const scheduleData = [];
    const chartLabels = [];
    const chartPrincipalData = [];
    const chartInterestData = [];

    let tableHTML = `
        <table id="amortizationTable">
            <thead>
                <tr>
                    <th>Payment No.</th>
                    <th>Payment Amount</th>
                    <th>Interest Paid</th>
                    <th>Principal Paid</th>
                    <th>Remaining Balance</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = balance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance -= principalPayment;
        totalInterestPaid += interestPayment;

        // Ensure balance doesn't go negative due to floating point inaccuracies
        if (balance < 0) {
            balance = 0;
        }

        scheduleData.push({
            paymentNo: i,
            paymentAmount: monthlyPayment,
            interestPaid: interestPayment,
            principalPaid: principalPayment,
            remainingBalance: balance
        });

        tableHTML += `
            <tr>
                <td>${i}</td>
                <td>$${monthlyPayment.toFixed(2)}</td>
                <td>$${interestPayment.toFixed(2)}</td>
                <td>$${principalPayment.toFixed(2)}</td>
                <td>$${balance.toFixed(2)}</td>
            </tr>
        `;

        // Add data for chart (e.g., every 12th payment or specific intervals)
        if (i % 12 === 0 || i === 1 || i === numberOfPayments) { // Example: every year, first, and last
             chartLabels.push(`Month ${i}`);
             chartPrincipalData.push(principalPayment);
             chartInterestData.push(interestPayment);
        }
    }

    tableHTML += `
            <tr class="total-row">
                <td colspan="2">Total Interest Paid:</td>
                <td>$${totalInterestPaid.toFixed(2)}</td>
                <td colspan="2"></td>
            </tr>
            </tbody>
        </table>
    `;

    amortizationScheduleDiv.innerHTML = `<h2>Amortization Schedule:</h2>${tableHTML}`;
    amortizationScheduleDiv.style.display = 'block';


    // Update Chart
    if (amortizationChart) {
        amortizationChart.destroy(); // Destroy existing chart before creating a new one
    }

    amortizationChart = new Chart(amortizationChartCanvas, {
        type: 'pie', // Or 'bar', 'line' depending on what you want to show
        data: {
            labels: ['Total Principal', 'Total Interest'],
            datasets: [{
                data: [principal, totalInterestPaid],
                backgroundColor: ['#007bff', '#dc3545'], // Blue for Principal, Red for Interest
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow chart to fill its container
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Principal vs. Interest (Overall)'
                }
            }
        }
    });
}

// Create a debounced version of your calculation function
const debouncedCalculateAmortization = debounce(calculateAmortization, 500); // 500ms debounce delay


// Add event listeners:
// 1. On 'input' for immediate (debounced) feedback
loanAmountInput.addEventListener('input', debouncedCalculateAmortization);
annualInterestRateInput.addEventListener('input', debouncedCalculateAmortization);
loanTermYearsInput.addEventListener('input', debouncedCalculateAmortization);

// 2. On 'click' for the button (immediate calculation)
calculateButton.addEventListener('click', calculateAmortization); // No debounce on click

// Run calculation once on page load to show initial results
document.addEventListener('DOMContentLoaded', calculateAmortization);
