const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('../db/db');
const sqlite3 = require('sqlite3').verbose()
const { objectToString } = require('./tools');

// Create an express app
const app = express();
// Set the port number
const port = 3000;

// Middleware for file upload
const upload = multer({ dest: '../csv/' }); //In a higher scalable system a S3 solution would be a better idea. Glaciar is a great option for long term storage


app.use(express.json());

//ASSUMPTION: Files will be uploaded independently via the endpoint so file and the table it belongs to are required
//One also could assume that the file name could provide info about the table, or even analyzing CSV header is an option, I'll take the file name an mapped it to the table
app.post('/v1/upload', upload.single('file'), (req, res) => {
    console.log('Starting upload request');

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded or missing table info.' });
    } //Other verification are recommended: file type and size, accepted list of tables, etc

    const orgFileName = req.file.originalname; // The table name (departments, jobs, or employees)

    let tableName = ''; //The table name (departments, jobs, or employees)
    switch (orgFileName) {
        case 'hired_employees.csv':
            tableName = 'employees';
            break;
        default:
            tableName = orgFileName.split('.')[0];

    }

    // Check if the table name is valid
    if (!['departments', 'jobs', 'employees'].includes(tableName)) {
        // Send an error response
        res.status(400).send('Invalid table name. Only departments, jobs, or employees are accepted.');
        return;
    }

    const data = [];

    //Streaming sql creation
    fs.createReadStream(req.file.path)
        .pipe(csv({ headers: false }))
        .on('data', (row) => {
            data.push(row);
        })// Push each row into the data array
        .on('end', () => {
            // Check if the data array is empty
            if (data.length === 0) {
                // Send an error response
                res.status(400).send('Empty file. No data found.');
                return;
            }

            // Create the SQL query
            let query = `INSERT INTO ${tableName} VALUES `;

            const subq = data.map(obj => objectToString(obj)).join(', \n');

            query = query + subq + ';';

            console.log( 'Executed query: ' + query);

            //Given that we have a maximum of 1000 insertions we can use a single query. Many other factor may influence using other strategies
            //Nonetheless the provided files contain more than 1000 rows. we could slit the process in windows of 1000 elements.
            // Lucky for us, SQLite can handle more than 1000 insertions in a single query.
            db.run(query, function (err) {
                if (err) {
                    return console.log(err.message);
                }
            });
            res.json({ message: `Uploaded ${data.length} rows to the ${tableName} table.` });
        });
});

//Ideally some parameters should be passed to the endpoint to filter the data, but for simplicity I'll just return all the data as requested in the document
app.get('/v1/employee-stats', (req, res) => {
    // Define the SQL query to retrieve the data
    const query = `
    SELECT
      employee_quarters.department,
      employee_quarters.job,
      COUNT(CASE WHEN quarter = 1 THEN 1 ELSE NULL END) AS "Q1",
      COUNT(CASE WHEN quarter = 2 THEN 1 ELSE NULL END) AS "Q2",
      COUNT(CASE WHEN quarter = 3 THEN 1 ELSE NULL END) AS "Q3",
      COUNT(CASE WHEN quarter = 4 THEN 1 ELSE NULL END) AS "Q4"
    FROM (
      SELECT
                                  employees.id,
                                  departments.department as department,
                                  job as job,
                                  CASE
                                          WHEN strftime('%m', datetime) BETWEEN '01' AND '03' THEN 1
                                          WHEN strftime('%m', datetime) BETWEEN '04' AND '06' THEN 2
                                          WHEN strftime('%m', datetime) BETWEEN '07' AND '09' THEN 3
                                          WHEN strftime('%m', datetime) BETWEEN '10' AND '12' THEN 4
                                      END AS quarter
                                FROM employees
                                JOIN departments ON employees.department_id = departments.id
                                JOIN jobs ON employees.job_id = jobs.id
                                WHERE strftime('%Y',  \`datetime\`) = '2021'
    ) AS employee_quarters
    GROUP BY employee_quarters.department, employee_quarters.job
    ORDER BY employee_quarters.department, employee_quarters.job;
  `;

    // Execute the query
    db.all(query, (err, rows) => {
        // Check if there is an error
        if (err) {
            // Send an error response
            res.status(500).send('Internal server error');
            return;
        }

        // Send the response
        res.json(rows);
    });
});


app.get('/v1/top-departments', (req, res) => {
    // Define the SQL query to retrieve the list of departments
    const query = `
    WITH DepartmentEmployees AS (
      SELECT
        departments.id AS department_id,
        departments.department AS department_name,
        COUNT(*) AS hired_employees
      FROM employees
      JOIN departments ON employees.department_id = departments.id
      WHERE strftime('%Y', employees.datetime) = '2021'
      GROUP BY department_id, department_name
    ),
    MeanEmployees AS (
      SELECT AVG(hired_employees) AS mean_employees
      FROM DepartmentEmployees
    )
    SELECT
      department_id AS id,
      department_name AS department,
      hired_employees AS hired
    FROM DepartmentEmployees
    WHERE hired_employees > (SELECT mean_employees FROM MeanEmployees)
    ORDER BY hired_employees DESC;
  `;

    // Execute the query
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error.' });
        }

        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports =  app;
