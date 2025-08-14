# Postman Guide for Offers API

This guide explains how to use the Postman collection to test the Offers API endpoints. It includes step-by-step instructions for setting up the environment, authenticating, and testing all API endpoints.

## Table of Contents
1. [Importing the Collection](#importing-the-collection)
2. [Setting Up Environment Variables](#setting-up-environment-variables)
3. [Authentication Flow](#authentication-flow)
4. [Testing Offers Endpoints](#testing-offers-endpoints)
5. [Testing Account Endpoints](#testing-account-endpoints)
6. [Testing Activation Endpoints](#testing-activation-endpoints)
7. [Example Workflows](#example-workflows)

## Importing the Collection

1. Open Postman
2. Click on the "Import" button in the top left corner
3. Select the "Upload Files" tab
4. Browse and select the `Offers API.postman_collection.json` file
5. Click "Import"
6. The collection will appear in your sidebar under "Collections"

## Setting Up Environment Variables

1. In Postman, click the "Environment" quick look icon (eye icon) in the top right
2. Click "Add" to create a new environment
3. Name your environment (e.g., "Offers API Dev")
4. Add the following variables:
   - `base_url`: `http://localhost:8000` (or your deployed URL)
   - `username`: Your test username
   - `password`: Your test password
5. Click "Add" to save the environment
6. Select your environment from the dropdown in the top right

## Authentication Flow

### 1. Login

1. In the collection, find the "Authentication" folder
2. Open the "Login" request
3. In the request body, update the username and password:
   ```json
   {
     "username": "{{username}}",
     "password": "{{password}}"
   }
   ```
4. Click "Send"
5. Copy the `access` token from the response

### 2. Set Authentication Token

1. In the top right of Postman, click the "Environment" quick look icon
2. Add a new variable:
   - Key: `access_token`
   - Value: Paste the access token you copied (without the quotes)
3. Click "Update"

### 3. Using the Token

All authenticated requests in the collection are already configured to use the `{{access_token}}` variable in the Authorization header:
```
Authorization: Bearer {{access_token}}
```

### 4. Profile Access

1. Find the "Get Profile" request in the Authentication folder
2. Click "Send" to retrieve your profile information

### 5. Logout

1. Find the "Logout" request in the Authentication folder
2. Click "Send" to logout (this will blacklist the refresh token)

## Testing Offers Endpoints

### List All Offers

1. Navigate to the "Offers" folder
2. Open the "List Offers" request
3. Click "Send" to retrieve all available offers

### Get Offer Details

1. In the "Offers" folder, open the "Get Offer Detail" request
2. Update the `offer_id` parameter in the URL path
3. Click "Send" to retrieve details for a specific offer

### Get Expiring Offers

1. In the "Offers" folder, open the "Get Expiring Offers" request
2. Click "Send" to retrieve your expiring offers

### Renew an Offer

1. In the "Offers" folder, open the "Renew Offer" request
2. In the request body, specify the offer ID to renew:
   ```json
   {
     "offer_id": 1
   }
   ```
3. Click "Send" to initiate the renewal process

## Testing Account Endpoints

### Get Account Balance

1. Navigate to the "Account" folder
2. Open the "Get Balance" request
3. Click "Send" to retrieve your account balance

### Get Subscriptions

1. In the "Account" folder, open the "Get Subscriptions" request
2. Click "Send" to retrieve your active subscriptions

### List Transactions

1. In the "Account" folder, open the "List Transactions" request
2. Click "Send" to retrieve your transaction history

### Get Transaction Status

1. In the "Account" folder, open the "Get Transaction Status" request
2. Update the `transaction_id` parameter in the URL path
3. Click "Send" to retrieve the status of a specific transaction

## Testing Activation Endpoints

### Activate an Offer

1. Navigate to the "Activation" folder
2. Open the "Activate Offer" request
3. In the request body, specify the offer ID to activate:
   ```json
   {
     "offer_id": 1
   }
   ```
4. Click "Send" to initiate the activation process
5. Note the `transaction_id` from the response

### Check Activation Status

1. In the "Activation" folder, open the "Get Activation Status" request
2. Update the `transaction_id` parameter in the URL path with the ID from the activation response
3. Click "Send" to check the activation status

## Example Workflows

### Complete User Journey

1. **Login** - Authenticate with the API
2. **List Offers** - Browse available offers
3. **Get Offer Detail** - View details of an interesting offer
4. **Activate Offer** - Activate the selected offer
5. **Check Activation Status** - Verify the activation was successful
6. **Get Balance** - Check account balance after activation
7. **Get Subscriptions** - View active subscriptions
8. **List Transactions** - Review transaction history
9. **Logout** - End the session

### Renewing an Expiring Offer

1. **Login** - Authenticate with the API
2. **Get Expiring Offers** - Check for any offers about to expire
3. **Renew Offer** - Renew a selected expiring offer
4. **Check Activation Status** - Verify the renewal was successful
5. **Get Subscriptions** - Confirm the renewed subscription
6. **Logout** - End the session

### Checking Transaction Status

1. **Login** - Authenticate with the API
2. **List Transactions** - Get a list of recent transactions
3. **Get Transaction Status** - Check the status of a specific transaction
4. **Get Activation Status** - If it's an activation transaction, check activation status
5. **Logout** - End the session

## Tips for Using the Collection

1. **Token Management**: Always ensure your `access_token` environment variable is up to date
2. **Request Order**: For workflows, follow the requests in the specified order as later requests often depend on data from earlier ones
3. **Response Data**: Pay attention to response data, especially IDs that you'll need for subsequent requests
4. **Status Codes**: Check HTTP status codes to understand if requests were successful
5. **Error Handling**: If you get errors, check that:
   - Your environment variables are set correctly
   - Your access token is valid and not expired
   - You're using the correct IDs in URL paths and request bodies

## Common Issues and Solutions

### 401 Unauthorized
- Solution: Re-authenticate using the Login endpoint and update your `access_token` variable

### 404 Not Found
- Solution: Check that the IDs you're using in URL paths exist in the database

### 400 Bad Request
- Solution: Verify that your request body matches the expected format

### Connection Refused
- Solution: Ensure the Docker containers are running and the `base_url` is correct

## Advanced Features

### Running Collection Tests

Postman collection includes tests for each request. To run them:

1. Click the "Runner" button in the top left
2. Select the "Offers API" collection
3. Select your environment
4. Click "Run Offers API" to execute all requests with their tests

### Monitoring Requests

You can monitor the behavior of requests:

1. Open any request
2. Click the "Save Responses" tab
3. Select "Save to History" to track responses over time

This documentation should help you effectively use the Postman collection to test all aspects of the Offers API.