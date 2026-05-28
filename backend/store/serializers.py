from rest_framework import serializers
from .models import Product, Category, Cart, CartItem, Order, OrderItem, EmailVerificationToken
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    class Meta:
        model = CartItem
        fields = '__all__'
    
class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()
    class Meta:
        model = Cart
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data
    
    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data.get('email', '')
        password = validated_data['password']
        
        # Create user as inactive
        user = User.objects.create_user(username=username, email=email, password=password)
        user.is_active = False
        user.save()
        
        # Create email verification token with 6-digit random OTP
        import random
        otp_code = "".join(random.choices("0123456789", k=6))
        # Ensure uniqueness
        while EmailVerificationToken.objects.filter(token=otp_code).exists():
            otp_code = "".join(random.choices("0123456789", k=6))
            
        token_obj = EmailVerificationToken.objects.create(user=user, token=otp_code)
        
        # Send verification email
        if email:
            # Determine backend host dynamically from request context to support local IP addresses and domain
            request = self.context.get('request')
            if request:
                backend_base = request.build_absolute_uri('/')
                confirm_link = f"{backend_base.rstrip('/')}/api/verify-email/{token_obj.token}/"
                cancel_link = f"{backend_base.rstrip('/')}/api/cancel-registration/{token_obj.token}/"
            else:
                confirm_link = f"http://localhost:8000/api/verify-email/{token_obj.token}/"
                cancel_link = f"http://localhost:8000/api/cancel-registration/{token_obj.token}/"
                
            subject = f"Your KART Verification Code: {otp_code}"
            message = (
                f"Hi {user.username},\n\n"
                f"Thank you for signing up on KART! Your 6-digit Verification Code (OTP) is:\n\n"
                f"{otp_code}\n\n"
                f"Please enter this code on the registration page to verify your account.\n\n"
                f"Alternatively, you can click on one of the links below to proceed:\n"
                f"Confirm Account: {confirm_link}\n"
                f"Cancel Signup: {cancel_link}\n\n"
                f"If you did not request this registration, please ignore or cancel.\n\n"
                f"Best regards,\n"
                f"KART Team"
            )
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify your KART Registration</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <!-- Card Container -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0;">
                      
                      <!-- Brand Accent Bar -->
                      <tr>
                        <td style="background-color: #3b82f6; height: 6px;"></td>
                      </tr>
                      
                      <!-- Header -->
                      <tr>
                        <td align="center" style="padding: 32px 32px 20px 32px;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size: 28px; font-weight: 800; color: #3b82f6; letter-spacing: -0.5px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                                KART
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Content Body -->
                      <tr>
                        <td style="padding: 0 32px 32px 32px; text-align: center;">
                          <h2 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 12px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                            Verify Your Account
                          </h2>
                          <p style="font-size: 15px; line-height: 1.6; color: #64748b; margin-top: 0; margin-bottom: 24px; text-align: left;">
                            Hi <strong>{user.username}</strong>,<br><br>
                            Thank you for signing up on KART! Please use the following 6-digit Verification Code (OTP) on the registration screen to confirm your email:
                          </p>
                          
                          <!-- OTP Box -->
                          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e293b; background-color: #f1f5f9; padding: 16px; border-radius: 12px; margin: 24px 0; text-align: center; font-family: monospace; border: 1px dashed #cbd5e1;">
                            {otp_code}
                          </div>
                          
                          <p style="font-size: 14px; color: #64748b; margin-bottom: 28px; text-align: left;">
                            Or, if you prefer, you can also proceed by clicking one of the buttons below:
                          </p>
                          
                          <!-- Action Buttons Table -->
                          <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 28px auto; width: 100%;">
                            <tr>
                              <!-- Confirm Button -->
                              <td align="center" style="width: 50%; padding-right: 8px;">
                                <table border="0" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td align="center" style="border-radius: 8px; background-color: #10b981; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
                                      <a href="{confirm_link}" target="_blank" style="display: inline-block; padding: 12px 20px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; white-space: nowrap;">
                                        Confirm Account
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              
                              <!-- Cancel Button -->
                              <td align="center" style="width: 50%; padding-left: 8px;">
                                <table border="0" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td align="center" style="border-radius: 8px; background-color: #ef4444; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.25);">
                                      <a href="{cancel_link}" target="_blank" style="display: inline-block; padding: 12px 20px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; white-space: nowrap;">
                                        Cancel Signup
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Divider -->
                          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 24px;">
                          
                          <!-- Secondary info -->
                          <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0; text-align: left;">
                            If you did not request this registration, please click "Cancel Signup" to remove your registration details.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer info -->
                      <tr>
                        <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #f1f5f9;">
                          <p style="font-size: 12px; font-weight: 500; color: #64748b; margin: 0;">
                            Best regards,<br>
                            <strong>KART Team</strong>
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                    html_message=html_message,
                )
            except Exception as e:
                print(f"Error sending email: {e}")
                
        return user

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = '__all__'