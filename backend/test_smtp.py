import os
import django
from django.core.mail import send_mail

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings

print(f"Using EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"Using EMAIL_HOST_PASSWORD (first/last chars): {settings.EMAIL_HOST_PASSWORD[0]}...{settings.EMAIL_HOST_PASSWORD[-1] if settings.EMAIL_HOST_PASSWORD else ''}")

try:
    send_mail(
        "KART SMTP Test",
        "This is a test email from the KART backend diagnostic script.",
        settings.DEFAULT_FROM_EMAIL,
        [settings.EMAIL_HOST_USER],
        fail_silently=False,
    )
    print("SUCCESS: Email sent successfully!")
except Exception as e:
    print(f"FAILED: SMTP test failed with error: {e}")
