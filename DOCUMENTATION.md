# Dental Clinical Management System - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [Authentication System](#authentication-system)
7. [Features & Modules](#features--modules)
8. [Components Library](#components-library)
9. [Services & API Integration](#services--api-integration)
10. [Hooks](#hooks)
11. [Type Definitions](#type-definitions)
12. [Deployment](#deployment)
13. [Development Guidelines](#development-guidelines)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

### Description
A comprehensive dental clinical management system built with Next.js 15, designed for healthcare professionals to manage patient records, appointments, electronic health records (EHR), medical supplies, and staff operations.

### Key Capabilities
- **Role-Based Access Control**: Separate interfaces for Doctors and Nurses
- **Patient Management**: Complete patient information and history tracking
- **EHR System**: Digital health records with change tracking and history
- **Appointment Scheduling**: Calendar-based appointment management
- **Inventory Management**: Medical supplies tracking and stock transactions
- **AI-Powered Features**: Clinical note generation, terminology assistance, and data extraction
- **Dental-Specific Tools**: Tooth chart visualization and treatment planning

### Version
1.0.0

---

## Technology Stack

### Frontend Framework
- **Next.js 15.5.7** - React framework with App Router
- **React 19.0.0** - UI library
- **TypeScript 5** - Type-safe development

### Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Custom Design System** - Predefined color palette and components

### UI Components
- **Lucide React 0.460.0** - Icon library
- **Custom Components** - 38 reusable UI components

### State Management
- **React Context API** - Global authentication state
- **Local Storage** - Client-side token persistence

### Testing
- **Jest 30.2.0** - Testing framework
- **React Testing Library 16.3.0** - Component testing
- **Jest DOM** - DOM matchers

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## Project Structure

```
ClinalProject/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── auth/                     # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/             # Doctor registration
│   │   │   └── register-nurse/       # Nurse registration
│   │   ├── dashboard/                # Main application pages
│   │   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── appointments/         # Appointment management
│   │   │   ├── clinical-decision-support/  # AI-powered clinical tools
│   │   │   ├── doctors/              # Doctor management
│   │   │   ├── ehr/                  # Electronic Health Records
│   │   │   │   ├── [id]/             # View EHR
│   │   │   │   ├── edit/[id]/        # Edit EHR
│   │   │   │   ├── new/              # Create new EHR
│   │   │   │   └── print/[id]/       # Printable EHR
│   │   │   ├── history/              # Patient history
│   │   │   ├── nurses/               # Nurse management
│   │   │   ├── patients/             # Patient management
│   │   │   ├── staff/                # Staff overview
│   │   │   ├── supplies/             # Supply inventory
│   │   │   └── transactions/         # Stock transactions
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing/home page
│   │
│   ├── components/                   # Reusable UI components (38 total)
│   │   ├── AI Components (6):
│   │   │   ├── AIAutoCompleteTextarea.tsx
│   │   │   ├── AIExtractDataModal.tsx
│   │   │   ├── AIGenerateNotesModal.tsx
│   │   │   ├── AIParseEHRModal.tsx
│   │   │   ├── AITerminologyInput.tsx
│   │   │   └── AITreatmentSuggestions.tsx
│   │   │
│   │   ├── Form Components (5):
│   │   │   ├── AutoExpandTextarea.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── PasswordInput.tsx
│   │   │   ├── PatientAutocomplete.tsx
│   │   │   └── AppointmentSearchAutocomplete.tsx
│   │   │
│   │   ├── UI Components (12):
│   │   │   ├── Alert.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── PageTransition.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── ToastNotification.tsx
│   │   │
│   │   ├── Complex Components (9):
│   │   │   ├── CalendarView.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── DayAppointmentsSidebar.tsx
│   │   │   ├── EHRTimeline.tsx
│   │   │   ├── EnhancedEHRForm.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ToothChart.tsx
│   │   │
│   │   ├── Modals (3):
│   │   │   ├── DoctorDetailsModal.tsx
│   │   │   ├── NurseDetailsModal.tsx
│   │   │   └── SupplyDetailsModal.tsx
│   │   │
│   │   ├── Display Components (2):
│   │   │   ├── StatCard.tsx
│   │   │   └── TokenExpirationWarning.tsx
│   │   │
│   │   └── Print Components (2):
│   │       ├── PrintableEHR.tsx
│   │       └── PrintableSchedule.tsx
│   │
│   ├── config/
│   │   └── api.config.ts             # API configuration and endpoints
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx           # Authentication context provider
│   │
│   ├── hooks/                        # Custom React hooks (7 total)
│   │   ├── useAIAutocomplete.ts
│   │   ├── useAIExtractData.ts
│   │   ├── useAIGenerateNotes.ts
│   │   ├── useAIParseEHR.ts
│   │   ├── useAISuggestTreatments.ts
│   │   ├── useAITerminology.ts
│   │   └── useUnsavedChanges.ts
│   │
│   ├── services/                     # API and business logic services
│   │   ├── ai.service.ts
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   └── api.types.ts              # TypeScript type definitions
│   │
│   └── utils/                        # Utility functions
│       ├── date.utils.ts
│       ├── ehr.utils.ts
│       ├── patient.validation.ts
│       ├── scroll.utils.ts
│       └── validation.utils.ts
│
├── public/                           # Static assets
├── node_modules/                     # Dependencies
├── .eslintrc.json                    # ESLint configuration
├── .gitignore                        # Git ignore rules
├── next.config.ts                    # Next.js configuration
├── next-env.d.ts                     # Next.js TypeScript declarations
├── package.json                      # Project dependencies and scripts
├── postcss.config.mjs                # PostCSS configuration
├── tailwind.config.ts                # Tailwind CSS configuration
└── tsconfig.json                     # TypeScript configuration
```

---


## Configuration

### API Configuration (src/config/api.config.ts)

The API configuration file contains all backend endpoints and storage keys.

**Key Configuration**:
- `BASE_URL`: Backend API URL (from environment variable)
- `ENDPOINTS`: All API endpoint paths
- `STORAGE_KEYS`: LocalStorage key names
- `USER_ROLES`: Available user roles

### Environment Variables

**Required**:
- `NEXT_PUBLIC_API_BASE_URL`: Backend API base URL

**Example .env.local**:
```env
NEXT_PUBLIC_API_BASE_URL=https://localhost:7044
```

### Tailwind Configuration

Custom color palette for medical UI:
- **Primary**: Blue tones (#0080FF)
- **Success**: Green tones (#10B981)
- **Warning**: Amber tones (#F59E0B)
- **Danger**: Red tones (#EF4444)
- **Info**: Blue tones (#3B82F6)
- **Neutral**: Gray scale

---

## Authentication System

### Overview
JWT-based authentication with role-based access control (RBAC) for Doctors and Nurses.

### Authentication Flow

1. **User Registration**
   - Doctors: `/auth/register`
   - Nurses: `/auth/register-nurse`
   - Required fields: name, email, phone, password
   - Optional: registrationKey (for validation)

2. **User Login**
   - Endpoint: `/auth/login`
   - Returns JWT token with user information
   - Token stored in localStorage

3. **Token Management**
   - **JWT Structure**: Contains user ID, role, email, name, expiration
   - **Token Validation**: Automatic validation on each request
   - **Token Expiration**: Configurable warning before expiration
   - **Auto Logout**: Automatic logout on token expiration

4. **Protected Routes**
   - All `/dashboard/*` routes require authentication
   - Role-based UI rendering (Doctor vs Nurse views)

### AuthContext API

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userName: string | null;
  userId: string | null;
  token: string | null;
  tokenExpiresIn: number;
  isTokenExpiringSoon: boolean;
  login: (token: string, role: UserRole, name: string, id: string) => void;
  logout: () => void;
  isDoctor: () => boolean;
  isNurse: () => boolean;
  refreshAuthStatus: () => void;
}
```

### Usage Example

```typescript
'use client';
import { useAuth } from '@/contexts/AuthContext';

export default function Component() {
  const { isAuthenticated, userRole, isDoctor, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      <p>Welcome, {isDoctor() ? 'Doctor' : 'Nurse'}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## Features & Modules

### 1. Dashboard Overview

**Location**: `/dashboard`

**Features**:
- Quick statistics (Total Patients, Appointments, Doctors, Nurses)
- Recent appointments list
- Low stock supplies alert
- Quick action buttons

**Access**: Both Doctors and Nurses

---

### 2. Patient Management

**Location**: `/dashboard/patients`

**Features**:
- **Patient List**: Searchable, filterable patient directory
- **Patient Details**: View complete patient information
- **Add Patient**: Create new patient records
- **Edit Patient**: Update patient information
- **Patient History**: View all appointments and EHRs

**Data Fields**:
- First Name, Middle Name, Last Name
- Gender (Male/Female/Other)
- Date of Birth
- Phone Number

**Access**: Both Doctors and Nurses

---

### 3. Electronic Health Records (EHR)

**Location**: `/dashboard/ehr`

#### EHR Features

**Create EHR** (`/dashboard/ehr/new`):
- Patient selection with autocomplete
- Appointment linking
- Clinical information:
  - Allergies
  - Medical Alerts
  - Diagnosis
  - Clinical Notes
  - Periodontal Status
  - Recommendations
  - History
  - Treatments
  - X-Ray Findings
- **Medications**: Add multiple medications with dosage, frequency, route
- **Procedures**: Track dental procedures with codes and descriptions
- **Tooth Records**: Dental chart with condition tracking
- **X-Rays**: Upload and track radiographic images
- **AI-Powered Tools**:
  - Auto-complete for clinical terms
  - Generate clinical notes from bullet points
  - Extract data from free text
  - Treatment suggestions based on diagnosis

**View EHR** (`/dashboard/ehr/[id]`):
- Complete EHR display
- Change history timeline
- Print functionality
- Edit access (Doctors only)

**Edit EHR** (`/dashboard/ehr/edit/[id]`):
- Modify existing EHR
- Track all changes with change logs
- Who changed what and when

**EHR History** (`/dashboard/ehr/[id]/history`):
- View all modifications
- Change log with field-level tracking
- User attribution for changes

**Access**: 
- **Doctors**: Full CRUD access
- **Nurses**: View-only access

---

### 4. Appointment Management

**Location**: `/dashboard/appointments`

**Features**:
- **Calendar View**: Visual calendar with monthly/weekly views
- **Day View**: Detailed appointment list for selected day
- **Create Appointment**: 
  - Patient selection
  - Doctor assignment
  - Nurse assignment
  - Date & Time selection
  - Appointment type
  - Reference number generation
- **Edit Appointment**: Update appointment details
- **Status Management**: 
  - Scheduled
  - Completed
  - Cancelled
  - No-show
- **Search & Filter**:
  - By patient name
  - By date range
  - By doctor
  - By nurse
  - By status
  - By appointment type

**Appointment Types**:
- Checkup
- Cleaning
- Filling
- Root Canal
- Extraction
- Crown
- Bridge
- Implant
- Orthodontics
- Emergency
- Consultation
- Follow-up
- Other

**Access**: Both Doctors and Nurses

---

### 5. Doctor Management

**Location**: `/dashboard/doctors`

**Features**:
- **Doctor List**: View all registered doctors
- **Doctor Details**: Name, email, phone, appointments
- **Doctor Profile**: View individual doctor information
- **Associated Appointments**: List of doctor's appointments
- **Associated EHRs**: List of EHRs created by doctor

**Access**: Both Doctors and Nurses (view-only)

---

### 6. Nurse Management

**Location**: `/dashboard/nurses`

**Features**:
- **Nurse List**: View all registered nurses
- **Nurse Details**: Name, email, phone, appointments
- **Delete Nurse**: Remove nurse (with validation checks)
- **Associated Appointments**: List of nurse's appointments
- **Validation**: Prevent deletion if nurse has linked EHRs

**Access**: Doctors only

---

### 7. Inventory Management

**Location**: `/dashboard/supplies`

**Features**:
- **Supply List**: All medical/dental supplies
- **Categories**:
  - Consumables
  - Instruments
  - Equipment
  - Medications
  - Materials
  - PPE (Personal Protective Equipment)
  - Other
- **Stock Levels**: Current quantity tracking
- **Low Stock Alerts**: Configurable threshold warnings
- **Add Supply**: Create new supply items
- **Update Stock**: Adjust quantity levels
- **Delete Supply**: Remove items (Doctors only)

**Supply Information**:
- Supply Name
- Category
- Unit of Measurement
- Current Quantity
- Description
- Stock Transaction History

**Access**:
- **Doctors**: Full CRUD access
- **Nurses**: View-only access

---

### 8. Stock Transactions

**Location**: `/dashboard/transactions`

**Features**:
- **Transaction History**: Complete log of stock changes
- **Create Transaction**: Record stock usage
  - Doctor attribution
  - Supply selection
  - Quantity used
  - Date & Time
- **Edit Transaction**: Modify existing records
- **Delete Transaction**: Remove transactions (Doctors only)
- **Filtering**:
  - By doctor
  - By supply
  - By date range

**Transaction Data**:
- Transaction ID
- Date & Time
- Quantity (positive for additions, negative for usage)
- Doctor responsible
- Supply item

**Access**:
- **Doctors**: Full CRUD access
- **Nurses**: View-only access

---

### 9. Staff Overview

**Location**: `/dashboard/staff`

**Features**:
- **Combined View**: Doctors and Nurses in one place
- **Quick Stats**: Total doctors and nurses count
- **Staff List**: Tabbed interface for Doctors/Nurses
- **Quick Actions**: View details, manage staff

**Access**: Both Doctors and Nurses

---

### 10. Patient History

**Location**: `/dashboard/history`

**Features**:
- **Patient Selection**: Choose patient to view history
- **Appointment Timeline**: Chronological list of appointments
- **EHR Access**: Quick links to associated EHRs
- **Filtering**:
  - Date range
  - Appointment type
  - Status
- **Export/Print**: Generate patient history reports

**Access**:
- **Doctors**: Full access
- **Nurses**: View-only access

---

### 11. Clinical Decision Support

**Location**: `/dashboard/clinical-decision-support`

**AI-Powered Features**:

#### Auto-Complete
- Smart text completion for clinical notes
- Context-aware suggestions
- Medical terminology assistance

#### Clinical Note Generation
- Convert bullet points to structured notes
- Professional formatting
- Context preservation

#### Data Extraction
- Parse free-text clinical notes
- Extract structured data:
  - Diagnosis
  - Symptoms
  - Treatments
  - Medications
  - Affected teeth
  - Allergies
  - Medical alerts

#### Treatment Suggestions
- AI-powered treatment recommendations
- Based on diagnosis and patient history
- Evidence-based suggestions

#### Terminology Input
- Medical/dental term autocomplete
- Standardized terminology
- Quick search and selection

**Access**: Both Doctors and Nurses

---

## Components Library

### AI Components (6)

#### 1. AIAutoCompleteTextarea
**Purpose**: Textarea with AI-powered auto-completion

**Props**:
```typescript
{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  context?: string; 
  completionType?: 'clinical-notes' | 'diagnosis' | 'treatment';
}
```

**Usage**:
```typescript
<AIAutoCompleteTextarea
  value={notes}
  onChange={setNotes}
  placeholder="Enter clinical notes..."
  context="Patient with tooth pain"
  completionType="clinical-notes"
/>
```

#### 2. AIExtractDataModal
**Purpose**: Extract structured data from free text

**Features**:
- Parse clinical notes
- Extract medications, diagnoses, symptoms
- Populate form fields automatically

#### 3. AIGenerateNotesModal
**Purpose**: Generate professional clinical notes from bullet points

**Input**: Bullet point list
**Output**: Formatted clinical note

#### 4. AIParseEHRModal
**Purpose**: Parse complete EHR from unstructured text

**Use Case**: Import external medical records

#### 5. AITerminologyInput
**Purpose**: Input field with medical terminology suggestions

**Features**:
- Real-time terminology search
- Standardized medical terms
- Quick selection

#### 6. AITreatmentSuggestions
**Purpose**: Display AI-generated treatment recommendations

**Input**: Diagnosis and patient history
**Output**: List of suggested treatments

---

### Form Components (5)

#### 1. AutoExpandTextarea
**Purpose**: Textarea that auto-expands based on content

**Props**:
```typescript
{
  value: string;
  onChange: (e) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
}
```

#### 2. Input
**Purpose**: Styled input field with validation

**Props**:
```typescript
{
  type: string;
  label?: string;
  error?: string;
  required?: boolean;
}
```

#### 3. PasswordInput
**Purpose**: Password input with visibility toggle

**Features**:
- Show/hide password
- Strength indicator (optional)
- Validation feedback

#### 4. PatientAutocomplete
**Purpose**: Search and select patients

**Features**:
- Real-time search
- Display patient name and DOB
- Create new patient option

#### 5. AppointmentSearchAutocomplete
**Purpose**: Search appointments by various criteria

**Features**:
- Search by patient, doctor, or reference number
- Quick selection
- Display appointment details

---

### UI Components (12)

#### 1. Alert
**Purpose**: Display contextual messages

**Variants**: success, error, warning, info

**Props**:
```typescript
{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
}
```

#### 2. Badge
**Purpose**: Status indicators

**Variants**: primary, success, warning, danger, info, neutral

**Usage**:
```typescript
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
```

#### 3. Breadcrumb
**Purpose**: Navigation hierarchy

**Props**:
```typescript
{
  items: Array<{
    label: string;
    href?: string;
  }>;
}
```

#### 4. Button
**Purpose**: Action buttons

**Variants**: primary, secondary, success, danger, ghost
**Sizes**: sm, md, lg

**Props**:
```typescript
{
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}
```

#### 5. Card
**Purpose**: Content container

**Props**:
```typescript
{
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}
```

#### 6. EmptyState
**Purpose**: Display when no data available

**Props**:
```typescript
{
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}
```

#### 7. LoadingSpinner
**Purpose**: Loading indicator

**Sizes**: sm, md, lg

**Props**:
```typescript
{
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}
```

#### 8. Modal
**Purpose**: Dialog overlay

**Props**:
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}
```

#### 9. PageTransition
**Purpose**: Smooth page transitions

**Usage**: Wrap page content for animation

#### 10. Table
**Purpose**: Data table display

**Features**:
- Sortable columns
- Pagination
- Row selection
- Custom cell rendering

**Props**:
```typescript
{
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value, row) => ReactNode;
  }>;
  data: any[];
  onRowClick?: (row) => void;
  pagination?: boolean;
  loading?: boolean;
}
```

#### 11. Tabs
**Purpose**: Tabbed interface

**Props**:
```typescript
{
  tabs: Array<{
    id: string;
    label: string;
    content: ReactNode;
    icon?: ReactNode;
  }>;
  activeTab?: string;
  onChange?: (tabId: string) => void;
}
```

#### 12. ToastNotification
**Purpose**: Temporary notification messages

**Variants**: success, error, warning, info
**Auto-dismiss**: Configurable timeout

---

### Complex Components (9)

#### 1. CalendarView
**Purpose**: Monthly calendar with appointment display

**Features**:
- Month navigation
- Day selection
- Appointment count per day
- Event highlighting

#### 2. ConfirmDialog
**Purpose**: Confirmation dialog for destructive actions

**Props**:
```typescript
{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}
```

#### 3. DayAppointmentsSidebar
**Purpose**: Display appointments for selected day

**Features**:
- Chronological list
- Appointment details
- Quick actions
- Status indicators

#### 4. EHRTimeline
**Purpose**: Visual timeline of EHR changes

**Features**:
- Chronological change log
- User attribution
- Field-level changes
- Timestamp display

#### 5. EnhancedEHRForm
**Purpose**: Comprehensive EHR creation/editing form

**Features**:
- Multi-section form
- Medication management
- Procedure tracking
- Tooth chart integration
- X-ray management
- AI assistance integration
- Auto-save
- Validation

#### 6. ImageUpload
**Purpose**: Upload and manage medical images

**Features**:
- Drag & drop
- Preview
- Multiple file support
- File type validation
- Size limit enforcement

#### 7. SearchBar
**Purpose**: Universal search component

**Features**:
- Debounced search
- Clear button
- Icon support
- Keyboard shortcuts

#### 8. Sidebar
**Purpose**: Main navigation sidebar

**Features**:
- Role-based menu items
- Active route highlighting
- Collapsible sections
- User information display
- Logout button

**Menu Structure for Doctors**:
- Dashboard
- Appointments
- Patients
- EHR
- Doctors
- Nurses
- Supplies
- Transactions
- Staff
- History
- Clinical Decision Support

**Menu Structure for Nurses (limited)**:
- Dashboard
- Appointments
- Patients
- EHR (view-only)
- Doctors
- Staff

#### 9. ToothChart
**Purpose**: Interactive dental chart

**Features**:
- Adult dentition (FDI notation)
- Tooth selection
- Condition marking
- Treatment planning
- Visual indicators for:
  - Healthy
  - Decay
  - Filled
  - Missing
  - Crown
  - Root canal
  - Other conditions

**Notation**: FDI (Fédération Dentaire Internationale)
- Permanent teeth: 11-48
- Visual quadrant layout

---

### Modals (3)

#### 1. DoctorDetailsModal
**Purpose**: Display doctor information

**Content**:
- Personal information
- Contact details
- Appointment count
- Recent appointments
- Associated EHRs

#### 2. NurseDetailsModal
**Purpose**: Display nurse information

**Content**:
- Personal information
- Contact details
- Appointment count
- Recent appointments

#### 3. SupplyDetailsModal
**Purpose**: Display supply information

**Content**:
- Supply details
- Stock level
- Recent transactions
- Usage history

---

### Display Components (2)

#### 1. StatCard
**Purpose**: Display key statistics

**Props**:
```typescript
{
  title: string;
  value: number | string;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: string;
}
```

#### 2. TokenExpirationWarning
**Purpose**: Warn users of approaching token expiration

**Features**:
- Countdown timer
- Auto-refresh option
- Session extension
- Auto-dismiss on refresh

---

### Print Components (2)

#### 1. PrintableEHR
**Purpose**: Print-optimized EHR layout

**Features**:
- Clean print layout
- Patient information header
- All EHR sections
- Medical-grade formatting
- Logo/clinic information

#### 2. PrintableSchedule
**Purpose**: Print-optimized appointment schedule

**Features**:
- Day/week/month views
- Appointment list
- Doctor/nurse schedule
- Time blocks

---

## Services & API Integration

### API Service (src/services/api.service.ts)

**Purpose**: Central HTTP client with authentication and error handling

#### Key Features:
- **Token Management**: Automatic JWT injection
- **Token Expiration**: Proactive expiration checking
- **Error Handling**: Centralized error processing
- **Type Safety**: Full TypeScript support

#### Core Methods:

```typescript
class ApiService {
  // GET request
  async get<T>(endpoint: string): Promise<T>
  
  // POST request
  async post<T>(endpoint: string, data: any): Promise<T>
  
  // PUT request
  async put<T>(endpoint: string, data: any): Promise<T>
  
  // DELETE request
  async delete<T>(endpoint: string): Promise<T>
  
  // PATCH request
  async patch<T>(endpoint: string, data: any): Promise<T>
}
```

#### Usage Example:

```typescript
import apiService from '@/services/api.service';

// Fetch patients
const patients = await apiService.get<Patient[]>('/Patient');

// Create patient
const newPatient = await apiService.post<Patient>('/Patient', {
  first: 'John',
  last: 'Doe',
  gender: 'Male',
  dob: '1990-01-01'
});

// Update patient
await apiService.put(`/Patient/${id}`, updatedData);

// Delete patient
await apiService.delete(`/Patient/${id}`);
```

---

### Auth Service (src/services/auth.service.ts)

**Purpose**: Authentication and authorization utilities

#### Key Functions:

```typescript
// JWT Parsing
function parseJwt(token: string): TokenPayload | null

// Token Validation
function validateToken(): { isValid: boolean, error?: string }

// Token Expiration
function getTokenTimeRemaining(): number
function isTokenExpiringSoon(minutes?: number): boolean
function getTokenTimeRemainingFormatted(): string

// Role Checking
function isDoctor(): boolean
function isNurse(): boolean

// User Information
function getUserId(): number | null
function getUserEmail(): string | null
function getUserName(): string | null

// Authentication Status
function isAuthenticated(): boolean

// Logout
function logout(redirect?: boolean): void
```

#### Usage Example:

```typescript
import { isAuthenticated, isDoctor, getTokenTimeRemaining } from '@/services/auth.service';

// Check authentication
if (!isAuthenticated()) {
  router.push('/auth/login');
}

// Check role
if (isDoctor()) {
  // Show doctor-specific features
}

// Check token expiration
const remaining = getTokenTimeRemaining();
if (remaining < 300000) { // 5 minutes
  // Show warning
}
```

---

### AI Service (src/services/ai.service.ts)

**Purpose**: AI-powered clinical assistance

#### Available Functions:

```typescript
// Auto-complete clinical text
async function aiAutoComplete(
  partialText: string,
  context?: string
): Promise<string[]>

// Generate clinical notes from bullet points
async function aiGenerateNotes(
  bulletPoints: string,
  patientContext?: string
): Promise<string>

// Suggest treatments based on diagnosis
async function aiSuggestTreatments(
  diagnosis: string,
  patientHistory?: string
): Promise<string[]>

// Extract clinical data from free text
async function aiExtractClinicalData(
  freeText: string
): Promise<ExtractedData>

// Medical terminology autocomplete
async function aiTerminologySuggestions(
  partialTerm: string
): Promise<string[]>

// Parse complete EHR from text
async function aiParseEHR(
  freeText: string
): Promise<Partial<EHR>>
```

#### Usage Example:

```typescript
import { aiAutoComplete, aiSuggestTreatments } from '@/services/ai.service';

// Get autocomplete suggestions
const suggestions = await aiAutoComplete(
  'Patient presents with sev',
  'Dental checkup'
);
// Returns: ['severe toothache', 'severe gingivitis', ...]

// Get treatment suggestions
const treatments = await aiSuggestTreatments(
  'Dental caries class II',
  'Patient has previous fillings'
);
// Returns: ['Composite filling', 'Root canal therapy', ...]
```

---

## Hooks

### 1. useAIAutocomplete

**Purpose**: Hook for AI-powered text completion

**Usage**:
```typescript
import { useAIAutocomplete } from '@/hooks/useAIAutocomplete';

function Component() {
  const {
    suggestions,
    isLoading,
    error,
    getSuggestions,
    applySuggestion
  } = useAIAutocomplete({
    completionType: 'clinical-notes',
    context: 'Dental examination'
  });

  const handleInput = async (text: string) => {
    await getSuggestions(text);
  };

  return (
    <div>
      <textarea onChange={(e) => handleInput(e.target.value)} />
      {suggestions.map(s => (
        <button onClick={() => applySuggestion(s)}>{s}</button>
      ))}
    </div>
  );
}
```

---

### 2. useAIExtractData

**Purpose**: Extract structured data from clinical text

**Usage**:
```typescript
import { useAIExtractData } from '@/hooks/useAIExtractData';

function Component() {
  const {
    extractedData,
    isLoading,
    error,
    extractData
  } = useAIExtractData();

  const handleExtract = async (text: string) => {
    const data = await extractData(text);
    // data contains: diagnosis, symptoms, medications, etc.
  };
}
```

---

### 3. useAIGenerateNotes

**Purpose**: Generate clinical notes from bullet points

**Usage**:
```typescript
import { useAIGenerateNotes } from '@/hooks/useAIGenerateNotes';

function Component() {
  const {
    generatedNotes,
    isLoading,
    error,
    generateNotes
  } = useAIGenerateNotes();

  const handleGenerate = async (bulletPoints: string) => {
    await generateNotes(bulletPoints, 'Patient context');
  };
}
```

---

### 4. useAIParseEHR

**Purpose**: Parse complete EHR from unstructured text

**Usage**:
```typescript
import { useAIParseEHR } from '@/hooks/useAIParseEHR';

function Component() {
  const {
    parsedEHR,
    isLoading,
    error,
    parseEHR
  } = useAIParseEHR();

  const handleParse = async (text: string) => {
    const ehr = await parseEHR(text);
    // Populate EHR form with parsed data
  };
}
```

---

### 5. useAISuggestTreatments

**Purpose**: Get AI treatment recommendations

**Usage**:
```typescript
import { useAISuggestTreatments } from '@/hooks/useAISuggestTreatments';

function Component() {
  const {
    treatments,
    isLoading,
    error,
    suggestTreatments
  } = useAISuggestTreatments();

  const handleSuggest = async (diagnosis: string) => {
    await suggestTreatments(diagnosis, patientHistory);
  };
}
```

---

### 6. useAITerminology

**Purpose**: Medical terminology autocomplete

**Usage**:
```typescript
import { useAITerminology } from '@/hooks/useAITerminology';

function Component() {
  const {
    suggestions,
    isLoading,
    getSuggestions
  } = useAITerminology();

  const handleSearch = async (term: string) => {
    await getSuggestions(term);
  };
}
```

---

### 7. useUnsavedChanges

**Purpose**: Warn users of unsaved changes before navigation

**Usage**:
```typescript
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

function Component() {
  const [hasChanges, setHasChanges] = useState(false);
  
  useUnsavedChanges(hasChanges);

  // User will be warned if they try to navigate away with unsaved changes
}
```

---

## Type Definitions

### Core Interfaces

#### Authentication Types
```typescript
interface AuthResponse {
  token: string;
  doctorId?: number;
  nurseId?: number;
  name: string;
  email: string;
  phone: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterDoctorRequest {
  name: string;
  phone: string;
  email: string;
  password: string;
  registrationKey?: string;
}

interface RegisterNurseRequest {
  name: string;
  phone: string;
  email: string;
  password: string;
  registrationKey?: string;
}
```

#### Patient Types
```typescript
interface Patient {
  patient_ID: number;
  first: string;
  middle?: string | null;
  last: string;
  gender: string;
  dob: string;
  phone?: string | null;
}

interface PatientCreateRequest {
  first: string;
  middle?: string | null;
  last: string;
  gender: string;
  dob: string;
  phone?: string | null;
}
```

#### Appointment Types
```typescript
interface Appointment {
  appointment_ID: number;
  date: string;
  time: string;
  ref_Num: string;
  type: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  patient_ID: number;
  doctor_ID: number;
  nurse_ID: number;
  patient?: Patient;
  doctor?: Doctor;
  nurse?: Nurse;
}
```

#### EHR Types
```typescript
interface EHR {
  ehr_ID?: number;
  allergies?: string;
  medicalAlerts?: string;
  diagnosis?: string;
  xRayFindings?: string;
  periodontalStatus?: string;
  clinicalNotes?: string;
  recommendations?: string;
  history?: string;
  treatments?: string;
  updatedAt?: string;
  updatedBy?: string;
  patient_ID?: number;
  appointmentId?: number;
  medications?: Medication[];
  procedures?: Procedure[];
  teeth?: ToothRecord[];
  xRays?: XRay[];
  changeLogs?: ChangeLog[];
}

interface Medication {
  medication_ID?: number;
  name?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

interface Procedure {
  procedure_ID?: number;
  code?: string;
  description?: string;
  performedAt?: string;
  toothNumber?: number;
  toothName?: string;
  status?: string;
  notes?: string;
}

interface ToothRecord {
  toothRecord_ID?: number;
  toothNumber?: number;
  toothName?: string;
  condition?: string;
  treatmentPlanned?: string;
  treatmentCompleted?: string;
  surfaces?: string;
  notes?: string;
}
```

#### Supply & Transaction Types
```typescript
interface Supply {
  supply_ID: number;
  supply_Name: string;
  category: string;
  unit: string;
  quantity: number;
  description?: string;
}

interface StockTransaction {
  t_ID: number;
  date: string;
  time: string;
  quantity: number;
  doctor_ID: number;
  supply_ID: number;
  doctor?: DoctorBasicInfo;
  supply?: SupplyBasicInfo;
}
```

---

## Deployment

### Vercel Deployment

#### Prerequisites
1. **GitHub Repository**: Code pushed to GitHub
2. **Backend API**: Deployed and accessible via HTTPS
3. **Vercel Account**: Free account at vercel.com

#### Deployment Steps

1. **Connect Repository**
   - Login to Vercel
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository branch (main or Vercel)

2. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add the following:
   
   ```
   Key: NEXT_PUBLIC_API_BASE_URL
   Value: https://your-backend-api.com
   Environment: Production, Preview, Development
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Access your app at: `https://your-app.vercel.app`

#### Post-Deployment

1. **Backend CORS Configuration**
   Update your backend to allow requests from Vercel:
   
   ```csharp
   // In your .NET backend Program.cs
   builder.Services.AddCors(options =>
   {
       options.AddPolicy("AllowVercel",
           policy =>
           {
               policy.WithOrigins(
                   "http://localhost:3000",  // Local development
                   "https://your-app.vercel.app"  // Production
               )
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
           });
   });
   ```

2. **Test Deployment**
   - Visit your Vercel URL
   - Test login functionality
   - Verify API connectivity
   - Check all features

3. **Custom Domain** (Optional)
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS settings

#### Continuous Deployment

Vercel automatically deploys on:
- **Push to main branch**: Production deployment
- **Pull requests**: Preview deployments
- **Push to other branches**: Branch deployments

#### Common Deployment Issues

**Issue**: Build fails with TypeScript errors
**Solution**: Fix TypeScript errors locally and push again

**Issue**: API calls failing (CORS errors)
**Solution**: Add Vercel URL to backend CORS policy

**Issue**: Environment variables not working
**Solution**: Ensure variables start with `NEXT_PUBLIC_` and redeploy

**Issue**: 404 on refresh
**Solution**: Vercel handles this automatically for Next.js

---

### Backend Deployment

#### Recommended Platforms
1. **Azure App Service** (Microsoft)
2. **AWS Elastic Beanstalk** (Amazon)
3. **Heroku** (Simple, good for testing)
4. **DigitalOcean App Platform**

#### Azure Deployment Example

1. **Create Azure Account**
2. **Create App Service**
   - Runtime: .NET 8
   - Region: Choose closest to users
   - Pricing: Free tier for testing

3. **Configure Database**
   - Azure SQL Database or
   - Connection string in App Settings

4. **Deploy from Visual Studio**
   - Right-click project → Publish
   - Select Azure
   - Follow wizard

5. **Configure CORS**
   - Add Vercel URL to allowed origins
   - Enable HTTPS only

---

## Development Guidelines

### Code Style

#### TypeScript
- Use strict type checking
- Avoid `any` type
- Define interfaces for all data structures
- Use proper TypeScript generics

```typescript
// Good
interface Patient {
  patient_ID: number;
  first: string;
  last: string;
}

async function getPatient(id: number): Promise<Patient> {
  return await apiService.get<Patient>(`/Patient/${id}`);
}

// Bad
async function getPatient(id: any): Promise<any> {
  return await apiService.get(`/Patient/${id}`);
}
```

#### React Components
- Use functional components
- Prefer hooks over class components
- Use proper prop types
- Implement error boundaries

```typescript
// Good
interface Props {
  patient: Patient;
  onEdit: (patient: Patient) => void;
}

export default function PatientCard({ patient, onEdit }: Props) {
  return <div>...</div>;
}

// Bad
export default function PatientCard(props: any) {
  return <div>...</div>;
}
```

#### Naming Conventions
- **Components**: PascalCase (`PatientCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`usePatients.ts`)
- **Services**: camelCase with `.service` suffix (`api.service.ts`)
- **Types**: PascalCase (`Patient`, `Appointment`)
- **Constants**: UPPER_SNAKE_CASE (`API_CONFIG`)
- **Variables/Functions**: camelCase (`fetchPatients`)

---

### File Organization

```
Component Files:
- One component per file
- Related components in same folder
- Index file for barrel exports

Service Files:
- Grouped by domain (api, auth, ai)
- Export individual functions
- Central index.ts for exports

Type Files:
- Group related types
- Use clear naming
- Export from central types file
```

---

### Error Handling

```typescript
// API Calls
try {
  const data = await apiService.get<Patient[]>('/Patient');
  setPatients(data);
} catch (error) {
  console.error('Failed to fetch patients:', error);
  showAlert('error', 'Failed to load patients');
}

// Form Validation
const validateForm = () => {
  const errors: Record<string, string> = {};
  
  if (!formData.first) {
    errors.first = 'First name is required';
  }
  
  if (!formData.dob) {
    errors.dob = 'Date of birth is required';
  }
  
  return errors;
};
```

---

### Performance Best Practices

1. **Memoization**
   ```typescript
   const expensiveValue = useMemo(() => {
     return computeExpensiveValue(data);
   }, [data]);
   ```

2. **Lazy Loading**
   ```typescript
   const Modal = lazy(() => import('@/components/Modal'));
   ```

3. **Debouncing**
   ```typescript
   const debouncedSearch = useCallback(
     debounce((term: string) => {
       searchPatients(term);
     }, 300),
     []
   );
   ```

4. **Pagination**
   - Implement pagination for large lists
   - Load data on demand
   - Use virtual scrolling for very large lists

---

## Troubleshooting

### Common Issues

#### 1. Authentication Issues

**Problem**: "Authentication failed" or 401 errors

**Solutions**:
- Check if token is stored: `localStorage.getItem('token')`
- Verify token is not expired
- Check backend CORS settings
- Verify backend is running and accessible
- Check API_BASE_URL configuration

**Debug Steps**:
```typescript
// Check token
const token = localStorage.getItem('token');
console.log('Token:', token);

// Check token expiration
import { validateToken } from '@/services/auth.service';
console.log('Token validation:', validateToken());
```

---

#### 2. CORS Errors

**Problem**: "CORS policy blocked" errors in console

**Solutions**:
- Add frontend URL to backend CORS policy
- Ensure backend allows credentials
- Check HTTP vs HTTPS mismatch

**Backend Fix** (.NET):
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins(
                "http://localhost:3000",
                "https://your-vercel-app.vercel.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        });
});

app.UseCors("AllowFrontend");
```

---

#### 3. API Connection Issues

**Problem**: API calls failing or timing out

**Solutions**:
- Verify backend is running
- Check API_BASE_URL in environment variables
- Test API endpoints with Postman
- Check network tab in browser DevTools
- Verify firewall settings

**Test API**:
```bash
# Test backend connectivity
curl https://your-backend-url/Patient

# Or in browser console
fetch('https://your-backend-url/Patient', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
}).then(r => r.json()).then(console.log)
```

---

#### 4. Build Errors

**Problem**: Build fails on Vercel

**Common Causes**:
- TypeScript type errors
- ESLint errors
- Missing environment variables
- Import path issues

**Solutions**:
1. Run build locally: `npm run build`
2. Fix all TypeScript errors
3. Fix all ESLint errors (or disable specific rules)
4. Verify all imports use correct paths
5. Add environment variables in Vercel

**Disable ESLint Rule** (if needed):
```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  // ...
}, []);
```

---

#### 5. Token Expiration Issues

**Problem**: Users logged out unexpectedly

**Solutions**:
- Increase token expiration time in backend
- Implement token refresh mechanism
- Show warning before expiration
- Auto-save form data

**Token Warning Component**:
```typescript
import TokenExpirationWarning from '@/components/TokenExpirationWarning';

// Add to layout
<TokenExpirationWarning />
```

---

#### 6. Routing Issues

**Problem**: 404 errors or page not found

**Solutions**:
- Check file structure matches routes
- Verify dynamic routes use [id] syntax
- Ensure page.tsx files exist
- Check for typos in route names

**Route Structure**:
```
/dashboard/patients/[id] 
→ src/app/dashboard/patients/[id]/page.tsx
```

---

#### 7. State Management Issues

**Problem**: State not updating or inconsistent

**Solutions**:
- Use proper state setters
- Avoid direct state mutation
- Use useEffect dependencies correctly
- Consider using useCallback for functions

**Correct State Update**:
```typescript
// Bad
patients.push(newPatient);
setPatients(patients);

// Good
setPatients([...patients, newPatient]);
```

---

### Debug Mode

Enable debug logging:

```typescript
// In api.service.ts
private async handleResponse<T>(response: Response): Promise<T> {
  console.log('API Response:', {
    url: response.url,
    status: response.status,
    headers: response.headers
  });
  // ... rest of code
}
```

---

### Getting Help

**Resources**:
1. Check browser console for errors
2. Check Network tab in DevTools
3. Review backend logs
4. Check Vercel deployment logs
5. Review this documentation

**Error Reporting**:
When reporting issues, include:
- Error message
- Steps to reproduce
- Browser console logs
- Network request details
- Environment (local/production)

---

## API Endpoints Reference

### Authentication
```
POST /api/DoctorAuth/Register   - Register doctor
POST /api/DoctorAuth/Login      - Doctor login
POST /api/NurseAuth/Register    - Register nurse
POST /api/NurseAuth/Login       - Nurse login
```

### Patients
```
GET    /Patient           - Get all patients
GET    /Patient/{id}      - Get patient by ID
POST   /Patient           - Create patient
PUT    /Patient/{id}      - Update patient
DELETE /Patient/{id}      - Delete patient
```

### Doctors
```
GET    /Doctor            - Get all doctors
GET    /Doctor/{id}       - Get doctor by ID
POST   /Doctor            - Create doctor
PUT    /Doctor/{id}       - Update doctor
DELETE /Doctor/{id}       - Delete doctor
```

### Nurses
```
GET    /Nurse             - Get all nurses
GET    /Nurse/{id}        - Get nurse by ID
POST   /Nurse             - Create nurse
PUT    /Nurse/{id}        - Update nurse
DELETE /Nurse/{id}        - Delete nurse
```

### Appointments
```
GET    /Appointment                    - Get all appointments
GET    /Appointment/{id}               - Get appointment by ID
GET    /Appointment/patient/{id}       - Get patient appointments
POST   /Appointment                    - Create appointment
PUT    /Appointment/{id}               - Update appointment
DELETE /Appointment/{id}               - Delete appointment
```

### EHR
```
GET    /EHR                - Get all EHRs
GET    /EHR/{id}           - Get EHR by ID
GET    /EHR/patient/{id}   - Get patient EHRs
GET    /EHR/{id}/history   - Get EHR change history
POST   /EHR                - Create EHR
PUT    /EHR/{id}           - Update EHR
DELETE /EHR/{id}           - Delete EHR
```

### Supplies
```
GET    /Supply                        - Get all supplies
GET    /Supply/{id}                   - Get supply by ID
GET    /Supply/Category/{category}    - Get supplies by category
GET    /Supply/LowStock/{threshold}   - Get low stock supplies
POST   /Supply                        - Create supply
PUT    /Supply/{id}                   - Update supply
DELETE /Supply/{id}                   - Delete supply
```

### Stock Transactions
```
GET    /StockTransaction                - Get all transactions
GET    /StockTransaction/{id}           - Get transaction by ID
GET    /StockTransaction/Doctor/{id}    - Get doctor transactions
GET    /StockTransaction/Supply/{id}    - Get supply transactions
POST   /StockTransaction                - Create transaction
PUT    /StockTransaction/{id}           - Update transaction
DELETE /StockTransaction/{id}           - Delete transaction
```

---

## Security Considerations

### Authentication
- JWT tokens stored in localStorage
- Tokens expire after configured time
- Automatic logout on expiration
- Password requirements enforced

### Authorization
- Role-based access control (Doctor/Nurse)
- Backend validates all requests
- Frontend enforces UI restrictions
- Sensitive operations require doctor role

### Data Protection
- HTTPS required for production
- No sensitive data in URLs
- Proper error messages (no data leakage)
- Input validation on both client and server

### Best Practices
1. Never commit `.env.local` files
2. Use environment variables for sensitive data
3. Keep dependencies updated
4. Follow OWASP guidelines
5. Regular security audits

---

## Future Enhancements

### Planned Features
1. **Real-time Notifications**: WebSocket integration
2. **Mobile App**: React Native version
3. **Reporting Module**: Analytics and reports
4. **Billing System**: Invoice and payment tracking
5. **Lab Integration**: Lab results and orders
6. **Prescription Management**: Digital prescriptions
7. **Telemedicine**: Video consultations
8. **Patient Portal**: Patient self-service
9. **Multi-language Support**: Internationalization
10. **Dark Mode**: Theme switching

### Technical Improvements
1. **Offline Support**: Progressive Web App
2. **Performance Monitoring**: Analytics integration
3. **Error Tracking**: Sentry integration
4. **Automated Testing**: E2E tests with Cypress
5. **CI/CD Pipeline**: Automated testing and deployment
6. **Database Migration**: Version control for schema
7. **API Versioning**: Backward compatibility
8. **Caching Strategy**: Redis integration
9. **File Storage**: Cloud storage integration
10. **Backup System**: Automated backups

---

## License

This project is proprietary software. All rights reserved.

---

## Contact & Support

### Development Team
- **Frontend Developer**: Marwan Dorrah
- **Backend Developer**: [Backend Team]
- **Project Manager**: [PM Name]

### Repository
- **GitHub**: https://github.com/MarwanDorrah/Clinical-system-frontend

### Support
For issues and questions:
1. Check this documentation
2. Review troubleshooting section
3. Check GitHub issues
4. Contact development team

---

## Changelog

### Version 1.0.0 (December 2025)
- Initial release
- Complete patient management system
- EHR with full CRUD operations
- Appointment scheduling
- Inventory management
- AI-powered clinical tools
- Role-based access control
- Vercel deployment support
- Comprehensive documentation

### Fixes Applied During Deployment
- Fixed ESLint errors: Escaped quotes in appointments page
- Fixed TypeScript errors: Added registrationKey to auth types
- Fixed duplicate props in EHR edit page
- Fixed undefined appointmentId handling in nurse deletion
- Fixed ToothChart notation type (FDI to fdi)

---

## Acknowledgments

### Technologies Used
- Next.js Team for the framework
- Vercel for hosting platform
- Tailwind Labs for Tailwind CSS
- Lucide for icon library
- React Team for React library

### Contributors
- Marwan Dorrah - Frontend Development
- [Add other contributors]

---

**Last Updated**: December 20, 2025
**Version**: 1.0.0
**Documentation Version**: 1.0
