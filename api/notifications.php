<?php
// ============================================
// Notifications API Endpoint
// ============================================
// This file provides a REST API endpoint to fetch notifications from MySQL
// Access: http://localhost/api/notifications.php

// Enable CORS (Cross-Origin Resource Sharing)
// This allows requests from different domains/ports
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
// Browsers send OPTIONS requests before actual requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Return 200 OK for preflight
    http_response_code(200);
    exit();
}

// Include the database connection file
// This provides the $pdo object for database queries
require_once '../db.php';

try {
    // Determine which action to perform based on GET parameters
    // Example: ?action=all, ?action=broadcast, ?action=by_user&user_id=123
    $action = $_GET['action'] ?? 'all';
    
    // Initialize response array
    $response = [
        'success' => false,
        'message' => '',
        'data' => [],
        'count' => 0
    ];
    
    // ============================================
    // Action: Get ALL notifications
    // ============================================
    if ($action === 'all') {
        // Query to get all notifications, sorted by newest first
        $sql = "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100";
        
        // Execute the query
        $result = $pdo->query($sql);
        
        // Fetch all results
        $rows = $result->fetchAll();
        
        // Set response data
        $response['success'] = true;
        $response['message'] = 'All notifications fetched successfully';
        $response['data'] = $rows;
        $response['count'] = count($rows);
    }
    
    // ============================================
    // Action: Get BROADCAST notifications only
    // ============================================
    elseif ($action === 'broadcast') {
        // Query to get only broadcast type notifications
        // Broadcasts are messages sent to all students
        $sql = "SELECT * FROM notifications WHERE type = 'broadcast' ORDER BY created_at DESC LIMIT 100";
        
        // Execute the query
        $result = $pdo->query($sql);
        
        // Fetch all results
        $rows = $result->fetchAll();
        
        // Set response data
        $response['success'] = true;
        $response['message'] = 'Broadcast notifications fetched successfully';
        $response['data'] = $rows;
        $response['count'] = count($rows);
    }
    
    // ============================================
    // Action: Get notifications FOR A SPECIFIC USER
    // ============================================
    elseif ($action === 'by_user') {
        // Get the user_id parameter from the query string
        // Example: ?action=by_user&user_id=550e8400-e29b-41d4-a716-446655440000
        $user_id = $_GET['user_id'] ?? null;
        
        // Validate that user_id was provided
        if (!$user_id) {
            // user_id is required for this action
            $response['success'] = false;
            $response['message'] = 'user_id parameter is required for by_user action';
            http_response_code(400); // Bad Request
        } else {
            // Query to get notifications for a specific user
            // Use prepared statement to prevent SQL injection
            $sql = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50";
            
            // Prepare the statement
            $stmt = $pdo->prepare($sql);
            
            // Execute with the user_id parameter
            $stmt->execute([$user_id]);
            
            // Fetch all results
            $rows = $stmt->fetchAll();
            
            // Set response data
            $response['success'] = true;
            $response['message'] = "Notifications for user {$user_id} fetched successfully";
            $response['data'] = $rows;
            $response['count'] = count($rows);
        }
    }
    
    // ============================================
    // Action: Get notifications by TYPE
    // ============================================
    elseif ($action === 'by_type') {
        // Get the type parameter
        // Example: ?action=by_type&type=broadcast
        // Valid types: broadcast, alert, info, warning
        $type = $_GET['type'] ?? null;
        
        // Validate that type was provided
        if (!$type) {
            // type is required for this action
            $response['success'] = false;
            $response['message'] = 'type parameter is required for by_type action';
            http_response_code(400); // Bad Request
        } else {
            // Query to get notifications of a specific type
            $sql = "SELECT * FROM notifications WHERE type = ? ORDER BY created_at DESC LIMIT 100";
            
            // Prepare the statement
            $stmt = $pdo->prepare($sql);
            
            // Execute with the type parameter
            $stmt->execute([$type]);
            
            // Fetch all results
            $rows = $stmt->fetchAll();
            
            // Set response data
            $response['success'] = true;
            $response['message'] = "Notifications of type '{$type}' fetched successfully";
            $response['data'] = $rows;
            $response['count'] = count($rows);
        }
    }
    
    // ============================================
    // Action: Get UNREAD notifications
    // ============================================
    elseif ($action === 'unread') {
        // Get unread notifications (where read = false or read = 0)
        $sql = "SELECT * FROM notifications WHERE read = FALSE ORDER BY created_at DESC LIMIT 100";
        
        // Execute the query
        $result = $pdo->query($sql);
        
        // Fetch all results
        $rows = $result->fetchAll();
        
        // Set response data
        $response['success'] = true;
        $response['message'] = 'Unread notifications fetched successfully';
        $response['data'] = $rows;
        $response['count'] = count($rows);
    }
    
    // ============================================
    // Invalid action
    // ============================================
    else {
        // Unknown action was requested
        $response['success'] = false;
        $response['message'] = 'Invalid action. Available actions: all, broadcast, by_user, by_type, unread';
        http_response_code(400); // Bad Request
    }
    
} catch (Exception $e) {
    // Catch any database or PHP errors
    
    // Set error response
    $response['success'] = false;
    $response['message'] = 'Database error: ' . $e->getMessage();
    
    // Set HTTP status code to 500 (Internal Server Error)
    http_response_code(500);
}

// ============================================
// Return JSON response
// ============================================
// Convert the response array to JSON and send it to the client
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
