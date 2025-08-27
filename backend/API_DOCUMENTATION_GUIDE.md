# API Documentation Guide

## Overview

Your Offers API now includes comprehensive Swagger/OpenAPI documentation that provides interactive API exploration and testing capabilities.

## Accessing the Documentation

### Swagger UI (Interactive Documentation)
- **URL**: `http://localhost:8000/swagger/`
- **Features**: 
  - Interactive API testing
  - Request/response examples
  - Authentication testing
  - Parameter validation

### ReDoc (Alternative Documentation View)
- **URL**: `http://localhost:8000/redoc/`
- **Features**:
  - Clean, readable documentation
  - Better for documentation reading
  - Responsive design

### OpenAPI Schema Files
- **JSON Format**: `http://localhost:8000/swagger.json`
- **YAML Format**: `http://localhost:8000/swagger.yaml`
- **Use Cases**: Import into Postman, generate client SDKs

## Authentication in Swagger

### Step 1: Login
1. Navigate to `/swagger/`
2. Find the "Authentication" section
3. Click on `POST /api/v1/auth/login/`
4. Click "Try it out"
5. Enter your credentials:
   ```json
   {
     "username": "your_username",
     "password": "your_password"
   }
   ```
6. Click "Execute"
7. Copy the `access` token from the response

### Step 2: Authorize
1. Click the "Authorize" button at the top of the Swagger UI
2. In the "Bearer" field, enter: `Bearer your_access_token`
3. Click "Authorize"
4. Click "Close"

Now you can test all authenticated endpoints!

## API Endpoints Documentation

### Authentication Endpoints (`/api/v1/auth/`)
- `POST /login/` - User login
- `GET /profile/` - Get user profile
- `POST /logout/` - User logout

### Offers Endpoints (`/api/v1/offers/`)
- `GET /` - List all offers (paginated)
- `GET /{id}/` - Get offer details
- `POST /activate/` - Activate an offer
- `GET /expiring/` - Get expiring offers
- `POST /renew/` - Renew an offer

### Account Endpoints (`/api/v1/account/`)
- `GET /balance/` - Get account balance
- `GET /subscriptions/` - Get user subscriptions
- `GET /transactions/` - List transactions
- `GET /transactions/{id}/` - Get transaction details

### Activation Endpoints (`/api/v1/activation/`)
- `POST /` - Activate an offer
- `GET /status/{id}/` - Check activation status

### Partner Endpoints (`/api/v1/partner/`)
- `POST /activate/` - Partner activation request
- `GET /validate/{reference}/` - Validate transaction

## Features of the Documentation

### 1. Interactive Testing
- Test API endpoints directly from the browser
- Real request/response examples
- Parameter validation
- Error handling examples

### 2. Authentication Support
- JWT Bearer token authentication
- Automatic token inclusion in requests
- Login/logout flow documentation

### 3. Comprehensive Schemas
- Request body schemas
- Response schemas
- Error response documentation
- Parameter descriptions

### 4. Organized by Tags
- Endpoints grouped by functionality
- Easy navigation
- Clear categorization

## Testing Your Documentation

Run the test script to verify all documentation endpoints are working:

```bash
cd backend
python test_swagger.py
```

## Customization

### Adding Documentation to New Endpoints

When creating new API endpoints, add Swagger documentation using the `@swagger_auto_schema` decorator:

```python
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

@swagger_auto_schema(
    method='post',
    operation_description="Description of what this endpoint does",
    operation_summary="Short summary",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['field1'],
        properties={
            'field1': openapi.Schema(type=openapi.TYPE_STRING, description='Field description'),
        },
    ),
    responses={
        200: openapi.Response(description="Success response"),
        400: openapi.Response(description="Bad request"),
    },
    tags=['YourTag']
)
@api_view(['POST'])
def your_endpoint(request):
    # Your endpoint logic
    pass
```

### Updating API Information

Edit the schema configuration in `backend/config/urls.py`:

```python
schema_view = get_schema_view(
   openapi.Info(
      title="Your API Title",
      default_version='v1',
      description="Your API description",
      # ... other settings
   ),
   # ... other configuration
)
```

## Best Practices

1. **Always document new endpoints** with proper Swagger decorators
2. **Include examples** in your request/response schemas
3. **Use descriptive operation summaries** and descriptions
4. **Group related endpoints** using tags
5. **Document error responses** with appropriate status codes
6. **Keep documentation up to date** when changing API behavior

## Troubleshooting

### Common Issues

1. **Documentation not loading**
   - Check if `drf-yasg` is in `INSTALLED_APPS`
   - Verify URL patterns are correct
   - Check for syntax errors in decorators

2. **Authentication not working**
   - Ensure JWT token is valid
   - Check token format: `Bearer <token>`
   - Verify token hasn't expired

3. **Endpoints not showing**
   - Check if views have proper decorators
   - Verify URL patterns are included
   - Check for import errors

### Getting Help

If you encounter issues:
1. Check the Django logs for errors
2. Verify your environment setup
3. Test endpoints with curl or Postman first
4. Check the drf-yasg documentation: https://drf-yasg.readthedocs.io/

## Production Considerations

### Security
- In production, consider restricting documentation access
- Use environment variables for sensitive information
- Implement proper CORS settings

### Performance
- Enable caching for documentation endpoints
- Consider serving static documentation files
- Use CDN for better performance

### Maintenance
- Keep documentation in sync with code changes
- Regular testing of documentation endpoints
- Monitor documentation usage and feedback