# Konvergenz Software Development Challenge - Performance Management Platform
 ## Objective (from challenge PDF)
 Build a platform that tracks employee attendance, task completion, supervisor ratings, and provides an intuitive reporting dashboard.
 ## Implemented Features-
 **User Roles**:
 - Admin: Manage users, full access
 - Supervisor: Create/assign tasks, rate tasks, view team reports
 - Employee: Clock in/out, create/update/complete own tasks, view personal data
**Attendance**:
 - Clock-in/out with timestamps, hours worked calculation
**Tasks**:
 - CRUD (employees create own, supervisors assign), priority (optional), deadlines, completion status
**Ratings**:
 - 1–5 scale per task, only by supervisor
**Reports**:
 - Attendance %, on-time task %, average rating (personal/team/all)
**Notifications**
  (bonus): Alerts for nearing deadlines (employees) + pending ratings (supervisors) -
**Validation**:
  Deadline not in past, rating 1–5
## Tech Stack
 - Backend: Django 4+ / Django REST Framework / PostgreSQL / JWT (simplejwt) - Authentication: JWT tokens - Deployment: Render.com (free tier)
## Setup (Local)
  1. Clone repo
  2. cd backend
  3. python -m venv venv
  4. venv\Scripts\activate (Windows) or source venv/bin/activate (Mac/Linux)
  5. pip install -r requirements.txt
  6. Create PostgreSQL DB 'performance_db'
  7. Update core/settings.py DATABASES section
  8. python manage.py makemigrations
  9. python manage.py migrate
 10. python manage.py createsuperuser
 11. python manage.py runserver
## Key Endpoints 
 - POST /api/register/
 - POST /api/token/
 - POST /api/clock-in/
 - POST /api/clock-out/
 - GET/POST /api/tasks/
 - PATCH /api/tasks/<id>/
 - POST /api/ratings/
 - GET /api/reports/
 - GET /api/notifications/
 - GET /api/attendance/
 ## Live Deployment 
  Backend: https://performance-management-platform.vercel.app 
  Repo: https://github.com/17shoni/performance-management-platform 
 ## Notes
 - Role-based permissions enforced in views
 - Simple loop-based reports for clarity
 - Notifications implemented as bonus (GET endpoint) Victor – February2, 2026
 ## Admin credentials 
- username - admin001
- password - AdminPass123#
