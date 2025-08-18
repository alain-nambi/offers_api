# System Flowcharts for Offers API

This document provides comprehensive flowcharts illustrating all possible scenarios in the Offers API system, including the standard user flows and the newly added partner module flows.

## Table of Contents
1. [Complete System Architecture](#complete-system-architecture)
2. [User Authentication Flow](#user-authentication-flow)
3. [Offer Management Flow](#offer-management-flow)
4. [Account Management Flow](#account-management-flow)
5. [Standard Activation Flow](#standard-activation-flow)
6. [Partner Activation Flow](#partner-activation-flow)
7. [Transaction Status Checking Flow](#transaction-status-checking-flow)
8. [Expiring Offers Notification Flow](#expiring-offers-notification-flow)

## Complete System Architecture

```mermaid
graph TD
    A[Client Applications] --> B[Web API Layer]
    B --> C[PostgreSQL Database]
    B --> D[Redis Cache & Broker]
    B --> E[Celery Workers]
    E --> D
    E --> F[External Systems]
    E --> C
    G[Monitoring Systems] --> H[Prometheus]
    H --> B
    I[Partner Systems] --> B
    
    subgraph Legend
        J[User Components]
        K[Core System Components]
        L[External Integrations]
    end
    
    style A fill:#ffe4c4,stroke:#333
    style B fill:#98fb98,stroke:#333
    style C fill:#98fb98,stroke:#333
    style D fill:#98fb98,stroke:#333
    style E fill:#98fb98,stroke:#333
    style F fill:#ffe4c4,stroke:#333
    style G fill:#ffe4c4,stroke:#333
    style H fill:#98fb98,stroke:#333
    style I fill:#ffe4c4,stroke:#333
```

## User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Auth API
    participant DB as Database
    
    U->>API: POST /api/v1/auth/login/
    API->>DB: Validate credentials
    DB-->>API: User data / Error
    alt Valid Credentials
        API->>U: {access_token, refresh_token}
    else Invalid Credentials
        API->>U: 401 Unauthorized
    end
    
    U->>API: GET /api/v1/auth/profile/ (with token)
    API->>DB: Get user profile
    DB-->>API: User profile
    API->>U: Profile data
    
    U->>API: POST /api/v1/auth/refresh/
    API->>API: Validate refresh token
    alt Valid Token
        API->>U: New {access_token, refresh_token}
    else Invalid Token
        API->>U: 401 Unauthorized
    end
    
    U->>API: POST /api/v1/auth/logout/
    API->>API: Invalidate refresh token
    API->>U: 200 OK
```

## Offer Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Offers API
    participant R as Redis Cache
    participant DB as Database
    
    U->>API: GET /api/v1/offers/ (with token)
    API->>R: Check cached offers
    alt Cache Miss
        R-->>API: Cache miss
        API->>DB: Get all offers
        DB-->>API: Offers data
        API->>R: Cache offers
    else Cache Hit
        R-->>API: Cached offers
    end
    API->>U: Offers list
    
    U->>API: GET /api/v1/offers/{offer_id}/
    API->>DB: Get specific offer
    DB-->>API: Offer details
    API->>U: Offer details
    
    U->>API: POST /api/v1/offers/renew/
    API->>DB: Validate user offer
    DB-->>API: User offer data
    alt Valid Offer
        API->>DB: Check balance
        DB-->>API: Balance info
        alt Sufficient Balance
            API->>DB: Deduct amount
            API->>DB: Create new transaction
            API->>R: Store transaction
            API->>E: Queue activation task
            API->>U: 200 OK
        else Insufficient Balance
            API->>U: 400 Error
        end
    else Invalid Offer
        API->>U: 404 Not Found
    end
```

## Account Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Account API
    participant DB as Database
    
    U->>API: GET /api/v1/account/balance/
    API->>DB: Get account balance
    DB-->>API: Balance data
    API->>U: Balance info
    
    U->>API: GET /api/v1/account/subscriptions/
    API->>DB: Get user subscriptions
    DB-->>API: Subscriptions data
    API->>U: Subscriptions list
    
    U->>API: GET /api/v1/account/transactions/
    API->>DB: Get user transactions
    DB-->>API: Transactions data
    API->>U: Transactions list
    
    U->>API: GET /api/v1/account/transactions/{id}/
    API->>DB: Get specific transaction
    DB-->>API: Transaction data
    API->>U: Transaction details
```

## Standard Activation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Activation API
    participant R as Redis
    participant E as Celery
    participant DB as Database
    participant Ext as External System
    
    U->>API: POST /api/v1/activation/ {offer_id}
    API->>DB: Check user balance
    DB-->>API: Balance info
    alt Insufficient Balance
        API->>U: 400 Error
    else Sufficient Balance
        API->>DB: Deduct amount from account
        API->>DB: Create transaction record
        DB-->>API: Transaction data
        API->>R: Store transaction (HSET)
        API->>E: Queue activation task
        API->>U: {transaction_id, status: PENDING}
        
        E->>DB: Get transaction
        DB-->>E: Transaction data
        E->>Ext: Activate offer (external API)
        alt Success
            Ext-->>E: Success response
            E->>DB: Update transaction (SUCCESS)
            E->>R: Update transaction (HSET)
            E->>DB: Activate user offer
        else Failure
            Ext-->>E: Failure response
            E->>DB: Update transaction (FAILED)
            E->>R: Update transaction (HSET)
            E->>DB: Refund amount to account
        end
    end
    
    U->>API: GET /api/v1/activation/status/{transaction_id}/
    API->>R: Get transaction (HGETALL)
    R-->>API: Transaction data
    API->>U: Transaction status
```

## Partner Activation Flow

```mermaid
sequenceDiagram
    participant P as Partner System
    participant API as Partner API
    participant R as Redis
    participant E as Celery
    participant DB as Database
    participant Ext as External System
    
    P->>API: POST /api/v1/partner/activate/ {user_id, offer_id, amount}
    API->>DB: Validate user and offer
    DB-->>API: User and offer data
    alt Valid User and Offer
        API->>DB: Create partner transaction
        DB-->>API: Transaction data
        API->>R: Store partner transaction (HSET)
        API->>P: {reference, transaction_id, status: PENDING}
        
        E->>DB: Get partner transaction
        DB-->>E: Transaction data
        E->>Ext: Activate offer (external API)
        alt Success
            Ext-->>E: Success response with reference
            E->>DB: Update transaction (SUCCESS)
            E->>R: Update transaction (HSET)
            E->>DB: Activate user offer
        else Failure
            Ext-->>E: Failure response
            E->>DB: Update transaction (FAILED)
            E->>R: Update transaction (HSET)
            E->>DB: Refund amount to account
        end
    else Invalid User or Offer
        API->>P: 400 Error
    end
    
    P->>API: GET /api/v1/partner/validate/{reference}/
    API->>DB: Find transaction by reference
    DB-->>API: Transaction data / Not found
    alt Transaction Found
        API->>P: {reference, transaction_id, user_id, offer_id, is_valid: true}
    else Transaction Not Found
        API->>P: {reference, is_valid: false, error: "Transaction not found"}
    end
```

## Transaction Status Checking Flow

```mermaid
flowchart TD
    A[User/Partner requests status] --> B[API receives request]
    B --> C{Valid transaction_id/reference?}
    C -->|No| D[Return 400 error]
    C -->|Yes| E[Check Redis for transaction]
    E --> F{Transaction in Redis?}
    F -->|Yes| G[Return Redis data]
    F -->|No| H[Query Database]
    H --> I{Transaction in DB?}
    I -->|No| J[Return 404 error]
    I -->|Yes| K[Cache in Redis]
    K --> G
    
    style A fill:#ffe4c4
    style D fill:#ff7f7f
    style G fill:#98fb98
    style J fill:#ff7f7f
```

## Expiring Offers Notification Flow

```mermaid
sequenceDiagram
    participant S as Celery Beat
    participant E as Celery Worker
    participant DB as Database
    participant N as Notification Service
    
    S->>E: Schedule check_expiring_offers
    E->>DB: Query expiring offers
    DB-->>E: List of expiring offers
    loop For each expiring offer
        E->>N: Send notification to user
        N->>N: Send email/SMS
    end
    E->>S: Task completed
    
    Note over S,N: Runs daily via Celery Beat
```

## Error Handling and Recovery Flows

### Activation Task Failure Recovery

```mermaid
flowchart TD
    A[Activation task fails] --> B{Retry attempts < max?}
    B -->|Yes| C[Schedule retry with backoff]
    B -->|No| D[Mark transaction as FAILED]
    D --> E[Update Redis and Database]
    E --> F[Refund user account]
    C --> G[Retry activation]
    G --> H{Activation successful?}
    H -->|Yes| I[Mark as SUCCESS]
    H -->|No| B
    
    style A fill:#ff7f7f
    style I fill:#98fb98
    style F fill:#ffa07a
```

### Database Connection Failure

```mermaid
flowchart TD
    A[Database connection fails] --> B{Critical operation?}
    B -->|Yes| C[Return 500 error to user]
    B -->|No| D[Use cached data if available]
    D --> E[Continue with limited functionality]
    C --> F[Alert system administrators]
    
    style A fill:#ff7f7f
    style C fill:#ff7f7f
    style D fill:#ffa07a
    style E fill:#ffa07a
    style F fill:#ff7f7f
```

## Data Flow Summary

### Transaction Data Flow

```mermaid
graph LR
    A[Transaction Created] --> B[Stored in Database]
    A --> C[Stored in Redis]
    D[Status Update] --> E[Update Database]
    D --> F[Update Redis]
    G[Status Query] --> H{Check Redis}
    H -->|Available| I[Return Redis Data]
    H -->|Not Available| J[Query Database]
    J --> K[Cache in Redis]
    K --> L[Return Data]
    
    style A fill:#98fb98
    style B fill:#87ceeb
    style C fill:#ffa07a
    style D fill:#98fb98
    style E fill:#87ceeb
    style F fill:#ffa07a
    style G fill:#ffe4c4
    style L fill:#98fb98
```

This comprehensive set of flowcharts illustrates all the major scenarios in the Offers API system, including both standard user flows and the new partner module flows. The diagrams show how data flows between components, how errors are handled, and how the system maintains consistency between the database and Redis cache.