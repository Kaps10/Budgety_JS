/*      ---------------------------------------------   Budget Controller   ---------------------------------------------      */

// Handles all the events related to Budget.
var budgetController = (function() {

    // Expense Constructor
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    // Calculates the percentage
    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    // Returns the percentage
    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }

    // Income Constructor
    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    // Function to calculate total budget - used in 'calculateBudget' ctrl
    var calculateTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(function(cur) {
            sum += cur.value;
        });
        data.totals[type] = sum;
    };

    // Data structure -where all the actual data will be stored
    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };

    return {
        // Method to 'add Item - exp / inc' to our app
        addItem: function(type, des, val) {
            var newItem, ID;

            // Here, 'type' = exp or inc - Create new ID for the new item
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }

            // Create new item based on 'exp' or 'inc' type
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }

            // Push it into our data structure & returns new element
            data.allItems[type].push(newItem);
            return newItem;   
        },

        // Method to delete an item
        deleteItem: function(type, id) {
            var ids, index;
            
            // 'Map' returns a new array - which receives a callback fn
            ids = data.allItems[type].map(function(current) {
                return current.id;
            });

            // Returns an 'index no' of the element of the array we pass as a param
            index = ids.indexOf(id);

            if (index !== -1) {
                /* 'Splice' - to remove an element
                    splice('element's position where we want to delete',
                    'no of element's we want to delete') */
                data.allItems[type].splice(index, 1);
            }
        },

        // Method to calculate the actual budget
        calculateBudget: function() {
            // Calculate total income & expenses
            calculateTotal('exp');
            calculateTotal('inc');

            // Calculate the budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the '%' of income we spent
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        // Method to calculate the percentages while updating them
        calculatePercentages: function() {
            // 'exp' is an expense array we create in data
            data.allItems.exp.forEach(function(cur) {
                cur.calcPercentage(data.totals.inc);
            });
        },

        // Method to get the updated percentages
        getPercentages: function() {
            // We use 'map' as it returns something
            var allPerc = data.allItems.exp.map(function(cur) {
                return cur.getPercentage();
            });
            return allPerc;
        },

        // Method to get the actual budget and return it to the main ctrl
        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },

        testing: function() {
            console.log(data);
        }
    };
})();


/*      ---------------------------------------------   UI Controller   ---------------------------------------------      */


// Handles all the events related to UI.
var UIController = (function() {
    var DOMStrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        monthLabel: '.budget__title--month'
    };

    // Display '+' & '-' signs and to format numbers - Private function
    var formatNumber = function(num, type) {
        var numSplit, int, dec;
        
        num = Math.abs(num);
        num = num.toFixed(2);   // 'toFixed' is a method of 'num' prototype
        
        numSplit = num.split('.');

        int = numSplit[0];
        if (int.length > 3) {
            // Substring - allows us to take a part of a string
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
        }

        dec = numSplit[1];
        
        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec + ' $';
    };

    // This returns a 'node' list - uses 'ForEach' function
    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            // Param - 'current list', 'index'
            callback(list[i], i);
        }
    };

    return {
        getInput: function() {
            return{
                // For inc or exp in HTML
                type: document.querySelector(DOMStrings.inputType).value,
                description: document.querySelector(DOMStrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
            };
        },

        // To add an item according to its type 'inc' or 'exp'
        addListItem: function(obj, type) {
            var html, newHtml, element;

            // 1. HTML string with placeholder
            if (type === 'inc') {
                element = DOMStrings.incomeContainer;
                
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                element = DOMStrings.expensesContainer;
                
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // 2. Replace placeholder with actual data which we receive from 'data'
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // 3. Insert HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        // To delete an item in the UI
        deleteListItem: function(selectorId) {
            var el = document.getElementById(selectorId);
            el.parentNode.removeChild(el);
        },

        // To clear the input fields for 'desc' & 'value'
        clearFields: function() {
            var fields, fieldsArr;
            
            fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue);
            
            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function(current, index, array) {
                current.value = "";
            });

            fieldsArr[0].focus();
        },

        // Display the total budget at the top - From 'getBudget' method
        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
                        
            if (obj.percentage > 0) {
                document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMStrings.percentageLabel).textContent = '---';
            }
        },

        // Display the updated percentages
        displayPercentages: function(percentages) {
            // This returns a 'node' list
            var fields = document.querySelectorAll(DOMStrings.expensesPercLabel);

            nodeListForEach(fields, function(current, index) {
                if (percentages[index] > 0 ){
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });
        },

        // To display the exact Month
        displayMonth: function() {
            var date, month, months, year;
            date = new Date();
            
            months = ['January', 'February', 'March', 
                        'April', 'May', 'June', 'July',
                        'August', 'September', 'October', 
                        'November', 'December'];
            month = date.getMonth();
            year = date.getFullYear();

            document.querySelector(DOMStrings.monthLabel).textContent = months[month] + ' ' + year;
        },
        
        // To change the color acc. 'inc - blue' or 'exp - red'
        changedType: function() {
            var fields;

            // This returns 'nodeList' - we use already created 'nodeListForEach' function
            fields = document.querySelectorAll(
                DOMStrings.inputType + ',' +
                DOMStrings.inputDescription + ',' +
                DOMStrings.inputValue
            );
            nodeListForEach(fields, function(cur) {
                // This will set the focus color 'red' for expense
                cur.classList.toggle('red-focus');
            });

            // This will set the button color 'red' for expense
            document.querySelector(DOMStrings.inputBtn).classList.toggle('red');
        },

        getDOMStrings: function() {
            return DOMStrings;
        }
    };
})();


