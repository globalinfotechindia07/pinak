package com.superapp.common.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
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

    private void attachLogoIfAvailable(MimeMessageHelper helper) {
        try {
            ClassPathResource logo = new ClassPathResource("pinak-logo.png");
            if (logo.exists()) {
                helper.addInline("pinakLogo", logo, "image/png");
            }
        } catch (Exception e) {
            log.debug("Could not attach inline logo: {}", e.getMessage());
        }
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

            helper.setFrom(fromEmail, "PINAK Platform");
            helper.setTo(toEmail);
            helper.setSubject("You've been invited to join PINAK Console");

            String html = buildInvitationHtml(recipientName, roleName, inviteUrl);
            helper.setText(html, true);
            attachLogoIfAvailable(helper);

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

            helper.setFrom(fromEmail, "PINAK Platform");
            helper.setTo(toEmail);
            helper.setSubject("PINAK Security — Password Reset Code");

            String html = buildOtpHtml("Password Reset Verification",
                    "We received a request to reset your password. Use the verification code below to proceed:",
                    otp, "15 minutes");
            helper.setText(html, true);
            attachLogoIfAvailable(helper);

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

            helper.setFrom(fromEmail, "PINAK Platform");
            helper.setTo(toEmail);
            helper.setSubject("PINAK — Verify Your Email Address");

            String html = buildOtpHtml("Verify Your Email Address",
                    "Welcome to PINAK! Please enter the code below to confirm your email address:",
                    otp, "15 minutes");
            helper.setText(html, true);
            attachLogoIfAvailable(helper);

            mailSender.send(message);
            log.info("📧 [GMAIL-SMTP SUCCESS] Email verification OTP delivered to {}", toEmail);
        } catch (Exception e) {
            log.error("❌ [GMAIL-SMTP ERROR] Failed to send email verification OTP to {}: {}. OTP fallback: {}",
                    toEmail, e.getMessage(), otp);
        }
    }

    /**
     * Sends a welcome email to an onboarded commercial merchant owner with a secure password setup link.
     */
    @Async
    public void sendMerchantWelcomeEmail(String toEmail, String recipientName, String businessName, String inviteUrl) {
        if (!isSmtpConfigured()) {
            log.info("📧 [MOCK-SMTP / GMAIL UNCONFIGURED] Merchant Welcome to {} ({}) for brand [{}] -> Invite URL: {}",
                    recipientName, toEmail, businessName, inviteUrl);
            return;
        }

        log.info("📧 [GMAIL-SMTP] Dispatching merchant welcome email to {} from {} via Gmail SMTP...", toEmail, fromEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "PINAK Partner Platform");
            helper.setTo(toEmail);
            helper.setSubject("Welcome to PINAK — Merchant Account Provisioned for " + businessName);

            String html = buildMerchantWelcomeHtml(recipientName, businessName, toEmail, inviteUrl);
            helper.setText(html, true);
            attachLogoIfAvailable(helper);

            mailSender.send(message);
            log.info("✅ [GMAIL-SMTP SUCCESS] Merchant welcome email successfully delivered to {} for brand [{}]", toEmail, businessName);
        } catch (Exception e) {
            log.error("❌ [GMAIL-SMTP ERROR] Failed to send merchant welcome email to {}: {}. Cause: {}",
                    toEmail, e.getMessage(), e.getCause() != null ? e.getCause().getMessage() : "none", e);
        }
    }

    private String buildInvitationHtml(String recipientName, String roleName, String inviteUrl) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>You've been invited to PINAK</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
              <table width="100%%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px 60px 16px;">
                <tr>
                  <td align="center">
                    <!-- Main Card Container -->
                    <table width="100%%" border="0" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
                      
                      <!-- Top Gradient Accent Bar (Exact Brand Primary Gradient) -->
                      <tr>
                        <td style="height: 3px; background-color: #d0087a; background: linear-gradient(90deg, #ff9e00 0%%, #e00570 52%%, #6817c8 100%%);"></td>
                      </tr>

                      <!-- Header with Exact Sidebar Brand Logo Lockup -->
                      <tr>
                        <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align: middle; width: 40px;">
                                <!-- Exact PINAK .brand-mark squircle from sidebar -->
                                <img src="cid:pinakLogo" width="40" height="40" alt="PINAK" style="display: block; width: 40px; height: 40px; border-radius: 10px 4px 10px 4px; border: 0; outline: none;" />
                              </td>
                              <td style="padding-left: 12px; vertical-align: middle;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 19px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; line-height: 1;">
                                  PINAK
                                </div>
                                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 0.2px; margin-top: 3px;">
                                  Rewards Super-App
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Body Content -->
                      <tr>
                        <td style="padding: 28px 32px;">
                          <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">
                            Join the PINAK team
                          </h1>
                          
                          <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 24px; color: #1e293b;">
                            Hi %s,
                          </p>

                          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #475569;">
                            You have been invited to join the <strong>PINAK Operations Console</strong> as <strong>%s</strong>. Click the button below to accept your invitation and set up your account password:
                          </p>

                          <!-- Role Summary Card -->
                          <table width="100%%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px;">
                            <tr>
                              <td style="padding: 14px 18px;">
                                <table width="100%%" border="0" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                                      Role
                                    </td>
                                    <td align="right" style="font-size: 11px; color: #64748b;">
                                      Expires in 48 hours
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colspan="2" style="font-size: 15px; font-weight: 700; color: #0f172a; padding-top: 4px;">
                                      %s
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <!-- Call to Action Button -->
                          <table width="100%%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                            <tr>
                              <td align="center">
                                <table border="0" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td align="center" style="border-radius: 8px; background-color: #d0087a; background: linear-gradient(135deg, #ff9e00 0%%, #e00570 52%%, #6817c8 100%%); box-shadow: 0 4px 14px rgba(208, 8, 122, 0.28);">
                                      <a href="%s" target="_blank" style="display: inline-block; padding: 13px 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.2px;">
                                        Accept Invitation &amp; Set Password &rarr;
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <!-- Direct Link Fallback -->
                          <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; margin-top: 24px;">
                            <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                              Button not working? Paste this link into your browser:
                            </p>
                            <div style="background-color: #f1f5f9; border-radius: 6px; padding: 10px 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #334155; word-break: break-all; line-height: 1.5;">
                              %s
                            </div>
                          </div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="padding: 20px 32px; background-color: #fafbfc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 18px;">
                          <p style="margin: 0 0 6px 0;">
                            If you weren't expecting this invitation, you can safely ignore this email.
                          </p>
                          <p style="margin: 0; color: #94a3b8;">
                            &copy; 2026 PINAK &bull; All rights reserved.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(recipientName, roleName, roleName, inviteUrl, inviteUrl);
    }

    private String buildOtpHtml(String title, String explanation, String otp, String expiry) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
              <table width="100%%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px 60px 16px;">
                <tr>
                  <td align="center">
                    <table width="100%%" border="0" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
                      
                      <!-- Top Gradient Accent Bar -->
                      <tr>
                        <td style="height: 3px; background-color: #d0087a; background: linear-gradient(90deg, #ff9e00 0%%, #e00570 52%%, #6817c8 100%%);"></td>
                      </tr>

                      <!-- Header with Logo -->
                      <tr>
                        <td style="padding: 24px 28px 18px 28px; border-bottom: 1px solid #f1f5f9;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align: middle; width: 36px;">
                                <img src="cid:pinakLogo" width="34" height="34" alt="PINAK" style="display: block; width: 34px; height: 34px; border-radius: 10px 4px 10px 4px; border: 0; outline: none;" />
                              </td>
                              <td style="padding-left: 12px; vertical-align: middle;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 17px; font-weight: 800; color: #0f172a; line-height: 1;">
                                  PINAK
                                </div>
                                <div style="font-size: 10px; font-weight: 600; color: #94a3b8; margin-top: 2px;">
                                  Security Verification
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Content -->
                      <tr>
                        <td style="padding: 28px 32px; text-align: center;">
                          <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
                            %s
                          </h2>
                          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #475569;">
                            %s
                          </p>
                          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #7017c8; background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; padding: 16px 24px; margin: 18px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; display: inline-block;">
                            %s
                          </div>
                          <p style="margin: 0; font-size: 12px; color: #64748b;">
                            This code expires in <strong>%s</strong>. Never share this code with anyone.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="padding: 16px 28px; background-color: #fafbfc; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
                          &copy; 2026 PINAK &bull; pinak.app
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(title, title, explanation, otp, expiry);
    }

    private String buildMerchantWelcomeHtml(String recipientName, String businessName, String email, String inviteUrl) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to PINAK Partner Network</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
              <table width="100%%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px 60px 16px;">
                <tr>
                  <td align="center">
                    <!-- Main Card Container -->
                    <table width="100%%" border="0" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
                      
                      <!-- Top Gradient Accent Bar -->
                      <tr>
                        <td style="height: 3px; background-color: #d0087a; background: linear-gradient(90deg, #ff9e00 0%%, #e00570 52%%, #6817c8 100%%);"></td>
                      </tr>

                      <!-- Header with PINAK Brand Logo -->
                      <tr>
                        <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align: middle; width: 40px;">
                                <img src="cid:pinakLogo" width="40" height="40" alt="PINAK" style="display: block; width: 40px; height: 40px; border-radius: 10px 4px 10px 4px; border: 0; outline: none;" />
                              </td>
                              <td style="padding-left: 12px; vertical-align: middle;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 19px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; line-height: 1;">
                                  PINAK
                                </div>
                                <div style="font-size: 11px; font-weight: 600; color: #94a3b8; letter-spacing: 0.2px; margin-top: 3px;">
                                  Commercial Partner Network
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Body Content -->
                      <tr>
                        <td style="padding: 28px 32px;">
                          <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">
                            Welcome to PINAK Partner Network
                          </h1>
                          
                          <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 24px; color: #1e293b;">
                            Hi %s,
                          </p>

                          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 22px; color: #475569;">
                            Your commercial merchant account for <strong>%s</strong> has been successfully provisioned on PINAK. Complete your merchant account onboarding and set up your master security password to access your partner console.
                          </p>

                          <!-- Credentials Card -->
                          <table width="100%%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px;">
                            <tr>
                              <td style="padding: 16px 20px;">
                                <table width="100%%" border="0" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="font-size: 12px; color: #64748b; padding-bottom: 6px;">Login Email:</td>
                                    <td align="right" style="font-size: 13px; font-weight: 600; color: #0f172a; padding-bottom: 6px; font-family: monospace;">%s</td>
                                  </tr>
                                  <tr>
                                    <td style="font-size: 12px; color: #64748b; padding-bottom: 6px;">Assigned Role:</td>
                                    <td align="right" style="font-size: 12px; font-weight: 700; color: #7017c8; padding-bottom: 6px;">Commercial Merchant Owner</td>
                                  </tr>
                                  <tr>
                                    <td style="font-size: 12px; color: #64748b; padding-bottom: 6px;">Access Scope:</td>
                                    <td align="right" style="font-size: 12px; font-weight: 700; color: #16a34a; padding-bottom: 6px;">Brand &amp; Outlets Master Console</td>
                                  </tr>
                                  <tr>
                                    <td style="font-size: 12px; color: #64748b;">Link Validity:</td>
                                    <td align="right" style="font-size: 12px; font-weight: 600; color: #e11d48;">48 Hours (Single-Use)</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <!-- Call to Action Button -->
                          <table width="100%%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                            <tr>
                              <td align="center">
                                <table border="0" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td align="center" style="border-radius: 8px; background-color: #d0087a; background: linear-gradient(135deg, #ff9e00 0%%, #e00570 52%%, #6817c8 100%%); box-shadow: 0 4px 14px rgba(208, 8, 122, 0.28);">
                                      <a href="%s" target="_blank" style="display: inline-block; padding: 13px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.2px;">
                                        Set Password &amp; Activate Merchant Console &rarr;
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>

                          <div style="margin: 20px 0; padding: 12px 14px; background-color: #f1f5f9; border-radius: 8px; font-size: 11px; color: #475569; word-break: break-all;">
                            <strong>Direct Setup Link:</strong><br/>
                            <a href="%s" target="_blank" style="color: #c026d3; text-decoration: underline;">%s</a>
                          </div>

                          <p style="margin: 0; font-size: 12px; line-height: 18px; color: #64748b; background-color: #eff6ff; border: 1px solid #dbeafe; padding: 10px 14px; border-radius: 8px;">
                            <strong>Security Notice:</strong> This single-use setup link will expire in 48 hours. After choosing your master password, you will be redirected to sign in to your merchant operations console.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="padding: 20px 32px; background-color: #fafbfc; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
                          &copy; 2026 PINAK Platform Governance &bull; Commercial Partner Operations
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(recipientName, businessName, email, inviteUrl, inviteUrl, inviteUrl);
    }
}
