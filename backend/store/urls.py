from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
  path('register/', views.register_view),
  path('verify-email/<str:token>/', views.verify_email, name='verify_email'),
  path('check-verification-status/<str:username>/', views.check_verification_status, name='check_verification_status'),
  path('cancel-registration/<str:token>/', views.cancel_registration, name='cancel_registration'),
  path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
  path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
  path('products/', views.get_products),
  path('products/<int:pk>/', views.get_product),
  path('categories/', views.get_categories),
  path('cart/', views.get_cart),
  path('cart/add/', views.add_to_cart),
  path('cart/remove/', views.remove_from_cart),
  path('cart/update/', views.update_cart_quantity),
  path('orders/create/', views.create_order),
  path('orders/verify-payment/', views.verify_payment),
  path('orders/', views.get_orders),
  path('orders/<int:pk>/cancel/', views.cancel_order),
]