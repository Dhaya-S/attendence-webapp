Refine the existing Admin Console instead of redesigning it.

Do NOT regenerate the project from scratch.

Keep the existing design system, components, typography (Roboto), colors, spacing, Auto Layout, variables, and interaction model.

This prompt should MODIFY the existing project to align with the finalized product architecture.

────────────────────────────────────

SOURCE OF TRUTH

The attached Admin Mobile IA v1.3 and Organization IA are the single source of truth.

The Web application must follow the same Information Architecture, business rules, terminology, and navigation.

Do NOT invent new enterprise modules.

Desktop should be an extension of the mobile experience, not a different product.

────────────────────────────────────

REMOVE THESE MODULES COMPLETELY

Remove every reference to:

• Payroll
• Salary
• Salary Components
• Payslips
• PF
• ESI
• Tax
• Billing
• Licensing
• Marketplace
• Recruitment
• Platform Services
• Tenant Management
• Multi-tenant Administration

If these screens already exist, remove them from:

Navigation

Prototype

Quick Actions

Search

AI

Dashboard

Settings

Flows

────────────────────────────────────

REPLACE THE ADMIN NAVIGATION

The Admin Console must use this navigation hierarchy.

HOME

• My Space
• Team
• Organization

ATTENDANCE

LEAVE

MORE

Desktop may use a left sidebar instead of bottom navigation, but the structure must remain identical.

────────────────────────────────────

HOME

Workspace Tabs

• My Space
• Team
• Organization

Do not create separate dashboard modules outside this structure.

────────────────────────────────────

MY SPACE

Implement:

Dashboard

Approvals

Alerts

Announcements

Calendar

Dashboard should include

Greeting

Attendance Status

Today's Shift

Attendance Summary

Leave Summary

Pending Approvals

Organization Alerts

Active Tasks

Recent Announcements

Upcoming Holidays

Calendar Preview

Quick Actions

AI Summary

────────────────────────────────────

TEAM

Implement

Members

Feed

Announcements

Tasks

Approvals

Selecting any employee should open Employee Workspace.

Employee Workspace should contain

Profile

Department

Related Data

Attendance

Leave

Tasks

HR/Admin should be able to

Edit Employee

Transfer Department

Assign Manager

Assign Shift

Adjust Leave Balance

Deactivate Employee

────────────────────────────────────

ORGANIZATION

Use this exact structure.

Overview

Employees

Departments

Operations

Policies

Access Control

Announcements

Tasks

Reports

Do not move Access Control into Settings.

────────────────────────────────────

EMPLOYEES

Implement

Directory

Organization Tree

Inactive Employees

Directory supports

Search

Department Filter

Role Filter

Status Filter

Bulk Selection

Bulk Actions

Import

Export

Employee Detail

Edit Employee

Assign Manager

Assign Shift

Transfer Department

Deactivate

Restore

────────────────────────────────────

DEPARTMENTS

All Departments

Department Tree

Department Details

Overview

Employees

Configuration

Assign Department Head

────────────────────────────────────

OPERATIONS

Implement

Holiday Management

Shift Management

Location Management

Geo Fence

Approval Flow

Each section should support

Create

Edit

Delete

Assign

View Details

Bulk Actions

────────────────────────────────────

POLICIES

Implement

Leave Policy

Attendance Policy

Documents

Support

Organization

Department

Employee level assignments

────────────────────────────────────

ACCESS CONTROL

Implement exactly as follows.

Roles

Permissions

Approval Workflow

Authentication

Audit Logs

Roles

Create Role

Edit Role

Duplicate

Disable

Assign Users

Permissions

Permission Matrix grouped by module

Approval Workflow

Leave

Attendance

Work From Home

Authentication

Password Policy

Two-Factor Authentication

Session Timeout

Device Login

Audit Logs

Search

Filters

Export

Timeline

────────────────────────────────────

ATTENDANCE

Use only

Overview

Exceptions

Analytics

Overview

Present

Late

Leave

WFH

Absent

Exceptions

Missing Check-In

Missing Check-Out

Geo Fence Violations

Attendance Corrections

Analytics

Organization Trends

Department Trends

Monthly Trends

WFH Trends

────────────────────────────────────

LEAVE

Implement

Overview

Requests

Analytics

────────────────────────────────────

MORE

Implement

Profile

Notifications

Documents

History

Settings

Help & Support

Settings should ONLY contain

Theme

Language

Privacy

Security

Change Password

Do NOT place organization configuration here.

────────────────────────────────────

QUICK ACTIONS

Only include

Add Employee

Create Announcement

Create Task

Nothing else.

────────────────────────────────────

ONBOARDING FLOW

Replace the current onboarding.

Use

Login

↓

Create Organization

↓

Organization Details

↓

Locations

↓

Departments

↓

Department Heads

↓

Holiday Calendar

↓

Shift Creation

↓

Attendance Policy

↓

Leave Policy

↓

Approval Workflow

↓

Roles

↓

Permissions

↓

Add Employee

↓

Assign Manager

↓

Assign Shift

↓

Dashboard

────────────────────────────────────

WEB BEHAVIOR

Desktop should enhance the mobile IA.

Do NOT create additional modules.

Instead add

Split Views

Advanced Filters

Bulk Actions

Tables

Analytics

Export

Import

Keyboard Shortcuts

Resizable Panels

Drawers

Multi-column Layouts

────────────────────────────────────

INTERACTIONS

Every interaction should remain functional.

Every button

Every icon

Every row

Every card

Every tab

Every dropdown

Every menu

Every breadcrumb

Every notification

Every drawer

Every modal

Every quick action

Every AI action

must navigate to an existing screen or execute a meaningful workflow.

No dead links.

No placeholder pages.

────────────────────────────────────

Maintain the existing visual style.

Do not redesign the UI.

Only restructure the product to match the finalized Admin IA while preserving the current premium enterprise appearance.