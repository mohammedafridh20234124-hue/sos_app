<?php
header('Content-Type: application/json');

$email = $_POST['email'] ?? '';
$otp = $_POST['otp'] ?? '';

// Validate inputs
if (empty($email) || empty($otp)) {
    echo json_encode(["status" => "error", "message" => "Email and OTP are required"]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Invalid email address"]);
    exit;
}

// Check if OTP data file exists
$otpFilePath = "otp_data/$email.json";

if (!file_exists($otpFilePath)) {
    echo json_encode(["status" => "error", "message" => "No OTP found for this email"]);
    exit;
}

// Load OTP data
$otpData = json_decode(file_get_contents($otpFilePath), true);

if (!$otpData) {
    echo json_encode(["status" => "error", "message" => "Invalid OTP data"]);
    exit;
}

// Check if OTP has expired
$currentTime = time();
if ($currentTime > $otpData['expires_at']) {
    // Delete expired OTP
    unlink($otpFilePath);
    echo json_encode(["status" => "error", "message" => "OTP has expired. Please request a new one."]);
    exit;
}

// Verify OTP
if ($otpData['otp'] == $otp) {
    // Delete OTP file after successful verification
    unlink($otpFilePath);
    
    // Mark email as verified in database or session
    session_start();
    $_SESSION['verified_email'] = $email;
    $_SESSION['verified_at'] = time();
    
    echo json_encode([
        "status" => "success",
        "message" => "Email verified successfully",
        "email" => $email,
        "verified_at" => date('Y-m-d H:i:s')
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid OTP. Please try again.",
        "attempts_remaining" => "3"  // Optional: Add attempt tracking
    ]);
}
?>
