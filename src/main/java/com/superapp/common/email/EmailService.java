package com.superapp.common.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for delivering transactional emails via SMTP (including Gmail SMTP).
 * Supports automatic fallback to mock/log mode when credentials are not configured or in development.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final boolean mockMode;
    private final String fromEmail;
    private final String mailUsername;
    private final String mailPassword;

    @Autowired
    public EmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${app.mail.mock:false}") boolean mockMode,
            @Value("${app.mail.from:noreply@pinak.app}") String fromEmail,
            @Value("${spring.mail.username:}") String mailUsername,
            @Value("${spring.mail.password:}") String mailPassword
    ) {
        this.mailSender = mailSender;
        this.mockMode = mockMode;
        this.fromEmail = fromEmail;
        this.mailUsername = mailUsername;
        this.mailPassword = mailPassword;
    }

    /**
     * Checks if real SMTP sending is available and configured.
     */
    public boolean isSmtpConfigured() {
        return !mockMode && mailSender != null
                && mailUsername != null && !mailUsername.isBlank()
                && mailPassword != null && !mailPassword.isBlank();
    }

    /**
     * Sends a professional HTML invitation email with one-time onboarding link.
     */
    @Async
    public void sendStaffInvitationEmail(String toEmail, String recipientName, String roleName, String inviteUrl) {
        if (!isSmtpConfigured()) {
            log.info("📧 [MOCK-SMTP / GMAIL UNCONFIGURED] Invitation to {} ({}) for role [{}] -> Onboarding URL: {}",
                    recipientName, toEmail, roleName, inviteUrl);
            return;
        }

        log.info("📧 [GMAIL-SMTP] Dispatching invitation email to {} from {} via Gmail SMTP...", toEmail, fromEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("You've been invited to join PINAK Console");

            String html = buildInvitationHtml(recipientName, roleName, inviteUrl);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("✅ [GMAIL-SMTP SUCCESS] Staff invitation email successfully delivered to {} for role [{}]", toEmail, roleName);
        } catch (Exception e) {
            log.error("❌ [GMAIL-SMTP ERROR] Failed to send invitation email to {}: {}. Cause: {}",
                    toEmail, e.getMessage(), e.getCause() != null ? e.getCause().getMessage() : "none", e);
            log.info("🔗 [INVITATION ONBOARDING LINK FALLBACK]: {}", inviteUrl);
        }
    }

    /**
     * Sends password reset OTP.
     */
    @Async
    public void sendPasswordResetOtp(String toEmail, String otp) {
        if (!isSmtpConfigured()) {
            log.info("🔐 [MOCK-SMTP / GMAIL UNCONFIGURED] Password Reset OTP for {}: {}", toEmail, otp);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("PINAK Security — Password Reset Code");

            String html = buildOtpHtml("Password Reset Verification",
                    "We received a request to reset your password. Use the verification code below to proceed:",
                    otp, "15 minutes");
            helper.setText(html, true);

            mailSender.send(message);
            log.info("🔐 [GMAIL-SMTP SUCCESS] Password reset OTP email delivered to {}", toEmail);
        } catch (Exception e) {
            log.error("❌ [GMAIL-SMTP ERROR] Failed to send password reset OTP to {}: {}. OTP fallback: {}",
                    toEmail, e.getMessage(), otp);
        }
    }

    /**
     * Sends email verification OTP.
     */
    @Async
    public void sendEmailVerificationOtp(String toEmail, String otp) {
        if (!isSmtpConfigured()) {
            log.info("📧 [MOCK-SMTP / GMAIL UNCONFIGURED] Email Verification OTP for {}: {}", toEmail, otp);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("PINAK — Verify Your Email Address");

            String html = buildOtpHtml("Verify Your Email Address",
                    "Welcome to PINAK! Please enter the code below to confirm your email address:",
                    otp, "15 minutes");
            helper.setText(html, true);

            mailSender.send(message);
            log.info("📧 [GMAIL-SMTP SUCCESS] Email verification OTP delivered to {}", toEmail);
        } catch (Exception e) {
            log.error("❌ [GMAIL-SMTP ERROR] Failed to send email verification OTP to {}: {}. OTP fallback: {}",
                    toEmail, e.getMessage(), otp);
        }
    }

    private String buildInvitationHtml(String recipientName, String roleName, String inviteUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .header { background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 32px 28px; text-align: center; }
                .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
                .content { padding: 32px 28px; }
                .greeting { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
                .role-badge { display: inline-block; background-color: #ede9fe; color: #6d28d9; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px; margin-top: 4px; }
                .btn-wrapper { text-align: center; margin: 32px 0; }
                .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
                .link-box { background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 11px; word-break: break-all; color: #475569; font-family: monospace; }
                .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>PINAK Platform Console</h1>
                </div>
                <div class="content">
                  <p class="greeting">Hello %s,</p>
                  <p>You have been invited to join the <strong>PINAK Operations & Management Console</strong> as:</p>
                  <div>
                    <span class="role-badge">%s</span>
                  </div>
                  <p style="margin-top: 20px; font-size: 14px; line-height: 1.5; color: #475569;">
                    To activate your account and configure your secure login password, click the button below. This link is valid for <strong>48 hours</strong> and can only be used once.
                  </p>
                  <div class="btn-wrapper">
                    <a href="%s" class="btn" target="_blank">Accept Invitation &amp; Set Password</a>
                  </div>
                  <p style="font-size: 12px; color: #64748b;">Or paste this direct link into your browser:</p>
                  <div class="link-box">%s</div>
                </div>
                <div class="footer">
                  This is an automated security transmission from PINAK. If you were not expecting this invitation, you can safely ignore this email.
                </div>
              </div>
            </body>
            </html>
            """.formatted(recipientName, roleName, inviteUrl, inviteUrl);
    }

    private String buildOtpHtml(String title, String explanation, String otp, String expiry) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .header { background: #7c3aed; padding: 24px; text-align: center; color: #ffffff; font-size: 18px; font-weight: 800; }
                .content { padding: 28px; text-align: center; }
                .otp-box { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #6d28d9; background: #f5f3ff; border: 1px dashed #c4b5fd; border-radius: 12px; padding: 16px; margin: 24px 0; font-family: monospace; }
                .footer { padding: 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">%s</div>
                <div class="content">
                  <p style="font-size: 14px; color: #475569;">%s</p>
                  <div class="otp-box">%s</div>
                  <p style="font-size: 12px; color: #94a3b8;">This code is valid for %s. Do not share it with anyone.</p>
                </div>
                <div class="footer">PINAK Security Notification</div>
              </div>
            </body>
            </html>
            """.formatted(title, explanation, otp, expiry);
    }
}
