# Housekeeping Service Website - TODO

## Phase 1: Database Schema
- [x] Update database schema with services and bookings tables
- [x] Connect to existing Supabase database
- [x] Create database helper functions

## Phase 2: Authentication & User Management
- [x] Set up user authentication with Manus OAuth
- [x] Create user dashboard
- [x] Create admin dashboard with role-based access

## Phase 3: Service & Booking Management
- [x] Create services management interface (admin)
- [x] Create booking form for users
- [x] Implement booking list view
- [x] Add edit/cancel booking functionality

## Phase 4: Professional UI
- [x] Design landing page with service showcase
- [x] Create responsive navigation
- [x] Implement professional styling with Tailwind
- [x] Add service cards and booking flow

## Phase 5: Testing & Deployment
- [x] Test all features end-to-end
- [x] Create project checkpoint
- [x] Provide live URL and credentials

## Customization for BOB Home Care

### Branding & Services
- [x] Change brand name from CleanPro Services to BOB Home Care
- [x] Update color scheme to match BOB brand colors (green)
- [x] Replace dummy services with actual BOB services (no pricing)
- [x] Remove all price fields from database and UI

### Localization
- [x] Add Arabic language support (i18n)
- [x] Create Arabic translations for all pages
- [x] Add language switcher in header

### WhatsApp Integration
- [x] Add WhatsApp AI chat button/link for booking
- [x] Integrate WhatsApp chat functionality
- [x] Connect booking flow to WhatsApp

### GitHub Integration
- [ ] Clone existing BOB Home Care repository
- [ ] Merge booking system with existing website
- [ ] Push combined code to GitHub

## Final Checkpoint
- [x] All BOB Home Care customizations complete
- [x] Arabic/English language support working
- [x] WhatsApp integration functional
- [x] All tests passing
- [x] Ready for GitHub merge

## Issues to Fix
- [x] Debug blank page issue - website not loading properly
- [x] Simplify client booking flow - remove login requirement for booking
- [x] Create public booking form accessible from main website
- [x] Ensure clients can book without seeing admin dashboard

## New Issues Reported by User
- [x] Remove WhatsApp redirect from booking form submission (duplicate functionality)
- [x] Save bookings to database so they appear in admin dashboard
- [x] Add public booking status check page (no login required)
- [x] Add payment confirmation message: "Reservation will be confirmed after sending payment link"

## Dashboard Overlap Issue
- [x] Separate admin dashboard from client dashboard
- [x] Admin dashboard should show all bookings and service management
- [x] Client dashboard should only show customer's own bookings
- [x] Make routes clear: /admin for admin, /dashboard for clients

## Service Management Issue
- [x] Diagnose why service management is not working in admin dashboard
- [x] Fix service creation/editing functionality - added Arabic/English fields
- [x] Test service CRUD operations - all tests passing

## New Issues Reported
- [ ] Service management button not working in admin dashboard
- [ ] Client dashboard not visible/accessible - only admin dashboard showing
- [ ] Verify client dashboard route (/dashboard) is working
- [ ] Ensure regular users can access their dashboard

## Add Authentication Buttons
- [x] Add Sign In button to homepage header
- [x] Add Sign Up button to homepage header
- [x] Add Arabic translations for Sign In/Sign Up
- [x] Query and provide existing user credentials from database

## User Profile Dropdown Menu
- [x] Add user profile dropdown component to homepage header
- [x] Show user name and role in dropdown
- [x] Add "My Dashboard" link (routes to /dashboard for users, /admin for admins)
- [x] Add "Sign Out" button with logout functionality
- [x] Add Arabic translations for dropdown menu items
- [x] Replace Sign In/Sign Up buttons with dropdown when user is authenticated
- [x] Test dropdown functionality and write vitest tests

## User Profile Editing
- [x] Add phone field to users table in database schema
- [x] Create backend tRPC procedure for updating user profile
- [x] Create EditProfileDialog component with form fields (name, email, phone)
- [x] Add "Edit Profile" option to dropdown menu
- [x] Add Arabic translations for profile editing
- [x] Implement form validation and error handling
- [x] Write vitest tests for profile update functionality

## Booking History Preview in Dropdown
- [x] Create API to fetch user's upcoming bookings (next 2-3)
- [x] Add booking preview section to dropdown menu
- [x] Display booking details (service, date, status)
- [x] Add "View All" link to full dashboard
- [x] Add Arabic translations for booking preview

## Email Verification
- [x] Add emailVerified field to users table
- [x] Add verificationToken field to users table
- [x] Create backend API for sending verification emails
- [x] Create backend API for verifying email tokens
- [x] Add email verification banner/alert in profile dialog
- [x] Require email verification before profile updates
- [x] Add resend verification email functionality
- [x] Add Arabic translations for email verification
- [x] Write vitest tests for email verification flow
