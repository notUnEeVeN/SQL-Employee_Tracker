const inquirer = require('inquirer');
const mysql = require('mysql2');

let db;

//here I use inquirer to make a list of all the different functionalities of my program, using the .then functionality to 
//take the answer and then execute the accurate designated function that the user chose
function mainMenu() {
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View all departments',
        'View all roles',
        'View all employees',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update an employee role',
        'Exit'
      ]
    }
  ]).then(answer => {
    switch (answer.action) {
      case 'View all departments':
        viewAllDepartments();
        break;
      case 'View all roles':
        viewAllRoles();
        break;
      case 'View all employees':
        viewAllEmployees();
        break;
      case 'Add a department':
        addDepartment();
        break;
      case 'Add a role':
        addRole();
        break;
      case 'Add an employee':
        addEmployee();
        break;
      case 'Update an employee role':
        updateEmployeeRole();
        break;
      default:
        db.end();
    }
  });
}

//displays all departments in console
function viewAllDepartments() {
  db.query('SELECT id, name FROM departments', (err, rows) => {
    if (err) throw err;
    console.table(rows);
    mainMenu();
  });
}

//displays all roles in console
function viewAllRoles() {
  db.query('SELECT roles.id, roles.title, roles.salary, departments.name as department FROM roles JOIN departments ON roles.department_id = departments.id', (err, rows) => {
    if (err) throw err;
    console.table(rows);
    mainMenu();
  });
}

//displays all employees in console
function viewAllEmployees() {
  db.query('SELECT employees.id, employees.first_name, employees.last_name, roles.title as job_title, departments.name as department, roles.salary, CONCAT(manager.first_name, " ", manager.last_name) as manager FROM employees LEFT JOIN roles ON employees.role_id = roles.id LEFT JOIN departments ON roles.department_id = departments.id LEFT JOIN employees manager ON employees.manager_id = manager.id', (err, rows) => {
    if (err) throw err;
    console.table(rows);
    mainMenu();
  });
}

//functionality to add a department and store it
function addDepartment() {
  inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'What is the name of the department?'
    }
  ]).then(answer => {
    db.query('INSERT INTO departments (name) VALUES (?)', [answer.name], err => {
      if (err) throw err;
      console.log(`Added department ${answer.name}`);
      mainMenu();
    });
  });
}

//functionality to add a role and store it properly
function addRole() {
  db.query('SELECT * FROM departments', (err, departments) => {
    if (err) throw err;
    inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'What is the title of the role?'
      },
      {
        type: 'input',
        name: 'salary',
        message: 'What is the salary for this role?'
      },
      {
        type: 'list',
        name: 'department',
        message: 'Which department does this role belong to?',
        choices: departments.map(dept => ({ name: dept.name, value: dept.id }))
      }
    ]).then(answer => {
      db.query('INSERT INTO roles (title, salary, department_id) VALUES (?, ?, ?)', [answer.title, answer.salary, answer.department], err => {
        if (err) throw err;
        console.log(`Added role ${answer.title}`);
        mainMenu();
      });
    });
  });
}

//function to add employees
function addEmployee() {
  db.query('SELECT id, title FROM roles', (err, roles) => {
    if (err) throw err;
    db.query('SELECT id, CONCAT(first_name, " ", last_name) AS fullName FROM employees', (err, managers) => {
      if (err) throw err;
      managers.push({ id: null, fullName: 'None' });

      inquirer.prompt([
        {
          type: 'input',
          name: 'first_name',
          message: 'Enter the first name of the employee:',
        },
        {
          type: 'input',
          name: 'last_name',
          message: 'Enter the last name of the employee:',
        },
        {
          type: 'list',
          name: 'role_id',
          message: 'Select the role of the employee:',
          choices: roles.map(r => ({ name: r.title, value: r.id }))
        },
        {
          type: 'list',
          name: 'manager_id',
          message: 'Select the manager for the employee:',
          choices: managers.map((manager) => ({ name: manager.fullName, value: manager.id })),
        }
      ]).then(answer => {
        db.query('INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', [answer.first_name, answer.last_name, answer.role_id, answer.manager_id], err => {
          if (err) throw err;
          console.log(`${answer.first_name} ${answer.last_name} was added to the database.`);
          mainMenu();
        });
      });
    });
  });
}

//function to update employee roles
function updateEmployeeRole() {
  db.query('SELECT * FROM employees', (err, employees) => {
    if (err) throw err;
    db.query('SELECT * FROM roles', (err, roles) => {
      if (err) throw err;
      inquirer.prompt([
        {
          type: 'list',
          name: 'employee',
          message: 'Which employee would you like to update?',
          choices: employees.map(e => ({ name: `${e.first_name} ${e.last_name}`, value: e.id }))
        },
        {
          type: 'list',
          name: 'newRole',
          message: 'What is the new role for this employee?',
          choices: roles.map(r => ({ name: r.title, value: r.id }))
        }
      ]).then(answer => {
        db.query('UPDATE employees SET role_id = ? WHERE id = ?', [answer.newRole, answer.employee], err => {
          if (err) throw err;
          console.log('Employee role updated');
          mainMenu();
        });
      });
    });
  });
}

//move database.js file into the index.js file, this initializes connection to sql 
function initializeDatabase(callback) {
  db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'employee_management'
  });

  db.connect(err => {
    if (err) return callback(err);
    callback(null, db);
  });
}

// Initialize the database and launches the main menu function
initializeDatabase((err, connection) => {
  if (err) throw err;
  db = connection;
  mainMenu();
});
