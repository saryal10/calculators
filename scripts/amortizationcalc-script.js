document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const loanAmountInput = document.getElementById('loanAmount');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const loanTermYearsInput = document.getElementById('loanTermYears');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements (summary)
    const monthlyPaymentSpan = document.getElementById('monthlyPayment');
    const totalPrincipalPaidSpan = document.getElementById('totalPrincipalPaid');
    const totalInterestPaidSpan = document.getElementById('totalInterestPaid');
    const overallLoanCostSpan = document.getElementById('overallLoanCost');

    // Amortization Table elements
    const amortizationScheduleContainer = document.getElementById('amortizationScheduleContainer'); // Corrected ID
    const amortizationTableBody = document.querySelector('#amortizationTable tbody');

    // Chart elements
    const amortizationChartCanvas = document.getElementById('amortizationChart');
    let amortizationChart; // To hold the Chart.js instance

    // Attach event listeners for real-time updates using debounce
    const inputs = [
        loanAmountInput,
        annualInterestRateInput,
        loanTermYearsInput
    ];
    inputs.forEach(input => input.addEventListener('input', debounce(generateAmortizationSchedule, 300)));

    // Event listener for the explicit calculate button (no debounce needed here)
    calculateBtn.addEventListener('click', generateAmortizationSchedule);

    // Initial generation on page load to show default values
    generateAmortizationSchedule();

    // Debounce function to limit how often a function is called
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    function generateAmortizationSchedule() {
        const loanAmount = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(annualInterestRateInput.value);
        const loanTermYears = parseFloat(loanTermYearsInput.value);

        // --- Input Validation ---
        if (isNaN(loanAmount) || loanAmount <= 0) {
            displayError('Please enter a valid loan amount (must be greater than 0).');
            resetResults();
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            displayError('Please enter a valid annual interest rate (non-negative).');
            resetResults();
            return;
        }
        if (isNaN(loanTermYears) || loanTermYears <= 0) {
            displayError('Please enter a valid loan term (must be greater than 0 years).');
            resetResults();
            return;
        }

        const monthlyInterestRate = (annualInterestRate / 100) / 12;
        const numberOfPayments = loanTermYears * 12;

        let monthlyPayment;
        if (monthlyInterestRate === 0) {
            monthlyPayment = loanAmount / numberOfPayments;
        } else {
            // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
            const i_plus_1_pow_n = Math.pow(1 + monthlyInterestRate, numberOfPayments);
            monthlyPayment = loanAmount * (monthlyInterestRate * i_plus_1_pow_n) / (i_plus_1_pow_n - 1);
        }

        let remainingBalance = loanAmount;
        let totalInterestAccrued = 0; // Renamed to avoid confusion with `totalInterestPaid` in chart
        let totalPrincipalAccrued = 0;

        // Data for chart
        const chartLabels = [];
        const chartPrincipalData = [];
        const chartInterestData = [];
        const chartBalanceData = [];

        // Clear previous table rows
        amortizationTableBody.innerHTML = '';

        for (let i = 1; i <= numberOfPayments; i++) {
            const interestPayment = remainingBalance * monthlyInterestRate;
            let principalPayment = monthlyPayment - interestPayment;

            // Adjust last payment to account for rounding errors and ensure balance reaches zero
            if (i === numberOfPayments) {
                principalPayment = remainingBalance;
            }

            remainingBalance -= principalPayment;
            totalInterestAccrued += interestPayment;
            totalPrincipalAccrued += principalPayment; // Accumulate total principal paid

            // Ensure balance doesn't go negative due to floating point inaccuracies
            if (remainingBalance < 0) {
                remainingBalance = 0;
            }

            // Add row to table
            const row = amortizationTableBody.insertRow();
            row.innerHTML = `
                <td>${i}</td>
                <td>$${(remainingBalance + principalPayment).toFixed(2)}</td>
                <td>$${monthlyPayment.toFixed(2)}</td>
                <td>$${principalPayment.toFixed(2)}</td>
                <td>$${interestPayment.toFixed(2)}</td>
                <td>$${remainingBalance.toFixed(2)}</td>
            `;

            // Collect data for chart (e.g., every 12th payment for annual view or more frequently for shorter terms)
            // Always include first and last for better chart representation
            if (i % 12 === 0 || i === 1 || i === numberOfPayments) {
                 chartLabels.push(`Pmt ${i}`);
                 chartPrincipalData.push(principalPayment);
                 chartInterestData.push(interestPayment);
                 chartBalanceData.push(remainingBalance);
            }
        }

        const overallLoanCost = loanAmount + totalInterestAccrued;

        // --- Display Summary Results ---
        monthlyPaymentSpan.textContent = `$${monthlyPayment.toFixed(2)}`;
        totalPrincipalPaidSpan.textContent = `$${totalPrincipalAccrued.toFixed(2)}`; // Use accumulated principal
        totalInterestPaidSpan.textContent = `$${totalInterestAccrued.toFixed(2)}`; // Use accumulated interest
        overallLoanCostSpan.textContent = `$${overallLoanCost.toFixed(2)}`;

        // Show the schedule container
        amortizationScheduleContainer.style.display = 'block';

        // Update the chart
        updateAmortizationChart(chartLabels, chartPrincipalData, chartInterestData, chartBalanceData);
    }

    // --- Chart Update Function ---
    function updateAmortizationChart(labels, principalData, interestData, balanceData) {
        if (amortizationChart) {
            amortizationChart.destroy(); // Destroy existing chart before creating a new one
        }

        amortizationChart = new Chart(amortizationChartCanvas, {
            type: 'line', // Set chart type to 'line' for time-series data
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Principal Paid',
                        data: principalData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true, // Fill area under the line
                        tension: 0.2, // Slightly smooth lines
                        yAxisID: 'y' // Use primary Y-axis
                    },
                    {
                        label: 'Interest Paid',
                        data: interestData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        fill: true, // Fill area under the line
                        tension: 0.2,
                        yAxisID: 'y' // Use primary Y-axis
                    },
                    {
                        label: 'Remaining Balance',
                        data: balanceData,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        fill: false, // Don't fill for balance
                        tension: 0.2,
                        yAxisID: 'y1' // Use a separate Y-axis for balance due to different scale
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow chart to scale within its container
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false, // Title is handled by h3 in HTML
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Payment Portion ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
                            }
                        },
                        grid: {
                            drawOnChartArea: true, // Show grid lines for this Y-axis
                        },
                        min: 0, // Ensure scale starts at 0
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Remaining Balance ($)'
                        },
                        grid: {
                            drawOnChartArea: false, // Don't draw grid lines for this Y-axis if y already has them
                        },
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
                            }
                        },
                        min: 0, // Ensure scale starts at 0
                        max: parseFloat(loanAmountInput.value) * 1.1 // Dynamically set max a bit above loan amount
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Payment Number'
                        }
                    }
                }
            }
        });
    }

    // Helper function to reset results and clear table/chart on invalid input
    function resetResults() {
        monthlyPaymentSpan.textContent = '$0.00';
        totalPrincipalPaidSpan.textContent = '$0.00';
        totalInterestPaidSpan.textContent = '$0.00';
        overallLoanCostSpan.textContent = '$0.00';
        amortizationTableBody.innerHTML = ''; // Clear table
        amortizationScheduleContainer.style.display = 'none'; // Hide the table
        if (amortizationChart) {
            amortizationChart.destroy(); // Destroy chart if it exists
        }
    }

    // Helper function to display basic errors (can be expanded with a dedicated message area)
    function displayError(message) {
        console.error(message); // For development
        // You might want to display this message in the UI, e.g., in a div below inputs
    }
});
