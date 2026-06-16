import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def send_email(
    subject: str,
    body_html: str,
    recipient_list: list[str],
    *,
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    use_tls: bool = True,
) -> bool:
    """Send an HTML email via SMTP. Returns True on success, False on failure."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_user
        msg["To"] = ", ".join(recipient_list)
        msg.attach(MIMEText(body_html, "html"))

        smtp_cls = smtplib.SMTP_SSL if not use_tls else smtplib.SMTP
        with smtp_cls(smtp_host, smtp_port) as server:
            if use_tls:
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, recipient_list, msg.as_string())

        return True
    except Exception as exc:
        logger.error(
            "Email send failed (subject=%r, to=%r): %s",
            subject,
            recipient_list,
            exc,
            exc_info=True,
        )
        return False
