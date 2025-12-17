<?php
// ============================================
// Database Connection File - PDO MySQL
// ============================================
// This file handles all database connections using PDO (PHP Data Objects)
// PDO provides a secure way to interact with MySQL databases

// Database configuration variables
// These contain the credentials needed to connect to the MySQL database
$host = 'localhost';      // Database server address
$user = 'root';           // Database username
$pass = '';               // Database password (empty in this case)
$db = 'sos_db';           // Database name

// Create the Data Source Name (DSN) string
// DSN format: 'mysql:host=hostname;dbname=database_name'
// This tells PDO what type of database we're using and where to find it
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";

try {
    // Create a new PDO connection to the MySQL database
    // Parameters: DSN, username, password, and options array
    // The PDO constructor attempts to connect to the database
    $pdo = new PDO($dsn, $user, $pass, [
        // Set PDO error mode to EXCEPTION
        // This makes PDO throw exceptions instead of silently failing
        // Exceptions make it easier to catch and handle errors
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        
        // Set the default fetch mode to associative array
        // This means queries will return data as associative arrays
        // Example: ['id' => 1, 'name' => 'John'] instead of indexed arrays
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        
        // Enable persistent connections (optional, improves performance)
        // Persistent connections reuse database connections across requests
        PDO::ATTR_PERSISTENT => false,
    ]);
    
    // If we reach here, the connection was successful
    // Log success message to console/browser
    echo "✅ Database connection successful!\n";
    
} catch (PDOException $e) {
    // If connection fails, catch the exception here
    // PDOException is thrown by PDO when something goes wrong
    
    // Log the error message
    // getMessage() returns a human-readable description of what went wrong
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    
    // Stop script execution if connection fails
    // die() terminates the script to prevent further errors
    die("Connection Error: Please check your database credentials.\n");
}

// ============================================
// Test Query Example
// ============================================
// This section demonstrates how to run a SELECT query

try {
    // Prepare a SELECT SQL statement
    // prepare() creates a prepared statement to prevent SQL injection
    // Prepared statements are safer than concatenating strings into queries
    $sql = "SELECT * FROM notifications LIMIT 5";
    
    // Execute the prepared statement
    // query() is a shorthand for prepare() + execute() for simple queries
    $result = $pdo->query($sql);
    
    // Fetch all results as an associative array
    // fetchAll() returns all rows matching the query as an array
    $notifications = $result->fetchAll();
    
    // Check if any results were returned
    // count() returns the number of rows in the array
    if (count($notifications) > 0) {
        // Results found - display count and first result
        echo "✅ Query successful! Found " . count($notifications) . " records.\n";
        echo "First result: " . json_encode($notifications[0]) . "\n";
    } else {
        // No results found - display message
        echo "⚠️  Query executed but no records found.\n";
    }
    
} catch (PDOException $e) {
    // If query fails, catch the exception
    // This handles errors like table not existing or permission issues
    
    // Display the error message
    echo "❌ Query failed: " . $e->getMessage() . "\n";
}

// ============================================
// Prepared Statement Example (Secure Method)
// ============================================
// This shows the recommended way to execute queries with parameters

try {
    // Example: Query with a WHERE clause using parameter binding
    // The ? is a placeholder for a parameter value
    // This prevents SQL injection attacks
    $sql = "SELECT * FROM notifications WHERE type = ? LIMIT 1";
    
    // Prepare the statement
    // prepare() returns a PDOStatement object
    $stmt = $pdo->prepare($sql);
    
    // Execute the statement with the parameter
    // The parameter value replaces the ? placeholder
    $stmt->execute(['broadcast']);
    
    // Fetch the first result
    // fetch() returns a single row, or false if no results found
    $notification = $stmt->fetch();
    
    // Check if a result was found
    if ($notification) {
        // Result found - display the notification
        echo "✅ Found broadcast notification: " . $notification['title'] . "\n";
    } else {
        // No result found
        echo "⚠️  No broadcast notifications found.\n";
    }
    
} catch (PDOException $e) {
    // Handle query errors
    echo "❌ Prepared statement failed: " . $e->getMessage() . "\n";
}

// ============================================
// Useful PDO Methods Reference
// ============================================
/*
 * $pdo->query($sql)
 * - Executes a query and returns a PDOStatement
 * - Use for SELECT queries without parameters
 * 
 * $pdo->prepare($sql)
 * - Prepares a statement for execution (prevents SQL injection)
 * - Returns a PDOStatement object
 * 
 * $stmt->execute([$param1, $param2])
 * - Executes a prepared statement with parameters
 * 
 * $stmt->fetch()
 * - Returns the next row from a result set
 * - Returns false if no more rows
 * 
 * $stmt->fetchAll()
 * - Returns all rows from a result set as an array
 * 
 * $stmt->rowCount()
 * - Returns the number of rows affected by the last query
 * 
 * $pdo->lastInsertId()
 * - Returns the ID of the last inserted row
 * 
 * $pdo->exec($sql)
 * - Executes a statement and returns the number of affected rows
 * - Use for INSERT, UPDATE, DELETE (not SELECT)
 */

// ============================================
// Connection is ready to use throughout the application
// ============================================
// You can now use the $pdo object in your application
// Include this file in other PHP files with: require_once 'db.php';
// Then you'll have access to the $pdo connection object
?>
