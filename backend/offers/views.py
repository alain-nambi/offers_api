from django.shortcuts import render
from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Offer, UserOffer
from .serializers import OfferSerializer, UserOfferSerializer
from account.models import Account, Transaction
from activation.tasks import process_activation
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging
import uuid

logger = logging.getLogger(__name__)


class OfferPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'limit'
    max_page_size = 100


@swagger_auto_schema(
    method='get',
    operation_description="Retrieve a paginated list of all available offers with sorting and filtering support",
    operation_summary="List Available Offers",
    manual_parameters=[
        openapi.Parameter('page', openapi.IN_QUERY, description="Page number", type=openapi.TYPE_INTEGER),
        openapi.Parameter('limit', openapi.IN_QUERY, description="Number of results per page (max 100)", type=openapi.TYPE_INTEGER),
        openapi.Parameter('search', openapi.IN_QUERY, description="Search by offer name or description", type=openapi.TYPE_STRING),
        openapi.Parameter('sort', openapi.IN_QUERY, description="Sort by field (prefix with - for descending)", type=openapi.TYPE_STRING),
        openapi.Parameter('status', openapi.IN_QUERY, description="Filter by status (active/inactive)", type=openapi.TYPE_STRING),
    ],
    responses={
        200: openapi.Response(
            description="List of offers retrieved successfully",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'data': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'id': openapi.Schema(type=openapi.TYPE_INTEGER, description='Offer ID'),
                                'name': openapi.Schema(type=openapi.TYPE_STRING, description='Offer name'),
                                'description': openapi.Schema(type=openapi.TYPE_STRING, description='Offer description'),
                                'price': openapi.Schema(type=openapi.TYPE_NUMBER, description='Offer price'),
                                'duration_days': openapi.Schema(type=openapi.TYPE_INTEGER, description='Duration in days'),
                                'is_active': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Whether offer is active'),
                                'created_at': openapi.Schema(type=openapi.TYPE_STRING, description='Creation timestamp'),
                            }
                        )
                    ),
                    'total': openapi.Schema(type=openapi.TYPE_INTEGER, description='Total number of offers'),
                    'page': openapi.Schema(type=openapi.TYPE_INTEGER, description='Current page number'),
                    'limit': openapi.Schema(type=openapi.TYPE_INTEGER, description='Number of items per page'),
                }
            )
        ),
        401: openapi.Response(description="Authentication required"),
    },
    tags=['Offers']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_offers(request):
    """
    List all available offers with pagination, sorting, and filtering support.
    """
    # Get query parameters
    search = request.GET.get('search', '')
    sort = request.GET.get('sort', 'name')
    status_filter = request.GET.get('status', '')
    
    # Start with all offers
    offers = Offer.objects.all()
    
    # Apply search filter
    if search:
        offers = offers.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )
    
    # Apply status filter
    if status_filter and status_filter.lower() != 'all':
        if status_filter.lower() == 'active':
            offers = offers.filter(is_active=True)
        elif status_filter.lower() == 'inactive':
            offers = offers.filter(is_active=False)
    
    # Apply sorting
    if sort:
        # Handle descending sort (prefixed with -)
        if sort.startswith('-'):
            offers = offers.order_by(sort)
        else:
            offers = offers.order_by(sort)
    else:
        # Default sort by name
        offers = offers.order_by('name')
    
    # Paginate results
    paginator = OfferPagination()
    paginated_offers = paginator.paginate_queryset(offers, request)
    serializer = OfferSerializer(paginated_offers, many=True)
    
    # Return response in the new format
    return Response({
        'data': serializer.data,
        'total': paginator.page.paginator.count,
        'page': paginator.page.number,
        'limit': paginator.get_page_size(request)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def offer_detail(request, offer_id):
    """
    Get details of a specific offer.
    """
    try:
        offer = Offer.objects.get(pk=offer_id)
        serializer = OfferSerializer(offer)
        return Response(serializer.data)
    except Offer.DoesNotExist:
        return Response(
            {'error': 'Offer not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@swagger_auto_schema(
    method='post',
    operation_description="Activate an offer for the authenticated user. This will deduct the offer price from the user's account balance and start the activation process asynchronously.",
    operation_summary="Activate Offer",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['offer_id'],
        properties={
            'offer_id': openapi.Schema(type=openapi.TYPE_INTEGER, description='ID of the offer to activate'),
        },
    ),
    responses={
        202: openapi.Response(
            description="Offer activation started successfully",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_STRING, description='Success message'),
                    'transaction_id': openapi.Schema(type=openapi.TYPE_STRING, description='Transaction ID for tracking'),
                }
            )
        ),
        400: openapi.Response(description="Bad request - missing offer_id or insufficient balance"),
        404: openapi.Response(description="Offer or account not found"),
        401: openapi.Response(description="Authentication required"),
    },
    tags=['Offers']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_offer(request):
    """
    Activate an offer for the authenticated user.
    """
    user = request.user
    offer_id = request.data.get('offer_id')
    
    if not offer_id:
        return Response(
            {'error': 'offer_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response(
            {'error': 'Offer not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check user's account balance
    try:
        account = Account.objects.get(user=user)
        if account.balance < offer.price:
            return Response(
                {'error': 'Insufficient balance'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Account.DoesNotExist:
        return Response(
            {'error': 'Account not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Deduct amount from user's account
    account.balance -= offer.price
    account.save()
    
    # Create transaction record
    transaction = Transaction.objects.create(
        user=user,
        offer=offer,
        amount=offer.price,
        transaction_id=str(uuid.uuid4()),
        status='PENDING'
    )
    
    # Create user offer record
    user_offer = UserOffer.objects.create(
        user=user,
        offer=offer,
        transaction_id=transaction,  # Use the transaction_id directly from transaction object
        is_active=False,  # Will be activated by Celery task
        expiration_date=timezone.now() + timezone.timedelta(days=offer.duration_days)
    )
    
    # Process activation asynchronously
    process_activation.delay(transaction.transaction_id)
    
    return Response({
        'message': 'Offer activation in progress',
        'transaction_id': transaction.transaction_id
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expiring_offers(request):
    """
    Get offers that are about to expire for the authenticated user.
    """
    threshold_date = timezone.now() + timezone.timedelta(days=3)
    expiring_offers = UserOffer.objects.filter(
        user=request.user,
        is_active=True,
        expiration_date__lte=threshold_date
    ).select_related('offer')
    
    serializer = UserOfferSerializer(expiring_offers, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renew_offer(request):
    """
    Renew an existing offer for the authenticated user.
    """
    user = request.user
    offer_id = request.data.get('offer_id')
    
    if not offer_id:
        return Response(
            {'error': 'offer_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response(
            {'error': 'Offer not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check user's account balance
    try:
        account = Account.objects.get(user=user)
        if account.balance < offer.price:
            return Response(
                {'error': 'Insufficient balance'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Account.DoesNotExist:
        return Response(
            {'error': 'Account not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Deduct amount from user's account
    account.balance -= offer.price
    account.save()
    
    # Create transaction record
    transaction = Transaction.objects.create(
        user=user,
        offer=offer,
        amount=offer.price,
        transaction_id=str(uuid.uuid4()),
        status='PENDING'
    )
    
    # Update or create user offer record
    user_offer, created = UserOffer.objects.update_or_create(
        user=user,
        offer=offer,
        defaults={
            'transaction_id': transaction.transaction_id,
            'is_active': False,
            'expiration_date': timezone.now() + timezone.timedelta(days=offer.duration_days)
        }
    )
    
    # Process activation asynchronously
    process_activation.delay(transaction.transaction_id)
    
    return Response({
        'message': 'Offer renewal in progress',
        'transaction_id': transaction.transaction_id
    }, status=status.HTTP_202_ACCEPTED)