/*      ---------------------------------------------   App(Main) Controller   ---------------------------------------------      */


// Global Controller - We pass the budget-UI Controller as an argument here.
var controller = (function(budgetCtrl, UICtrl) {
    var setupEventListeners = function() {
        var DOM = UICtrl.getDOMStrings();

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function(event) {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });

        // Set an EventListener to delete an item using common attribute
        // We use 'delete' delegation using 'container' class from HTML
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        // This will change the input color to 'Red' when we select 'exp' type - define on 'changedType'
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    };

    // Controller to calculate the budget - adding & deleting an item
    var updateBudget = function() {
        // 1. Calculate the budget.
        budgetCtrl.calculateBudget();

        // 2. Return the budget
        var budget = budgetCtrl.getBudget();
        
        // 3. Display the budget on the UI.
        UICtrl.displayBudget(budget);
        console.log(budget);
    };

    // To update the '%' when we add or remove an item
    var updatePercentages = function() {
        // 1. Calculate percentages
        budgetCtrl.calculatePercentages();

        // 2. Read percentages from the 'budget' controller
        var percentages = budgetCtrl.getPercentages();

        // 3. Update it in UI
        UICtrl.displayPercentages(percentages);
    };

    // Controller to handle all the operations including adding & removing
    var ctrlAddItem = function() {
        var input, newItem;
        
        // 1. Get the filled input data.
        input = UICtrl.getInput();

        // To check 'desc' & 'value' should not be empty and > zero
        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            // 2. Add the item to the budget controller.
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add the item to the UI.
            UICtrl.addListItem(newItem, input.type);

            // 4. Clear the input fields.
            UICtrl.clearFields();

            // 5. Calculate & update the budget using 'updateBudget' ctrl
            updateBudget();

            // 6. Calculate & update the Percentages
            updatePercentages();
        }
    };

    // Controller to delete 'inc' or 'exp'
    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, ID;

        // Traversing all the way to parent from child
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        if (itemID) {
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);

            // 1. Delete an item from Data Structure 'data'
            budgetCtrl.deleteItem(type, ID);

            // 2. Delete an item from UI
            UICtrl.deleteListItem(itemID);

            // 3. Update & show the new budget
            updateBudget();

            // 4. Calculate & update the Percentages
            updatePercentages();
        }
    };

    return {
        init: function() {
            console.log('Application is started Successfully.');
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    };

})(budgetController, UIController);

controller.init();