from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer
from rest_framework import status
from .models import Product, Category, Cart, CartItem, Order, OrderItem, EmailVerificationToken
from .serializers import ProductSerializer, CategorySerializer, CartSerializer, CartItemSerializer, OrderSerializer
import razorpay
from django.conf import settings

@api_view(['GET'])
def get_products(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_product(request, pk):
    try:
        product = Product.objects.get(id=pk)
        serializer = ProductSerializer(product, context = {'request': request})
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    product = Product.objects.get(id=product_id)
    cart, created = Cart.objects.get_or_create(user=request.user)
    item, created = CartItem.objects.get_or_create(cart=cart, product=product)
    if not created:
        item.quantity += 1
        item.save()
    return Response({'message': 'Product added to cart',"cart":CartSerializer(cart).data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_cart_quantity(request):
    item_id = request.data.get('item_id')
    quantity = request.data.get('quantity')
   
    if not item_id or quantity is None:
        return Response({'error': 'Item ID and quantity are required'}, status=400)
    
    try:
        item = CartItem.objects.get(id=item_id)
        if int(quantity) < 1:
            item.delete()
            return Response({'error': 'Quantity must be at least 1'}, status=400)
        
        item.quantity = quantity
        item.save()
        serializer = CartItemSerializer(item)
        return Response(serializer.data)
    except CartItem.DoesNotExist:
        return Response({'error': 'Cart item not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request):
    item_id = request.data.get('item_id')
    CartItem.objects.filter(id=item_id).delete()
    return Response({'message': 'Item removed from cart'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    try:
        data = request.data
        name = data.get('name')
        address = data.get('address')
        phone = data.get('phone')
        payment_method = data.get('payment_method','COD')

        #validate Phone Number
        if not phone.isdigit() or len(phone) < 10:
            return Response({'error': 'Invalid phone number'}, status=400)
        
        # Get user's cart
        cart , created = Cart.objects.get_or_create(user=request.user)
        if not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=400)
        
        total = sum([item.product.price * item.quantity for item in cart.items.all()])

        order = Order.objects.create(
            user=request.user, 
            total_amount=total,
            payment_method=payment_method
        )

        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )
        # Clear the cart if Cash on Delivery (COD)
        if payment_method == 'COD':
            cart.items.all().delete()
        
        if payment_method == 'ONLINE':
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            # Razorpay expects amount in paise (multiply by 100)
            razorpay_order = client.order.create({
                'amount': int(total * 100),
                'currency': 'INR',
                'payment_capture': '1'
            })
            order.razorpay_order_id = razorpay_order['id']
            order.save()
            return Response({
                'message': 'Order created successfully', 
                'order_id': order.id,
                'razorpay_order_id': razorpay_order['id'],
                'amount': razorpay_order['amount'],
                'currency': razorpay_order['currency'],
                'key_id': settings.RAZORPAY_KEY_ID
            })

        return Response({'message': 'Order created successfully', 'order_id': order.id})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    try:
        data = request.data
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')

        order = Order.objects.get(razorpay_order_id=razorpay_order_id)

        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        # Verify the signature
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        client.utility.verify_payment_signature(params_dict)

        # Update order status
        order.payment_status = 'Paid'
        order.razorpay_payment_id = razorpay_payment_id
        order.razorpay_signature = razorpay_signature
        order.save()

        # Clear the cart since payment succeeded
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()

        return Response({'message': 'Payment verified successfully'})
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    except razorpay.errors.SignatureVerificationError:
        order.payment_status = 'Failed'
        order.save()
        return Response({'error': 'Payment verification failed'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
  
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            "message": "Registration successful!",
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orders(request):
    try:
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, pk):
    try:
        order = Order.objects.get(id=pk, user=request.user)
        if order.payment_status == 'Cancelled':
            return Response({'error': 'Order is already cancelled'}, status=400)
        
        order.payment_status = 'Cancelled'
        order.save()
        return Response({'message': 'Order cancelled successfully'})
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, token):
    from django.shortcuts import redirect
    try:
        vt = EmailVerificationToken.objects.get(token=token)
        user = vt.user
        user.is_active = True
        user.save()
        vt.delete()
        
        # Build frontend URL dynamically based on current backend host
        host = request.get_host()
        if '127.0.0.1' in host or 'localhost' in host:
            frontend_host = 'localhost:5173'
        elif ':8000' in host:
            frontend_host = host.replace(':8000', ':5173')
        else:
            frontend_host = 'localhost:5173'
        
        scheme = 'https' if request.is_secure() else 'http'
        frontend_url = f"{scheme}://{frontend_host}/login"
        return redirect(frontend_url)
    except EmailVerificationToken.DoesNotExist:
        host = request.get_host()
        if '127.0.0.1' in host or 'localhost' in host:
            frontend_host = 'localhost:5173'
        elif ':8000' in host:
            frontend_host = host.replace(':8000', ':5173')
        else:
            frontend_host = 'localhost:5173'
        
        scheme = 'https' if request.is_secure() else 'http'
        frontend_url = f"{scheme}://{frontend_host}/login"
        return redirect(frontend_url)

@api_view(['GET'])
@permission_classes([AllowAny])
def cancel_registration(request, token):
    from django.shortcuts import redirect
    try:
        vt = EmailVerificationToken.objects.get(token=token)
        user = vt.user
        # Deleting user cascades to automatically delete the token too
        user.delete()
        
        # Build frontend URL dynamically based on current backend host
        host = request.get_host()
        if '127.0.0.1' in host or 'localhost' in host:
            frontend_host = 'localhost:5173'
        elif ':8000' in host:
            frontend_host = host.replace(':8000', ':5173')
        else:
            frontend_host = 'localhost:5173'
        
        scheme = 'https' if request.is_secure() else 'http'
        frontend_url = f"{scheme}://{frontend_host}/signup"
        return redirect(frontend_url)
    except EmailVerificationToken.DoesNotExist:
        host = request.get_host()
        if '127.0.0.1' in host or 'localhost' in host:
            frontend_host = 'localhost:5173'
        elif ':8000' in host:
            frontend_host = host.replace(':8000', ':5173')
        else:
            frontend_host = 'localhost:5173'
        
        scheme = 'https' if request.is_secure() else 'http'
        frontend_url = f"{scheme}://{frontend_host}/signup"
        return redirect(f"{frontend_url}?error=invalid_token")

@api_view(['GET'])
@permission_classes([AllowAny])
def check_verification_status(request, username):
    try:
        user = User.objects.get(username=username)
        return Response({"is_active": user.is_active})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)