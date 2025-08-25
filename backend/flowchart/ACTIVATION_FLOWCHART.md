# Offer Activation Process Flowchart

This document provides a visual representation of the offer activation process in the Offers API system, showing how different components interact at each step.

## Complete Activation Flow

```mermaid
flowchart TD
    A[User] --> B[Authentication]
    B --> C[Offer Selection]
    C --> D[Activation Request]
    D --> E[Balance Check]
    E --> F{Sufficient Balance?}
    F -->|No| G[Return Error]
    F -->|Yes| H[Deduct Amount]
    H --> I[Create Transaction]
    I --> J[Create User Offer]
    J --> K[Queue Celery Task]
    K --> L[Return Transaction ID]
    L --> M[User]
    K --> N[Celery Worker]
    N --> O[Create Partner Transaction]
    O --> P[Update Transaction Status]
    P --> Q[Update User Offer]
    Q --> R[Send Notification]
    R --> S[End Process]
    
    style A fill:#ffe4c4,stroke:#333
    style M fill:#ffe4c4,stroke:#333
    style G fill:#ff7f7f,stroke:#333
    style S fill:#98fb98,stroke:#333
```

## Step-by-Step Process Details

### Step 1: User Authentication
```mermaid
sequenceDiagram
    participant U as User
    participant API as Auth API
    participant DB as Database
    participant R as Redis
    
    U->>API: POST /api/v1/auth/login/
    API->>DB: Validate credentials
    DB-->>API: User data
    API->>R: Cache token with user info
    R-->>API: Confirmation
    API->>U: {access_token, refresh_token}
```

### Step 2: Offer Selection
```mermaid
sequenceDiagram
    participant U as Authenticated User
    participant API as Offers API
    participant DB as Database
    
    U->>API: GET /api/v1/offers/
    API->>DB: Retrieve active offers
    DB-->>API: List of offers
    API->>U: Offer list
    
    U->>API: GET /api/v1/offers/{id}/
    API->>DB: Retrieve specific offer
    DB-->>API: Offer details
    API->>U: Offer details
```

### Step 3: Activation Request Processing
```mermaid
sequenceDiagram
    participant U as User
    participant ActAPI as Activation API
    participant DB as Database
    participant R as Redis
    participant C as Celery
    
    U->>ActAPI: POST /api/v1/activation/
    ActAPI->>DB: Check user balance
    DB-->>ActAPI: Account balance
    ActAPI->>ActAPI: Validate balance
    ActAPI->>DB: Deduct amount
    DB-->>ActAPI: Updated balance
    ActAPI->>DB: Create transaction
    DB-->>ActAPI: Transaction record
    ActAPI->>DB: Create user offer
    DB-->>ActAPI: User offer record
    ActAPI->>R: Store transaction data
    R-->>ActAPI: Confirmation
    ActAPI->>C: Queue process_activation
    C-->>ActAPI: Task ID
    ActAPI->>U: {transaction_id, status: PENDING}
```

### Step 4: Background Processing by Celery
```mermaid
sequenceDiagram
    participant C as Celery Worker
    participant PT as PartnerTransaction Model
    participant T as Transaction Model
    participant UO as UserOffer Model
    participant DB as Database
    participant R as Redis
    participant N as Notification Service
    
    C->>PT: Create partner transaction
    PT->>DB: Save transaction
    DB-->>PT: Confirmation
    PT-->>C: Success
    
    C->>T: Update status to SUCCESS
    T->>DB: Save updated status
    DB-->>T: Confirmation
    T-->>C: Success
    
    C->>UO: Activate user offer
    UO->>DB: Update offer status
    DB-->>UO: Confirmation
    UO-->>C: Success
    
    C->>R: Update Redis data
    R-->>C: Confirmation
    
    C->>N: Send success notification
    N->>U: Email/SMS notification
    U-->>N: Receipt confirmation
    N-->>C: Delivery confirmation
```

### Final: Status Checking
```mermaid
sequenceDiagram
    participant U as User
    participant ActAPI as Activation API
    participant R as Redis
    participant DB as Database
    
    U->>ActAPI: GET /api/v1/activation/status/{id}/
    ActAPI->>R: Check transaction status
    R-->>ActAPI: Transaction data
    ActAPI->>U: Status response
    
    alt If not in Redis
        ActAPI->>DB: Query database
        DB-->>ActAPI: Transaction data
        ActAPI->>R: Cache in Redis
        R-->>ActAPI: Confirmation
        ActAPI->>U: Status response
    end
```

## Component Interaction Overview

```mermaid
graph TD
    A[Frontend/Web Client] --> B[REST API]
    B --> C[Authentication Layer]
    B --> D[Offers Management]
    B --> E[Account Management]
    B --> F[Activation System]
    F --> G[Celery Task Queue]
    G --> H[Background Workers]
    H --> I[Database Operations]
    H --> J[Notification System]
    H --> K[Partner Integration]
    F --> L[Redis Cache]
    C --> M[(PostgreSQL Database)]
    D --> M
    E --> M
    L --> N[(Redis Server)]
    I --> M
    
    style A fill:#ffe4c4
    style B fill:#87ceeb
    style C fill:#ffa07a
    style D fill:#ffa07a
    style E fill:#ffa07a
    style F fill:#98fb98
    style G fill:#ffd700
    style H fill:#ff6347
    style M fill:#90ee90
    style N fill:#90ee90
```

## Error Handling Flow

```mermaid
flowchart TD
    A[Activation Request] --> B[Process Activation]
    B --> C{Partner System Success?}
    C -->|Yes| D[Update Success Status]
    C -->|No| E[Update Failed Status]
    E --> F[Refund User]
    F --> G[Send Failure Notification]
    D --> H[Send Success Notification]
    H --> I[End]
    G --> I
    
    style A fill:#87ceeb
    style D fill:#98fb98
    style E fill:#ff7f7f
    style I fill:#ffa07a
```

## Data Flow Summary

1. **User Authentication**:
   - User provides credentials
   - System validates against database
   - JWT tokens generated and cached in Redis

2. **Offer Browsing**:
   - User requests list of available offers
   - System retrieves from database
   - Returns filtered list to user

3. **Activation Request**:
   - User selects offer to activate
   - System checks account balance
   - If sufficient, deducts amount
   - Creates transaction and user offer records
   - Stores data in Redis
   - Queues Celery task for background processing
   - Returns transaction ID to user

4. **Background Processing**:
   - Celery worker processes activation task
   - Creates partner transaction record
   - Updates transaction status to SUCCESS
   - Activates user offer
   - Updates Redis cache
   - Sends notification to user

5. **Status Checking**:
   - User requests activation status
   - System first checks Redis cache
   - Falls back to database if not in cache
   - Returns current status to user

This flow ensures a smooth, secure, and scalable activation process with proper error handling and user feedback at every step.