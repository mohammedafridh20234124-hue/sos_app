<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

$email = $_POST['email'] ?? '';

// Validate email
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Invalid email address"]);
    exit;
}

// Generate OTP (6-digit code)
$otp = rand(100000, 999999);

// Save OTP temporarily with expiration (30 minutes)
$otpData = [
    'otp' => $otp,
    'created_at' => time(),
    'expires_at' => time() + 1800  // 30 minutes expiration
];
file_put_contents("otp_data/$email.json", json_encode($otpData));

// PHPMailer Configuration
$mail = new PHPMailer(true);

try {
    // SMTP Configuration
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'your-email@gmail.com';  // Replace with your Gmail
    $mail->Password = 'your-app-password';      // Replace with Gmail App Password
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    // Sender
    $mail->setFrom('your-email@gmail.com', 'Campus Security Assistant');
    $mail->addAddress($email);

    // Email Content
    $mail->isHTML(true);
    $mail->Subject = "Your Verification Code - Campus Security";
    $mail->Body = "
        <html>
            <body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
                <div style='max-width: 600px; background-color: white; padding: 30px; border-radius: 8px; margin: 0 auto;'>
                    <h2 style='color: #2c3e50; text-align: center;'>Email Verification</h2>
                    
                    <p style='color: #555; font-size: 16px; line-height: 1.6;'>
                        Hello,<br><br>
                        Your verification code is:
                    </p>
                    
                    <div style='background-color: #3498db; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                        <h1 style='margin: 0; font-size: 48px; letter-spacing: 5px;'>$otp</h1>
                    </div>
                    
                    <p style='color: #555; font-size: 16px; line-height: 1.6;'>
                        This code expires in <strong>30 minutes</strong>.<br>
                        Do not share this code with anyone.
                    </p>
                    
                    <p style='color: #999; font-size: 12px; margin-top: 30px; text-align: center;'>
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
            </body>
        </html>
    ";
    $mail->AltBody = "Your verification code is: $otp\n\nThis code expires in 30 minutes.";

    // Send Email
    $mail->send();
    echo json_encode([
        "status" => "success",
        "message" => "Verification code sent successfully",
        "email" => $email
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to send verification code: " . $mail->ErrorInfo
    ]);
}
?>
