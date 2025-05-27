// scripts/ccpayoffcalc-script.js

// --- DOM Elements ---
const currentBalanceInput = document.getElementById('currentBalance');
const annualInterestRateInput = document.getElementById('annualInterestRate');
const monthlyPaymentInput = document.getElementById('monthlyPayment');
const extraMonthlyPaymentInput = document.getElementById('extraMonthlyPayment');
const calculateBtn = document.getElementById('calculateBtn');

const displayMinPaymentElem = document.getElementById('displayMinPayment');
const minPaymentTimeElem = document.getElementById('minPaymentTime');
const minPaymentInterestElem = document.getElementById('minPaymentInterest');
const minPaymentTotalElem = document.getElementById('minPaymentTotal');

const displayTotalPaymentElem = document.getElementById('displayTotalPayment');
const extraPaymentTimeElem = document.getElementById('extraPaymentTime');
const extraPaymentInterestElem = document.getElementById('extraPaymentInterest');
const extraPaymentTotalElem = document.getElementById('extraPaymentTotal');

const interestSavedElem = document.getElementById('interestSaved');
const timeSavedElem = document.getElementById('timeSaved');

const currentPaymentChartCanvas = document.getElementById('currentPaymentChart');
const interestSavingsChartCanvas = document.getElementById('interestSavingsChart');

let currentPaymentChart; // Chart.js instance for current payment breakdown
let interestSavingsChart; // Chart.js instance for interest savings comparison


