<?php
// Admin Login API
header('Content-Type: application/json');
session_start();

require_once '../../database/db.php';

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

// Validation
if (empty($email) || empty($password)) {
    echo json_encode(["status" => "error", "message" => "Email and password required"]);
    exit;
}

try {
    // Query admin from database
    $stmt = $pdo->prepare("SELECT id, email, password, role FROM admins WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($password, $admin['password'])) {
        // Set session
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_email'] = $admin['email'];
        $_SESSION['admin_role'] = $admin['role'];
        
        echo json_encode([
            "status" => "success",
            "admin" => [
                "id" => $admin['id'],
                "email" => $admin['email'],
                "role" => $admin['role']
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Login failed"]);
}
?>
