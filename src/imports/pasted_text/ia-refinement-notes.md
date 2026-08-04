Refine the existing Admin Web application.

Do NOT redesign the application.

Do NOT regenerate onboarding, authentication, global navigation, design system, components, colors, typography, or layouts.

Maintain the current design language, Roboto typography, Auto Layout, reusable components, spacing, variables, and interactions.

This is an Information Architecture refinement only.

────────────────────────────────────

OBJECTIVE

Separate SELF-SERVICE features from ORGANIZATION MANAGEMENT.

The application should clearly distinguish:

• My Data (Self)
• Organization Data (Administration)

The Mobile IA remains the source of truth.

Do NOT change the left sidebar navigation.

Instead, reorganize content inside My Space and Organization.

────────────────────────────────────

MY SPACE

Transform My Space into a complete self-service workspace.

Replace the current tabs with:

Overview

Attendance

Leave

Calendar

Tasks

Approvals

Activities

Files

Career History

Delegation

────────────────────────────────────

OVERVIEW

Overview should become today's workspace.

Only include

Today's Attendance

Pending Approvals

Today's Tasks

Recent Activities

Quick Actions

No announcements.

No organization summaries.

No birthdays.

No upcoming events.

No analytics.

No sidebars.

────────────────────────────────────

ATTENDANCE (MY ATTENDANCE)

This page should display ONLY the logged-in administrator's attendance.

Do NOT display organization attendance.

Include

Attendance Summary

Check In

Check Out

Current Shift

Attendance Timeline

Attendance History

Attendance Calendar

Working Hours

Late Arrivals

Early Check-Out

Attendance Statistics

Monthly Summary

Weekly Summary

Desktop Views

Timeline

List

Calendar

Table

Filters

Date

Month

Year

Everything displayed belongs only to the logged-in user.

────────────────────────────────────

LEAVE (MY LEAVE)

This page should display ONLY the logged-in administrator's leave information.

Include

Leave Balance

Leave Requests

Apply Leave

Leave Calendar

Upcoming Leave

Leave History

Approval Status

Leave Timeline

Filters

Date

Leave Type

Status

Calendar View

Everything displayed belongs only to the logged-in user.

────────────────────────────────────

CALENDAR

Create a unified calendar.

The calendar should display

My Leave

Team Leave

Company Holidays

Birthdays

Work Anniversaries

Meetings

Events

Shift Schedule

Training

Filter Panel

Departments

Event Types

Branches

Employees

Month

Week

Day

Agenda

Clicking an event should open the related details.

────────────────────────────────────

TASKS

Display only my tasks.

Assigned

In Progress

Completed

Overdue

Archived

Task Details

Comments

Attachments

Priority

Timeline

Calendar

────────────────────────────────────

APPROVALS

Display only approvals assigned to me.

Attendance

Leave

Department Requests

Shift Requests

Task Approvals

History

Approve

Reject

Comment

────────────────────────────────────

ACTIVITIES

Timeline of personal activities.

Attendance

Leave

Tasks

Approvals

Department Changes

Profile Updates

────────────────────────────────────

FILES

Only my documents.

Certificates

Offer Letter

Letters

Policies

Downloads

Uploads

────────────────────────────────────

CAREER HISTORY

Employment Timeline

Department Changes

Designation Changes

Manager Changes

Promotion History

Achievements

────────────────────────────────────

DELEGATION

Current Delegations

Past Delegations

Upcoming Delegations

Create Delegation

Edit

Cancel

History

────────────────────────────────────

ORGANIZATION

Keep the existing Organization module.

However, Attendance and Leave inside Organization should now represent ORGANIZATION-WIDE management.

────────────────

Organization → Attendance

Employee Attendance

Attendance Exceptions

Attendance Corrections

Attendance Analytics

Attendance Reports

Attendance Policies

Shift Assignment

Bulk Operations

────────────────

Organization → Leave

Leave Requests

Leave Calendar

Leave Analytics

Leave Policies

Department Leave

Employee Leave

Bulk Approval

Reports

────────────────────────────────────

NAVIGATION

Do NOT change the left sidebar.

Keep

My Space

Team

Organization

Attendance

Leave

Tasks

Documents

Settings

Help & Support

However,

When opening Attendance or Leave from My Space, always show MY information.

When opening Organization Attendance or Organization Leave, always show ORGANIZATION information.

Never mix personal data with organization data.

────────────────────────────────────

DESIGN PRINCIPLES

My Space = Self Service

Team = Team Collaboration

Organization = Administration

Ensure every interaction, filter, table, calendar, timeline, approval, and detail page follows this principle.

Maintain the current design system.

Maintain responsiveness.

Maintain production-quality interactions.

Do not regenerate unrelated screens.

Only refactor the Information Architecture and navigation flow to separate SELF and ORGANIZATION contexts while preserving the existing visual design.