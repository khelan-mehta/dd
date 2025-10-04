# ExpenseFlow - Expense Reimbursement Application

A comprehensive expense management system with multi-level approval workflows, OCR receipt scanning, and role-based access control.

## Features

### 🔐 Authentication & User Management
- Secure signup/login with JWT authentication
- Multi-role support (Admin, Manager, Employee)
- Auto-company creation on first signup
- User role management and assignment

### 💰 Expense Management
- Submit expense claims with multiple categories
- Multi-currency support with automatic conversion
- OCR receipt scanning for auto-fill
- Track expense history and approval status
- Real-time status updates

### ✅ Approval Workflows
- **Sequential Approval**: Step-by-step approvals through multiple levels
- **Percentage Approval**: Require a certain percentage of approvers
- **Specific Approver**: Designate a single approver (e.g., CFO)
- **Hybrid Rules**: Combine percentage OR specific approver
- Manager hierarchy support
- Configurable amount thresholds

### 👥 Role-Based Access

#### Admin
- Manage all users (create, edit, assign roles)
- Configure approval rules
- View all expenses across organization
- Override approvals

#### Manager
- Approve/reject team expenses
- View team expense reports
- Submit personal expenses
- Access pending approval queue

#### Employee
- Submit expense claims
- Upload receipts with OCR
- Track reimbursement status
- View personal expense history

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend API**: NestJS (localhost:3000)
- **Features**: OCR, Currency Conversion, Multi-level Approvals

## Getting Started

1. Ensure backend API is running on `http://localhost:3000`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Access at `http://localhost:8080`

## Default Flow

1. **Signup** - Create account as Admin (auto-creates company)
2. **Add Users** - Admin creates employees and managers
3. **Configure Rules** - Set up approval workflows
4. **Submit Expenses** - Employees submit reimbursements
5. **Approve** - Managers/Admins review and approve
6. **Track** - Everyone monitors their expense status

## API Integration

The app integrates with:
- REST Countries API for country/currency data
- Exchange Rate API for currency conversion
- Backend OCR service for receipt processing
