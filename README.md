<div align="center">

# 🏦 YONO Bank — .NET Edition

### **You Only Need One — Secure Digital Banking with Angular, C#, and SQL Server**

[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://learn.microsoft.com/aspnet/core/)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-Banking__System-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server/)
[![SSMS](https://img.shields.io/badge/SSMS-SQL_Management-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://learn.microsoft.com/sql/ssms/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br />

A full-stack digital banking application built with an **Angular 22 frontend**, a **C# ASP.NET Core 10 Web API**, and a normalized **Microsoft SQL Server** database managed through **SQL Server Management Studio (SSMS)**.

The system includes secure authentication, OTP email verification, KYC workflows, customer accounts, transactional fund transfers, immutable double-entry ledger records, beneficiary OTP approval, savings goals, administration controls, and a transactional email outbox.

<br />

[Getting Started](#-getting-started) · [SSMS Setup](#-sql-server--ssms-setup) · [Architecture](#-architecture) · [Project Structure](#-project-structure) · [API Reference](#-api-reference)

---

</div>

<br />

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [SQL Server and SSMS Setup](#-sql-server--ssms-setup)
- [Backend Configuration](#-backend-configuration)
- [Running the Application](#-running-the-application)
- [API Reference](#-api-reference)
- [Database Design](#-database-design)
- [Security Model](#-security-model)
- [Email and OTP Delivery](#-email-and-otp-delivery)
- [Build and Tests](#-build-and-tests)
- [Contributing](#-contributing)
- [License](#-license)

<br />

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 🔒 Authentication & Security

- Registration with email OTP verification
- BCrypt password hashing with work factor 12
- JWT access tokens and rotating refresh sessions
- HttpOnly, SameSite Strict authentication cookies
- Five-attempt login lockout for 15 minutes
- SHA-256 hashed OTP and refresh-token values
- Role-based access for customer, admin, and system operations
- Rate limiting for authentication and OTP resend endpoints

</td>
<td width="50%" valign="top">

### 💰 Financial Integrity

- SQL Server transactional fund transfers
- Double-entry debit and credit ledger
- Idempotency keys prevent duplicate transfers
- Deterministic account locking
- Stored-procedure controlled posting
- Immutable financial history
- Administrator-controlled reversals
- Balance calculated from ledger entries

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📋 Banking Operations

- Savings and current account management
- Digital KYC submission and review
- KYC document upload through ImageKit
- OTP-verified beneficiary registration
- Savings goals and contribution history
- Transaction history and account balances
- Administrative user and account controls

</td>
<td width="50%" valign="top">

### 🖥️ Angular Experience

- Angular standalone components
- Responsive desktop and mobile dashboard
- Light and dark themes
- Lucide Angular icon system
- Tailwind CSS utility styling
- Reactive application state with Angular signals
- OTP, login, registration, KYC, beneficiary, and transfer interfaces
- Vitest component testing

</td>
</tr>
</table>

<br />

## 🏗 Architecture

> The solution uses a layered architecture. Angular communicates with the ASP.NET Core API through credentialed REST requests. Entity Framework Core maps the C# domain models to the normalized SQL Server schema.

~~~mermaid
graph TB
    subgraph CLIENT ["🖥️ Client Layer"]
        ANGULAR["<b>Angular 22 SPA</b><br/><i>Standalone Components · Signals</i>"]
        UI["<b>Responsive UI</b><br/><i>Tailwind CSS · Lucide Icons</i>"]
    end

    subgraph API ["⚙️ C# API Layer"]
        CONTROLLERS["<b>ASP.NET Core Controllers</b><br/><i>REST · Validation · Authorization</i>"]
        SERVICES["<b>Application Services</b><br/><i>Auth · Tokens · Dashboard · Email</i>"]
        MIDDLEWARE["<b>Middleware</b><br/><i>JWT · CORS · Rate Limits · Errors</i>"]
    end

    subgraph DATA ["🗄️ Data Layer"]
        EF["<b>Entity Framework Core 10</b><br/><i>SQL Server Provider</i>"]
        SQL[("<b>SQL Server</b><br/><i>Database: Banking_System</i>")]
        PROCS["<b>Stored Procedures</b><br/><i>Transfers · Balances · Reversals</i>"]
    end

    subgraph INFRA ["☁️ Integration Layer"]
        SMTP["<b>Gmail SMTP</b><br/><i>OTP · Welcome · Security Alerts</i>"]
        IMGKIT["<b>ImageKit</b><br/><i>KYC Documents</i>"]
        OUTBOX["<b>Transactional Outbox</b><br/><i>Reliable Email Dispatch</i>"]
    end

    ANGULAR --> UI
    UI -- "HTTP · JSON · HttpOnly Cookies" --> MIDDLEWARE
    MIDDLEWARE --> CONTROLLERS
    CONTROLLERS --> SERVICES
    SERVICES --> EF
    EF --> SQL
    SQL --> PROCS
    SERVICES --> OUTBOX
    OUTBOX --> SMTP
    SERVICES --> IMGKIT

    style CLIENT fill:#0f172a,stroke:#dd0031,stroke-width:2px,color:#e2e8f0
    style API fill:#161229,stroke:#8b5cf6,stroke-width:2px,color:#e2e8f0
    style DATA fill:#172033,stroke:#3b82f6,stroke-width:2px,color:#e2e8f0
    style INFRA fill:#14211e,stroke:#10b981,stroke-width:2px,color:#e2e8f0
~~~

### Request Lifecycle

~~~mermaid
sequenceDiagram
    autonumber
    participant U as 👤 User
    participant A as 🅰️ Angular
    participant C as ⚙️ ASP.NET Controller
    participant S as 💼 C# Service
    participant EF as 🔗 EF Core
    participant DB as 🗄️ SQL Server

    U->>A: Submit form or dashboard action
    A->>C: REST request with credentials
    C->>C: Validate model and authorize role

    alt Invalid or unauthorized
        C-->>A: 400 / 401 / 403 response
        A-->>U: Display safe error message
    end

    C->>S: Execute business workflow
    S->>EF: Query or transactional update
    EF->>DB: Parameterized SQL / stored procedure
    DB-->>EF: Result set
    EF-->>S: Mapped C# entities
    S-->>C: Application result
    C-->>A: JSON response
    A-->>U: Refresh responsive interface
~~~

<br />

## 🛠 Technology Stack

### Frontend — Angular

| Technology | Version | Purpose |
|:---|:---:|:---|
| **Angular** | <code>22.x</code> | Standalone component-based SPA |
| **Angular Router** | <code>22.x</code> | Client-side routing |
| **Angular Forms** | <code>22.x</code> | Registration, authentication, KYC, and banking forms |
| **Angular Signals** | Built in | Local reactive application state |
| **Tailwind CSS** | <code>4.1.x</code> | Responsive light and dark theme styling |
| **Lucide Angular** | <code>1.25.x</code> | Consistent SVG icon system |
| **RxJS** | <code>7.8.x</code> | API request streams |
| **TypeScript** | <code>6.0.x</code> | Strongly typed frontend development |
| **Vitest** | <code>4.x</code> | Component and unit testing |

### Backend — C# and ASP.NET Core

| Technology | Version | Purpose |
|:---|:---:|:---|
| **.NET** | <code>10.0</code> | Application runtime |
| **C# / ASP.NET Core Web API** | <code>10.0</code> | REST API, middleware, authentication, and authorization |
| **Entity Framework Core SQL Server** | <code>10.0.9</code> | SQL Server mapping and data access |
| **JWT Bearer Authentication** | <code>10.0.9</code> | Access-token validation |
| **BCrypt.Net-Next** | <code>4.0.3</code> | Secure password hashing |
| **FluentValidation** | <code>11.11.0</code> | Request validation |
| **MailKit** | <code>4.17.0</code> | SMTP and OAuth2 email delivery |
| **Swashbuckle** | <code>10.2.3</code> | Swagger/OpenAPI documentation |

### Database and Development Tools

| Tool | Purpose |
|:---|:---|
| **Microsoft SQL Server** | Relational database engine |
| **Database name** | <code>Banking_System</code> |
| **SQL Server Management Studio (SSMS)** | Create, inspect, query, and maintain the database |
| **T-SQL** | Schemas, constraints, stored procedures, roles, triggers, and integrity checks |
| **Git / GitHub** | Version control and source hosting |
| **Visual Studio / VS Code** | C#, Angular, and SQL development |

<br />

## 📁 Project Structure

~~~text
Banking_System_DotNet/
├── BankingSystem.Api/                       # C# ASP.NET Core 10 Web API
│   ├── Controllers/                         # REST endpoint controllers
│   │   ├── AccountController.cs             # Open accounts and retrieve balances
│   │   ├── AdminController.cs               # KYC, users, accounts, and reversals
│   │   ├── AuthController.cs                # Register, OTP, login, refresh, logout
│   │   ├── BeneficiaryController.cs         # Two-step beneficiary OTP workflow
│   │   ├── DashboardController.cs           # Dashboard summary
│   │   ├── GoalsController.cs               # Savings goals and contributions
│   │   ├── KycController.cs                 # KYC registration and review
│   │   ├── TransactionController.cs         # Transfers, funding, and history
│   │   └── UserController.cs                # Customer profile
│   │
│   ├── Data/
│   │   └── AppDbContext.cs                  # EF Core SQL Server mappings
│   │
│   ├── DTOs/                                # Request and response contracts
│   │   ├── Auth/
│   │   ├── Beneficiary/
│   │   ├── Goal/
│   │   ├── Kyc/
│   │   └── Transaction/
│   │
│   ├── Middleware/
│   │   ├── ApiException.cs
│   │   └── ExceptionHandlingMiddleware.cs   # Safe global API errors
│   │
│   ├── Models/
│   │   ├── Audit/                           # Administrator audit events
│   │   ├── Auth/                            # Users, roles, sessions, OTP challenges
│   │   ├── Banking/                         # Accounts, transfers, ledger, beneficiaries
│   │   ├── Compliance/                      # KYC applications, addresses, documents
│   │   ├── Integration/                     # Transactional outbox
│   │   └── Savings/                         # Goals and contribution history
│   │
│   ├── Options/                             # Strongly typed application settings
│   ├── Services/
│   │   ├── AuthService.cs                   # Registration and login workflows
│   │   ├── DashboardService.cs              # Dashboard aggregation
│   │   ├── EmailMessageFactory.cs           # OTP, welcome, and alert templates
│   │   ├── OutboxEmailDispatcher.cs         # Reliable background email processing
│   │   ├── SmtpEmailSender.cs               # MailKit SMTP transport
│   │   ├── ImageKitService.cs               # KYC document upload
│   │   └── TokenService.cs                  # JWT, refresh token, and hashing logic
│   │
│   ├── Validation/                          # FluentValidation request validators
│   ├── Properties/
│   │   └── launchSettings.json              # HTTP 5065 / HTTPS 7039
│   ├── Program.cs                            # Dependency injection and API pipeline
│   ├── appsettings.json                      # Safe non-secret defaults
│   └── BankingSystem.Api.csproj              # .NET packages and target framework
│
├── Frontend_Angular/                         # Angular 22 single-page application
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── admin.component.ts
│   │   │   │   │   ├── beneficiaries.component.ts
│   │   │   │   │   ├── beneficiaries.component.spec.ts
│   │   │   │   │   ├── goals.component.ts
│   │   │   │   │   ├── kyc.component.ts
│   │   │   │   │   ├── open-account.component.ts
│   │   │   │   │   ├── profile.component.ts
│   │   │   │   │   ├── transactions.component.ts
│   │   │   │   │   └── supporting dashboard components
│   │   │   │   ├── home.component.ts        # Responsive application shell
│   │   │   │   ├── login.component.ts
│   │   │   │   ├── register.component.ts
│   │   │   │   └── verify-user.component.ts
│   │   │   ├── services/
│   │   │   │   └── api.service.ts           # ASP.NET Core API client
│   │   │   ├── app.config.ts
│   │   │   └── app.routes.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css                        # Tailwind and theme styles
│   ├── angular.json
│   ├── package.json
│   └── package-lock.json
│
├── Database/                                 # SQL Server scripts for SSMS
│   ├── 00_CreateDatabase.sql                 # Database bootstrap script
│   ├── 01_NormalizedSchema.sql               # Schemas, tables, keys, and constraints
│   ├── 02_LedgerAndTransactions.sql          # Ledger procedures, roles, and safeguards
│   ├── 03_IntegrityChecks.sql                 # Post-deployment verification queries
│   ├── schema.sql                             # Legacy destructive draft — do not combine
│   └── README.md                              # Detailed database notes
│
├── .gitignore
├── LICENSE
└── README.md                                  # You are here
~~~

<br />

## 🚀 Getting Started

### Prerequisites

Install the following tools:

| Requirement | Recommended Version |
|:---|:---|
| **.NET SDK** | <code>10.0</code> |
| **SQL Server** | SQL Server 2019 or later, Developer or Express edition |
| **SQL Server Management Studio** | Current SSMS release |
| **Node.js** | <code>22.x</code> |
| **npm** | <code>11.x</code> |
| **Git** | <code>2.30+</code> |

### 1. Clone the Repository

~~~powershell
git clone https://github.com/Sourav-tech-Maker/Banking_System_DotNet.git
cd Banking_System_DotNet
~~~

### 2. Create the SQL Server Database

The application database name is:

~~~text
Banking_System
~~~

Create and deploy it through SSMS by following the next section.

### 3. Configure the Backend

~~~powershell
cd BankingSystem.Api
dotnet restore
~~~

Store real secrets with .NET User Secrets. Never place them in <code>appsettings.json</code>.

### 4. Install the Angular Frontend

Open another terminal:

~~~powershell
cd Frontend_Angular
npm install
~~~

<br />

## 🗄 SQL Server & SSMS Setup

### Database Name

> [!IMPORTANT]
> Use <code>Banking_System</code> consistently in SSMS, the SQL scripts, and the ASP.NET Core connection string.

The API already targets:

~~~text
Server=.;Database=Banking_System;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True
~~~

### Execute the Scripts in SSMS

1. Open **SQL Server Management Studio**.
2. Connect to your local SQL Server instance.
3. Open <code>Database/00_CreateDatabase.sql</code>.
4. Before running it, replace every <code>YonoBank</code> database reference in that file with <code>Banking_System</code>.
5. Execute the files in this exact order:

| Order | Script | Purpose |
|:---:|:---|:---|
| 1 | <code>00_CreateDatabase.sql</code> | Creates <code>Banking_System</code> after the name replacement |
| 2 | <code>01_NormalizedSchema.sql</code> | Creates schemas, tables, keys, indexes, and constraints |
| 3 | <code>02_LedgerAndTransactions.sql</code> | Creates transfer procedures, ledger protections, and database roles |
| 4 | <code>03_IntegrityChecks.sql</code> | Verifies relational and financial integrity |

> [!CAUTION]
> Do not execute <code>schema.sql</code> in the same database as the numbered scripts. It is a preserved legacy draft that drops and recreates <code>dbo</code> tables.

### Confirm the Active Database

Run this query in SSMS:

~~~sql
SELECT DB_NAME() AS CurrentDatabase;
~~~

Expected result:

~~~text
Banking_System
~~~

You can also verify the canonical schemas:

~~~sql
SELECT name
FROM sys.schemas
WHERE name IN
(
    N'Auth',
    N'Compliance',
    N'Banking',
    N'Savings',
    N'Integration',
    N'Audit'
)
ORDER BY name;
~~~

### Canonical SQL Schemas

| Schema | Responsibility |
|:---|:---|
| <code>Auth</code> | Users, roles, refresh sessions, OTP challenges, revoked tokens |
| <code>Compliance</code> | KYC applications, addresses, and documents |
| <code>Banking</code> | Accounts, transfers, ledger entries, and beneficiaries |
| <code>Savings</code> | Goals and contribution history |
| <code>Integration</code> | Transactional outbox messages |
| <code>Audit</code> | Administrator security and operation events |

<br />

## 🔐 Backend Configuration

Run these commands from <code>BankingSystem.Api</code>.

### Required Development Secrets

~~~powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=.;Database=Banking_System;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
dotnet user-secrets set "Jwt:SigningKey" "replace-with-at-least-32-random-bytes"
dotnet user-secrets set "Rbac:RegistrationKey" "replace-with-a-private-rbac-registration-key"
~~~

### Gmail OTP Email with an App Password

~~~powershell
dotnet user-secrets set "Email:Enabled" "true"
dotnet user-secrets set "Email:FromEmail" "your-address@gmail.com"
dotnet user-secrets set "Email:Username" "your-address@gmail.com"
dotnet user-secrets set "Email:Password" "your-16-character-google-app-password"
~~~

For Gmail, <code>Email:FromEmail</code> should match <code>Email:Username</code>. The API removes spaces from a copied Google app password before authentication.

### Optional Gmail OAuth2 Configuration

~~~powershell
dotnet user-secrets set "Email:Enabled" "true"
dotnet user-secrets set "Email:FromEmail" "your-address@gmail.com"
dotnet user-secrets set "Email:Username" "your-address@gmail.com"
dotnet user-secrets set "Email:OAuth2:ClientId" "your-google-client-id"
dotnet user-secrets set "Email:OAuth2:ClientSecret" "your-google-client-secret"
dotnet user-secrets set "Email:OAuth2:RefreshToken" "your-google-refresh-token"
~~~

### Optional ImageKit Configuration

~~~powershell
dotnet user-secrets set "ImageKit:PrivateKey" "private_your_imagekit_key"
dotnet user-secrets set "ImageKit:Folder" "/kyc-documents"
~~~

> [!CAUTION]
> Never commit real connection passwords, JWT signing keys, SMTP credentials, OAuth secrets, RBAC keys, or ImageKit private keys. Development secrets belong in .NET User Secrets. Production secrets should use environment variables, Azure Key Vault, or another managed secret provider.

<br />

## ▶️ Running the Application

### Terminal 1 — ASP.NET Core API

~~~powershell
cd BankingSystem.Api
dotnet restore
dotnet run --launch-profile http
~~~

### Terminal 2 — Angular Frontend

~~~powershell
cd Frontend_Angular
npm install
npm start
~~~

### Local URLs

| Service | URL |
|:---|:---|
| **Angular frontend** | [http://localhost:4200](http://localhost:4200) |
| **ASP.NET Core API — HTTP** | [http://localhost:5065](http://localhost:5065) |
| **ASP.NET Core API — HTTPS** | [https://localhost:7039](https://localhost:7039) |
| **Swagger UI** | [http://localhost:5065/swagger](http://localhost:5065/swagger) |

<br />

## 📡 API Reference

All API routes use the <code>/api</code> prefix.

### Authentication

| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| POST | <code>/api/auth/register</code> | Register and queue an email OTP | No |
| POST | <code>/api/auth/verify-otp</code> | Verify the registration OTP | No |
| POST | <code>/api/auth/resend-otp</code> | Invalidate the old OTP and queue a new one | No |
| POST | <code>/api/auth/login</code> | Authenticate and issue secure cookies | No |
| POST | <code>/api/auth/refresh-token</code> | Rotate the refresh session | Cookie |
| POST | <code>/api/auth/logout</code> | Revoke the session and clear cookies | Cookie |

### Accounts and Transactions

| Method | Endpoint | Description |
|:---:|:---|:---|
| POST | <code>/api/account</code> | Open an account after KYC approval |
| GET | <code>/api/account</code> | List the authenticated user’s accounts |
| GET | <code>/api/account/balance/{accountId}</code> | Read a ledger-derived balance |
| POST | <code>/api/transaction</code> | Post an idempotent customer transfer |
| POST | <code>/api/transaction/system/initial-funds</code> | Post controlled system funding |
| GET | <code>/api/transaction/history</code> | Return paginated transfer history |

### Beneficiaries and Savings Goals

| Method | Endpoint | Description |
|:---:|:---|:---|
| POST | <code>/api/beneficiary/add-beneficiary</code> | Store a hidden pending beneficiary and email an OTP |
| POST | <code>/api/beneficiary/verify</code> | Activate the beneficiary only after valid OTP verification |
| GET | <code>/api/beneficiary/get-beneficiary</code> | List active verified beneficiaries |
| DELETE | <code>/api/beneficiary/{beneficiaryId}</code> | Remove an owned beneficiary |
| POST | <code>/api/goals</code> | Create a savings goal |
| GET | <code>/api/goals</code> | List savings goals |
| POST | <code>/api/goals/add-amount</code> | Record a savings contribution |
| GET | <code>/api/goals/history/{goalId}</code> | View contribution history |
| DELETE | <code>/api/goals/{goalId}</code> | Delete a savings goal |

### KYC, Dashboard, Profile, and Administration

| Method | Endpoint | Description |
|:---:|:---|:---|
| POST | <code>/api/Kyc/register-kyc</code> | Submit KYC data and documents |
| POST | <code>/api/Kyc/verify-kyc</code> | Review a KYC application |
| GET | <code>/api/dashboard</code> | Return customer dashboard information |
| GET | <code>/api/user/profile</code> | Return the authenticated profile |
| GET | <code>/api/admin/kyc-applications</code> | List KYC applications |
| GET | <code>/api/admin/stats</code> | Return administrative statistics |
| GET | <code>/api/admin/users</code> | List users |
| PUT | <code>/api/admin/users/{userId}/status</code> | Change user status |
| POST | <code>/api/admin/users/{userId}/reset-attempts</code> | Reset login attempts |
| PUT | <code>/api/admin/accounts/{accountId}/status</code> | Change account status |
| GET | <code>/api/admin/transactions</code> | List system transactions |
| POST | <code>/api/admin/transactions/{transactionId}/reverse</code> | Reverse a completed transfer |
| DELETE | <code>/api/admin/kyc/{kycId}</code> | Delete a KYC application |

<br />

## 🗃 Database Design

The normalized SQL Server schema uses <code>uniqueidentifier</code> domain keys, <code>decimal(19,4)</code> money values, UTC <code>datetime2(3)</code> timestamps, foreign keys, unique indexes, check constraints, and controlled stored procedures.

~~~mermaid
erDiagram
    USERS ||--o{ USER_ROLES : receives
    ROLES ||--o{ USER_ROLES : grants
    USERS ||--o{ REFRESH_SESSIONS : owns
    USERS ||--o{ VERIFICATION_CHALLENGES : receives
    USERS ||--o{ BANK_ACCOUNTS : owns
    USERS ||--o| KYC_APPLICATIONS : submits
    KYC_APPLICATIONS ||--o{ KYC_ADDRESSES : contains
    KYC_APPLICATIONS ||--o{ KYC_DOCUMENTS : contains
    BANK_ACCOUNTS ||--o{ LEDGER_ENTRIES : posts
    BANK_ACCOUNTS ||--o{ TRANSFERS : sends
    BANK_ACCOUNTS ||--o{ TRANSFERS : receives
    USERS ||--o{ BENEFICIARIES : manages
    BANK_ACCOUNTS ||--o{ BENEFICIARIES : references
    USERS ||--o{ SAVINGS_GOALS : creates
    SAVINGS_GOALS ||--o{ SAVINGS_CONTRIBUTIONS : receives
    USERS ||--o{ ADMIN_EVENTS : performs
    USERS ||--o{ OUTBOX_MESSAGES : triggers
~~~

### Financial Stored Procedures

| Procedure | Purpose |
|:---|:---|
| <code>Banking.usp_GetAccountBalance</code> | Calculate an account balance from ledger entries |
| <code>Banking.usp_PostCustomerTransfer</code> | Validate and post an atomic customer transfer |
| <code>Banking.usp_PostInitialFunding</code> | Post authorized initial funding |
| <code>Banking.usp_ReverseTransfer</code> | Create a compensating reversal without editing history |
| <code>Auth.usp_CleanupExpiredSecurityData</code> | Remove expired security records safely |

### Financial Integrity Rules

- Every completed transfer generates a debit and a matching credit.
- Ledger records are not edited to reverse a transfer.
- Reversals create new compensating entries.
- Idempotency keys prevent repeated network requests from double-debiting an account.
- Account rows are locked in a stable order during posting.
- KYC approval and account status are validated before customer transfers.
- <code>03_IntegrityChecks.sql</code> must return no unexpected rows before deployment.

<br />

## 🔒 Security Model

~~~mermaid
graph LR
    CORS["CORS<br/>Allowed Origins"] --> RATE["Rate Limiting<br/>Auth & OTP"]
    RATE --> JWT["JWT Validation<br/>15-Minute Access"]
    JWT --> COOKIE["HttpOnly Cookies<br/>SameSite Strict"]
    COOKIE --> RBAC["Role-Based<br/>Authorization"]
    RBAC --> OTP["Hashed OTP<br/>Maximum Attempts"]
    OTP --> SQL["Parameterized SQL<br/>EF Core"]
    SQL --> LEDGER["Stored Procedures<br/>Ledger Integrity"]

    style CORS fill:#1e293b,stroke:#64748b,color:#f1f5f9
    style RATE fill:#1e293b,stroke:#06b6d4,color:#f1f5f9
    style JWT fill:#1e293b,stroke:#3b82f6,color:#f1f5f9
    style COOKIE fill:#1e293b,stroke:#8b5cf6,color:#f1f5f9
    style RBAC fill:#1e293b,stroke:#ec4899,color:#f1f5f9
    style OTP fill:#1e293b,stroke:#f43f5e,color:#f1f5f9
    style SQL fill:#1e293b,stroke:#f59e0b,color:#f1f5f9
    style LEDGER fill:#1e293b,stroke:#10b981,color:#f1f5f9
~~~

| Threat | Protection |
|:---|:---|
| Password disclosure | BCrypt hashing; plaintext passwords are never stored |
| OTP database exposure | OTP values are SHA-256 hashed and expire after ten minutes |
| Brute-force login | Five failed attempts trigger a 15-minute lockout |
| Token theft through JavaScript | Access and refresh cookies are HttpOnly |
| Refresh-token replay | Refresh sessions rotate and old sessions are revoked |
| Duplicate transfer retry | Unique idempotency keys and SQL transaction checks |
| Partial financial posting | Stored procedures commit both ledger sides or roll back |
| Cross-user beneficiary activation | Verification is scoped to the authenticated owner |
| SMTP failure | Transactional outbox retries without rolling back domain data |
| Secret leakage | User Secrets and production secret providers keep credentials out of Git |

<br />

## ✉️ Email and OTP Delivery

The API writes email work to <code>Integration.OutboxMessages</code> in the same SQL transaction as the related domain change. A background dispatcher sends:

- Registration OTP messages
- Welcome messages after successful email verification
- Beneficiary verification OTP messages
- New-device login alerts

Use this SSMS query to inspect unsent or failed messages:

~~~sql
SELECT TOP (50)
    OutboxMessageId,
    EventType,
    AttemptCount,
    NextAttemptAtUtc,
    LastError,
    OccurredAtUtc
FROM Integration.OutboxMessages
WHERE ProcessedAtUtc IS NULL
ORDER BY OccurredAtUtc DESC;
~~~

A beneficiary remains in hidden <code>PENDING</code> status until its six-digit OTP is verified. Only <code>ACTIVE</code> beneficiaries are returned to the Angular interface.

<br />

## ✅ Build and Tests

### Backend

~~~powershell
cd BankingSystem.Api
dotnet restore
dotnet build
~~~

### Angular Production Build

~~~powershell
cd Frontend_Angular
npm install
npm run build
~~~

### Angular Tests

~~~powershell
npm test -- --watch=false
~~~

The beneficiary test suite verifies that submitting bank details only requests an OTP and that the beneficiary list refreshes only after a six-digit code is successfully verified.

<br />

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make and test the change.
4. Commit with a clear message.
5. Push the branch.
6. Open a pull request against <code>main</code>.

### Suggested Commit Prefixes

| Prefix | Purpose |
|:---|:---|
| <code>feat:</code> | New functionality |
| <code>fix:</code> | Bug fix |
| <code>docs:</code> | Documentation |
| <code>refactor:</code> | Internal code improvement |
| <code>security:</code> | Security hardening |
| <code>test:</code> | Tests |

<br />

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE).

<br />

---

<div align="center">

**Built with ❤️ by [Sourav](https://github.com/Sourav-tech-Maker)**

If this project helped you, consider giving it a ⭐

</div>
