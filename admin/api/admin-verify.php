<?php
// Verify Admin Session
header('Content-Type: application/json');
session_start();

if (isset($_SESSION['admin_id'])) {
    echo json_encode([
        "status" => "success",
        "admin" => [
            "id" => $_SESSION['admin_id'],
            "email" => $_SESSION['admin_email'],
            "role" => $_SESSION['admin_role']
        ]
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Not authenticated"]);
}
?>