// --- Debounce Function ---
// Prevents a function from being called too frequently.
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// --- Helper Function to Calculate Payoff ---
// Returns an object with payoff details (time, total interest, total paid)
function calculatePayoff(balance, annualRate, monthlyPaymentAmount) {
    let remainingBalance = balance;
    let totalInterestPaid = 0;
    let months = 0;
    const monthlyRate = (annualRate / 100) / 12;

    if (monthlyPaymentAmount <= 0 || monthlyPaymentAmount < (balance * monthlyRate)) {
        // If payment is too low or zero, it will never pay off
        return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
    }

    while (remainingBalance > 0 && months < 1200) { // Cap at 100 years (1200 months) to prevent infinite loop
        months++;
        const interestForMonth = remainingBalance * monthlyRate;
        totalInterestPaid += interestForMonth;
        remainingBalance -= (monthlyPaymentAmount - interestForMonth);

        if (remainingBalance < 0) { // Adjust for last payment
            totalInterestPaid += remainingBalance; // Subtract the excess payment from interest
            remainingBalance = 0;
        }
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const totalPaid = balance + totalInterestPaid;

    return {
        months: months,
        years: years,
        remainingMonths: remainingMonths,
        totalInterest: totalInterestPaid,
        totalPaid: totalPaid
    };
}

// --- Main Calculation and UI Update Function ---
function calculateCreditCardPayoff() {
    const currentBalance = parseFloat(currentBalanceInput.value) || 0;
    const annualInterestRate = parseFloat(annualInterestRateInput.value) || 0;
    const monthlyPayment = parseFloat(monthlyPaymentInput.value) || 0;
    const extraMonthlyPayment = parseFloat(extraMonthlyPaymentInput.value) || 0;

    // Scenario 1: With current monthly payment
    const minPayoff = calculatePayoff(currentBalance, annualInterestRate, monthlyPayment);

    // Scenario 2: With extra monthly payment
    const totalMonthlyPayment = monthlyPayment + extraMonthlyPayment;
    const extraPayoff = calculatePayoff(currentBalance, annualInterestRate, totalMonthlyPayment);

    // --- Update UI for Scenario 1 ---
    displayMinPaymentElem.textContent = monthlyPayment.toFixed(2);
    if (minPayoff.months === Infinity) {
        minPaymentTimeElem.textContent = 'Never (Payment too low)';
        minPaymentInterestElem.textContent = '$N/A';
        minPaymentTotalElem.textContent = '$N/A';
    } else {
        minPaymentTimeElem.textContent = `${minPayoff.years} Years, ${minPayoff.remainingMonths} Months`;
        minPaymentInterestElem.textContent = `$${minPayoff.totalInterest.toFixed(2)}`;
        minPaymentTotalElem.textContent = `$${minPayoff.totalPaid.toFixed(2)}`;
    }

    // --- Update UI for Scenario 2 ---
    displayTotalPaymentElem.textContent = totalMonthlyPayment.toFixed(2);
    if (extraPayoff.months === Infinity) {
        extraPaymentTimeElem.textContent = 'Never (Payment too low)';
        extraPaymentInterestElem.textContent = '$N/A';
        extraPaymentTotalElem.textContent = '$N/A';
    } else {
        extraPaymentTimeElem.textContent = `${extraPayoff.years} Years, ${extraPayoff.remainingMonths} Months`;
        extraPaymentInterestElem.textContent = `$${extraPayoff.totalInterest.toFixed(2)}`;
        extraPaymentTotalElem.textContent = `$${extraPayoff.totalPaid.toFixed(2)}`;
    }

    // --- Calculate Savings ---
    if (minPayoff.months === Infinity || extraPayoff.months === Infinity) {
        interestSavedElem.textContent = '$N/A';
        timeSavedElem.textContent = 'N/A';
    } else {
        const savedInterest = minPayoff.totalInterest - extraPayoff.totalInterest;
        interestSavedElem.textContent = `$${savedInterest.toFixed(2)}`;

        const savedMonths = minPayoff.months - extraPayoff.months;
        const savedYears = Math.floor(savedMonths / 12);
        const savedRemainingMonths = savedMonths % 12;
        timeSavedElem.textContent = `${savedYears} Years, ${savedRemainingMonths} Months`;
    }

    // --- Update Charts ---
    updateCharts(currentBalance, minPayoff.totalInterest, extraPayoff.totalInterest, minPayoff.months, extraPayoff.months);
}


// --- Chart Update Function ---
function updateCharts(balance, minInterest, extraInterest, minMonths, extraMonths) {
    // Chart 1: Principal vs. Interest (Current Payment)
    if (currentPaymentChart) {
        currentPaymentChart.destroy();
    }
    if (balance > 0 || minInterest > 0) { // Only show if there's data
        currentPaymentChart = new Chart(currentPaymentChartCanvas, {
            type: 'pie',
            data: {
                labels: ['Principal Paid', 'Interest Paid'],
                datasets: [{
                    data: [balance, minInterest],
                    backgroundColor: ['#007bff', '#dc3545'], // Blue for Principal, Red for Interest
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: false, // Title handled by HTML h3
                    }
                }
            }
        });
    } else {
        // Clear canvas if no data
        const ctx = currentPaymentChartCanvas.getContext('2d');
        ctx.clearRect(0, 0, currentPaymentChartCanvas.width, currentPaymentChartCanvas.height);
    }


    // Chart 2: Interest Savings Comparison
    if (interestSavingsChart) {
        interestSavingsChart.destroy();
    }
    if (minInterest > 0 || extraInterest > 0) { // Only show if there's data
        const interestSaved = minInterest - extraInterest;
        interestSavingsChart = new Chart(interestSavingsChartCanvas, {
            type: 'pie',
            data: {
                labels: ['Interest Saved', 'Interest Paid (with Extra Payment)'],
                datasets: [{
                    data: [interestSaved, extraInterest],
                    backgroundColor: ['#28a745', '#ffc107'], // Green for Saved, Orange for Paid
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: false, // Title handled by HTML h3
                    }
                }
            }
        });
    } else {
        // Clear canvas if no data
        const ctx = interestSavingsChartCanvas.getContext('2d');
        ctx.clearRect(0, 0, interestSavingsChartCanvas.width, interestSavingsChartCanvas.height);
    }
}


// --- Event Listeners ---
const debouncedCalculate = debounce(calculateCreditCardPayoff, 500); // Debounce for 500ms

currentBalanceInput.addEventListener('input', debouncedCalculate);
annualInterestRateInput.addEventListener('input', debouncedCalculate);
monthlyPaymentInput.addEventListener('input', debouncedCalculate);
extraMonthlyPaymentInput.addEventListener('input', debouncedCalculate);

// Explicit calculate button click
calculateBtn.addEventListener('click', calculateCreditCardPayoff);

// Initial calculation on page load
document.addEventListener('DOMContentLoaded', calculateCreditCardPayoff);
