# Project Brief: Parking Slot Reservation System

**Student:** MURUNGI Peace · **Reg. no.:** 223019597 · **Project #:** 51 · **Level:** Medium · **Category:** Transport · **Duration:** 4 weeks
**Stack:** Next.js (client) + Django REST (server) + Supabase (Postgres and login)

## My app helps drivers to reserve a parking slot in advance, and helps attendants to see who is parked where and how much money was earned.

## Users
| Role | What they can do |
|---|---|
| **Driver** | Sign up and log in, see which slots are free, reserve a slot for a time range, see and cancel their own reservations. |
| **Attendant** | Everything a driver sees, but for all drivers; add or remove slots; see revenue per day. |

## User stories (5 must-haves)
1. As a **driver**, I want to **see a map of free and occupied slots**, so that I **do not drive around looking for a place**.
2. As a **driver**, I want to **reserve a slot for a start and end time**, so that **it is waiting for me when I arrive**.
3. As a **driver**, I want to **be told clearly when my time clashes with another reservation**, so that **I can choose another time or slot**.
4. As a **driver**, I want to **see and cancel my own reservations**, so that **I do not pay for a slot I will not use**.
5. As an **attendant**, I want to **see all reservations and the revenue per day**, so that **I can manage the car park and report money collected**.

## Priorities (MoSCoW)
- **Must:** login with two roles, list slots with free/occupied map, create a reservation, no-overlap rule, fee from hours, list and detail of reservations.
- **Should:** cancel a reservation, revenue per day, pagination, role checks.
- **Could:** edit a reservation, email reminders, QR code at the gate.
- **Not now:** online payment, mobile app, number-plate camera.

## Three screens
1. **Login / Sign up**: email and password; tabs to switch.
2. **Parking map + reserve form**: green and red slots (list page), a form with slot, plate, from and until, and the estimated fee.
3. **Reservation detail**: slot, plate, times, fee and a Cancel button. (Attendants also have a Revenue page.)

## Business rules
- Two reservations for the same slot cannot overlap. Back-to-back (end = next start) is allowed.
- Fee = hours rounded **up** x 1000 RWF per hour. Calculated on the server, never trusted from the browser.
- A reservation lasts at most 24 hours, and cannot start in the past.
- A driver can only see and change their own reservations.

## Why this stack (3 reasons)
1. **Supabase gives login and a managed Postgres database for free.** I do not have to store or hash passwords myself, which removes a big security risk.
2. **Django REST Framework writes most of the API for me** (list, create, update, delete) and its serializers make validation easy, such as the overlap rule and clear 400 messages.
3. **A relational database fits the problem.** Slots, users and reservations are linked by keys, and Postgres can enforce "no overlap" itself with an exclusion constraint, a second safety net behind the Django check.

## One-sentence summary
Drivers reserve parking slots on a live map; the server stops double bookings and calculates the fee; attendants see all bookings and daily revenue.
