Continue refining the existing Admin Web application.

Do NOT redesign the application.

Do NOT regenerate Login, Authentication, Onboarding, Global Navigation, My Space or Team.

Assume the administrator has completed onboarding and is using the application daily.

The attached Mobile IA is the ONLY source of truth.

Follow the Mobile IA exactly.

Desktop should only enhance the experience using desktop patterns such as:

• Data Tables
• Split Views
• Bulk Actions
• Advanced Filters
• Drawers
• Multi-column Layouts
• Context Menus

Never introduce new modules.

Never change the navigation hierarchy.

────────────────────────────────────

OBJECTIVE

Build the complete Organization module.

This module is the administration hub of the application.

It should allow administrators to configure and manage the organization while maintaining a clean, enterprise-grade experience.

The experience should feel similar to Atlassian Admin and Linear while using interaction ideas inspired by Zoho People.

Do NOT copy Zoho's UI or Information Architecture.

────────────────────────────────────

ORGANIZATION

Keep the Mobile IA exactly.

Overview

Employees

Departments

Operations

Policies

Access Control

Announcements

Reports

Do not add any additional top-level sections.

────────────────────────────────────

OVERVIEW

This should become the organization's control center.

Sections

Organization Profile

Organization Logo

Company Details

Industry

Employee Count

Branches

Locations

Working Days

────────────────

Organization Health

Setup Progress

Pending Configuration

Incomplete Policies

Pending Employee Invitations

Missing Department Heads

────────────────

Recent Activities

Employees Added

Departments Created

Policies Updated

Attendance Changes

System Activities

────────────────

Quick Actions

Add Employee

Create Department

Add Branch

Create Holiday

Create Shift

Invite Employee

────────────────

AI Assistant

Configuration Suggestions

Missing Setup Items

Recommended Actions

Smart Insights

────────────────────────────────────

EMPLOYEES

Desktop should use a split-view workspace.

LEFT PANEL

Employee Directory

Search

Department Filter

Branch Filter

Role Filter

Status Filter

Manager Filter

Employment Type

Advanced Filters

Saved Views

Bulk Selection

Bulk Actions

Import Employees

Export Employees

Pagination

RIGHT PANEL

Employee Workspace

Selecting an employee updates the workspace instantly.

Do not navigate away.

Employee Workspace

Overview

Profile

Attendance

Leave

Shift

Documents

History

Related Data

Quick Actions

Edit Employee

Assign Department

Assign Manager

Assign Shift

Reset Password

Deactivate Employee

Transfer Employee

Terminate Employee

Restore Employee

Everything should be interactive.

────────────────────────────────────

ADD EMPLOYEE

Create a complete multi-step wizard.

Personal Information

Employment Information

Department

Manager

Role

Shift

Attendance Policy

Leave Policy

Documents

Review

Create Employee

Support

Save Draft

Back

Next

Cancel

Preview

Validation

Duplicate Detection

Bulk Upload

CSV Import

────────────────────────────────────

DEPARTMENTS

Department Directory

Department Tree

Department Hierarchy

Department Details

Department Members

Department Head

Reporting Structure

Department Statistics

Department Timeline

Department Configuration

Quick Actions

Create Department

Assign Head

Move Employees

Merge Department

Archive Department

Restore Department

Import

Export

Bulk Actions

────────────────────────────────────

OPERATIONS

Follow the Mobile IA.

Holiday Management

Shift Management

Branch Management

Location Management

Geo Fence

Approval Flow

Each section should include

List View

Calendar View (where applicable)

Table View

Configuration

History

Activity Log

Create

Edit

Delete

Archive

Restore

Import

Export

────────────────────────────────────

SHIFT MANAGEMENT

Shift Templates

General Shift

Morning

Evening

Night

Flexible

Assign Employees

Weekly Schedule

Monthly Schedule

Shift History

Shift Timeline

────────────────────────────────────

HOLIDAY MANAGEMENT

Holiday Calendar

Regional Holidays

Branches

Departments

Recurring Holidays

Special Holidays

Import Holidays

Calendar Preview

────────────────────────────────────

POLICIES

Attendance Policy

Leave Policy

Documents

Policy Assignments

Department Assignment

Employee Assignment

Version History

Effective Dates

Approval Rules

────────────────────────────────────

ACCESS CONTROL

This is one of the most important modules.

Sections

Roles

Permissions

Approval Workflow

Authentication

Audit Logs

ROLES

Role Directory

Create Role

Edit Role

Duplicate Role

Disable Role

Assign Users

Role Comparison

PERMISSIONS

Permission Matrix

Grouped by module

View

Create

Edit

Delete

Approve

Export

Configure

Preview Access

APPROVAL WORKFLOW

Attendance

Leave

Department Change

Shift Change

Task Approval

Multi-Level Approval

Escalation Rules

AUTHENTICATION

Password Policy

Two Factor Authentication

Session Timeout

Device Login

Login History

AUDIT LOGS

Timeline

Configuration Changes

Permission Changes

Login Activity

Exports

Filters

Search

────────────────────────────────────

ANNOUNCEMENTS

Announcement Dashboard

Drafts

Published

Scheduled

Archived

Create Announcement

Audience Selection

Departments

Branches

Managers

Employees

Attachments

Preview

Schedule

Publish

Archive

────────────────────────────────────

REPORTS

Organization Summary

Employee Reports

Department Reports

Attendance Reports

Leave Reports

Task Reports

Announcement Reports

Custom Reports

Saved Reports

Scheduled Reports

Export

Print

AI Summary

────────────────────────────────────

DESKTOP ENHANCEMENTS

Desktop should improve the Mobile IA using

Split Views

Data Tables

Advanced Filters

Bulk Actions

Drawers

Inline Editing

Resizable Panels

Keyboard Shortcuts

Right Click Context Menu

Never create new modules.

────────────────────────────────────

INTERACTIONS

Every button should work.

Every table row should open details.

Every department should open its workspace.

Every employee should open its workspace.

Every filter should update data.

Every modal should connect.

Every drawer should open.

Every breadcrumb should navigate.

Every quick action should launch a workflow.

Every AI suggestion should perform an action.

Every import/export should have a complete flow.

No placeholder pages.

No dead links.

────────────────────────────────────

DESIGN PRINCIPLES

Use Roboto.

Maintain the existing design system.

Keep spacing consistent.

Use Auto Layout.

Use reusable components.

Maintain accessibility.

The Organization module should feel like a modern enterprise administration console that supports daily HR operations without unnecessary complexity.

Complete every screen, state, interaction, and workflow for the Organization module before proceeding to the next prompt.