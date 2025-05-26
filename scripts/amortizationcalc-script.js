document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const loanAmountInput = document.getElementById('loanAmount');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const loanTermYearsInput = document.getElementById('loanTermYears');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const monthlyPaymentSpan = document.getElementById('monthlyPayment');
    const amortizationScheduleDiv = document.getElementById('amortizationSchedule');
    const amortizationChartCanvas = document.getElementById('amortizationChart'); // Get the canvas element
    let amortizationChart; // Declare a variable to hold the Chart.js instance

    calculateBtn.addEventListener('click', generateSchedule);

    function generateSchedule() {
        const loanAmount = parseFloat(loanAmountInput.value);
        const annualRate = parseFloat(annualInterestRateInput.value);
        const loanTermYears = parseFloat(loanTermYearsInput.value);

        // --- Input Validation ---
        if (isNaN(loanAmount) || loanAmount <= 0) {
            alert('Please enter a valid loan amount (greater than 0).');
            return;
        }
        if (isNaN(annualRate) || annualRate < 0) {
            alert('Please enter a valid annual interest rate (0 or greater).');
            return;
        }
        if (isNaN(loanTermYears) || loanTermYears <= 0) {
            alert('Please enter a valid loan term in years (greater than 0).');
            return;
        }

        const monthlyRate = annualRate / 100 / 12;
        const totalPayments = loanTermYears * 12;

        let monthlyPayment;

        // Calculate Monthly Payment (Standard Loan Payment Formula)
        if (monthlyRate === 0) {
            monthlyPayment = loanAmount / totalPayments; // Simple division if 0 interest
        } else {
            // Check for division by zero if totalPayments is very high and monthlyRate is very low
            const denominator = (Math.pow(1 + monthlyRate, totalPayments) - 1);
            if (denominator === 0) {
                alert('Calculation error: Interest rate and term combination too extreme.');
                return;
            }
            monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / denominator;
        }


        // --- Display Monthly Payment ---
        monthlyPaymentSpan.textContent = `$${monthlyPayment.toFixed(2)}`;

        // --- Generate Amortization Schedule ---
        let currentBalance = loanAmount;
        let schedule = [];
        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;

        for (let i = 1; i <= totalPayments; i++) {
            const interestPayment = currentBalance * monthlyRate;
            let principalPayment = monthlyPayment - interestPayment;

            // Adjust last payment to ensure balance goes to exactly zero
            // Ensure principalPayment doesn't exceed currentBalance at any point (small floating point errors)
            if (i === totalPayments || principalPayment > currentBalance) {
                principalPayment = currentBalance; // Pay off remaining balance
                // Recalculate monthly payment for final month to avoid tiny remaining balance issues
                monthlyPayment = interestPayment + principalPayment;
            }

            currentBalance -= principalPayment;

            schedule.push({
                paymentNum: i,
                startingBalance: (i === 1) ? loanAmount : (loanAmount - totalPrincipalPaid), // Correct starting balance
                interestPaid: interestPayment,
                principalPaid: principalPayment,
                endingBalance: currentBalance < 0.01 ? 0 : currentBalance // Ensure 0 for very small remainders
            });

            totalInterestPaid += interestPayment;
            totalPrincipalPaid += principalPayment;
        }

        // Add a total row
        schedule.push({
            paymentNum: 'Total',
            startingBalance: null, // Not applicable for total row
            interestPaid: totalInterestPaid,
            principalPaid: totalPrincipalPaid,
            endingBalance: null
        });

        // --- Display Schedule Table ---
        displayAmortizationTable(schedule);

        // --- Update Pie Chart ---
        updatePieChart(totalPrincipalPaid, totalInterestPaid);
    }

    function displayAmortizationTable(schedule) {
        // Clear previous content
        amortizationScheduleDiv.innerHTML = '';
        amortizationScheduleDiv.style.display = 'block'; // Show the div

        const table = document.createElement('table');
        table.id = 'amortizationTable';

        // Table Header
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = ['Pmt #', 'Starting Balance', 'Interest Paid', 'Principal Paid', 'Ending Balance'];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        // Table Body
        const tbody = table.createTBody();
        schedule.forEach(payment => {
            const row = tbody.insertRow();
            if (payment.paymentNum === 'Total') {
                row.classList.add('total-row');
            }

            const formatCurrency = (value) => value !== null ? `$${value.toFixed(2)}` : '';

            row.insertCell().textContent = payment.paymentNum;
            row.insertCell().textContent = formatCurrency(payment.startingBalance);
            row.insertCell().textContent = formatCurrency(payment.interestPaid);
            row.insertCell().textContent = formatCurrency(payment.principalPaid);
            row.insertCell().textContent = formatCurrency(payment.endingBalance);
        });

        amortizationScheduleDiv.appendChild(table);
    }

    // New function to handle the pie chart
    function updatePieChart(principal, interest) {
        const ctx = amortizationChartCanvas.getContext('2d');

        // Destroy existing chart instance if it exists to prevent overlap
        if (amortizationChart) {
            amortizationChart.destroy();
        }

        amortizationChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Total Principal Paid', 'Total Interest Paid'],
                datasets: [{
                    data: [principal, interest],
                    backgroundColor: [
                        '#007bff', // Blue for Principal
                        '#ffc107'  // Yellow/Orange for Interest
                    ],
                    hoverBackgroundColor: [
                        '#0056b3',
                        '#e0a800'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allows the chart to fill its container
                plugins: {
                    title: {
                        display: true,
                        text: 'Principal vs. Interest Over Loan Term',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom', // Place legend at the bottom
                    }
                }
            }
        });
    }

    // Initial calculation on page load
    generateSchedule();
});
