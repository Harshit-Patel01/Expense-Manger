document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');

    if (!token || !userId) {
        window.location.href = 'index.html';
        return;
    }

    // DOM Elements
    const welcomeMessage = document.getElementById('welcomeMessage');
    const logoutButton = document.getElementById('logoutButton');
    const expenseChart = document.getElementById('expenseChart');
    const expenseTableBody = document.getElementById('expenseTableBody');
    const expenseForm = document.getElementById('expenseForm');
    const openExpenseModalBtn = document.getElementById('openExpenseModal');
    const expenseModal = document.getElementById('expenseModal');
    const closeModalBtn = document.getElementById('closeModal');

    // Set welcome message
    welcomeMessage.textContent = `Welcome, ${userName}`;

    // Logout functionality
    logoutButton.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // Modal functionality
    openExpenseModalBtn.addEventListener('click', () => {
        expenseModal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => {
        expenseModal.style.display = 'none';
    });

    // Close modal if clicked outside
    window.addEventListener('click', (event) => {
        if (event.target === expenseModal) {
            expenseModal.style.display = 'none';
        }
    });


    // Fetch and display expenses
    const fetchExpenses = async () => {
        try {
            const response = await fetch('https://expense-manger-d8ks.onrender.com/api/expenses/all', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const allExpenses = await response.json();

            // Clear existing table
            expenseTableBody.innerHTML = '';

            // Populate table with ALL expenses
            allExpenses.forEach(expense => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${new Date(expense.paidDate).toLocaleDateString()}</td>
                <td>${expense.fullName}</td>
                <td>${expense.amount.toFixed(2)}</td>
                <td>${expense.description}</td>
            `;
                expenseTableBody.appendChild(row);
            });

            // Create pie chart with all expenses
            createExpensePieChart(allExpenses);
        } catch (error) {
            console.error('Error fetching expenses:', error);

            // Provide more detailed error information
            if (error.message.includes('Failed to fetch')) {
                alert('Network error. Please check your internet connection.');
            } else {
                alert(`Failed to fetch expenses: ${error.message}`);
            }

            // Optionally, you can add a retry mechanism or fallback UI
            throw error; // Re-throw to allow calling code to handle it
        }
    };
    // Create pie chart
    const createExpensePieChart = (expenses) => {
        // Destroy existing chart if it exists
        if (window.expenseChartInstance) {
            window.expenseChartInstance.destroy();
        }

        // Group all expenses by user
        const expenseByUser = expenses.reduce((acc, expense) => {
            acc[expense.fullName] = (acc[expense.fullName] || 0) + expense.amount;
            return acc;
        }, {});

        // Create new chart and store the instance
        window.expenseChartInstance = new Chart(expenseChart, {
            type: 'pie',
            data: {
                labels: Object.keys(expenseByUser),
                datasets: [{
                    data: Object.values(expenseByUser),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Total Expenses by All Users'
                }
            }
        });
    };

    // Add expense form submission
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = document.getElementById('expenseAmount').value;
        const description = document.getElementById('expenseDescription').value;

        try {
            const response = await fetch('https://expense-manger-d8ks.onrender.com/api/expenses', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    description
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Close modal
                expenseModal.style.display = 'none';

                // Clear form
                expenseForm.reset();

                // Refresh expenses with error handling
                try {
                    await fetchExpenses();
                } catch (fetchError) {
                    console.error('Error refreshing expenses:', fetchError);
                    // Optionally, you can add a user-friendly message or retry mechanism
                    alert('Expense added, but there was an issue refreshing the list. Please reload the page.');
                }
            } else {
                alert(data.message || 'Failed to add expense');
            }
        } catch (error) {
            console.error('Add Expense Error:', error);
            alert('An error occurred while adding expense');
        }
    });

    // Initial fetch of expenses
    fetchExpenses();
});
