import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def build_feedback_email_html(
    recipient_name: str,
    feedback_type: str,
    service_or_webinar_name: str,
    feedback_url: str
) -> str:
    """Build branded HTML email for feedback request"""
    type_label = "service" if feedback_type == "service" else "webinar"
    action_label = "using our service" if feedback_type == "service" else "attending our webinar"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f5f6f8;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background:#1a1a2e;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#00C9A7;letter-spacing:-0.5px;">
            Cyber<span style="color:#fff;">Nova</span>
          </h1>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);">Cybersecurity Solutions</p>
        </div>

        <!-- Body -->
        <div style="padding:40px;">
          <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Thank You, {recipient_name}!</h2>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Thank you for {action_label}: <strong>{service_or_webinar_name}</strong>.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            We value your feedback and would love to hear about your experience.
            Please take a moment to complete this short satisfaction survey — it only takes 2 minutes.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0;">
            <a href="{feedback_url}" style="display:inline-block;background:#00C9A7;color:#050A0E;padding:14px 40px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">
              Rate Your Experience →
            </a>
          </div>

          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 24px;font-size:12px;color:#9ca3af;word-break:break-all;">
            {feedback_url}
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            This link expires in 7 days. Your feedback is confidential and helps us improve our services.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            © 2025 CyberNova Analytics Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
    """


def send_feedback_email(
    to_email: str,
    recipient_name: str,
    feedback_type: str,
    service_or_webinar_name: str,
    feedback_url: str
) -> bool:
    """
    Send a feedback request email.
    
    Uses SMTP settings from environment variables.
    Falls back to logging if SMTP is not configured.
    """
    subject = f"CyberNova — We'd love your feedback on {service_or_webinar_name}"
    html_body = build_feedback_email_html(
        recipient_name=recipient_name,
        feedback_type=feedback_type,
        service_or_webinar_name=service_or_webinar_name,
        feedback_url=feedback_url
    )

    # Check if SMTP is configured
    smtp_host = getattr(settings, 'SMTP_HOST', None)
    smtp_port = getattr(settings, 'SMTP_PORT', None)
    smtp_user = getattr(settings, 'SMTP_USER', None)
    smtp_pass = getattr(settings, 'SMTP_PASS', None)
    smtp_from = getattr(settings, 'SMTP_FROM', smtp_user)

    if not all([smtp_host, smtp_port, smtp_user, smtp_pass]):
        # SMTP not configured — log the email instead
        logger.info(
            f"[EMAIL NOT SENT - SMTP not configured] "
            f"To: {to_email}, Subject: {subject}, "
            f"Feedback URL: {feedback_url}"
        )
        print(f"\n{'='*60}")
        print(f"📧 FEEDBACK EMAIL (SMTP not configured — logged only)")
        print(f"   To: {to_email}")
        print(f"   Name: {recipient_name}")
        print(f"   Type: {feedback_type}")
        print(f"   Service/Webinar: {service_or_webinar_name}")
        print(f"   Feedback URL: {feedback_url}")
        print(f"{'='*60}\n")
        return True  # Return True so flow continues

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_from
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        logger.info(f"Feedback email sent to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send feedback email to {to_email}: {e}")
        return False
