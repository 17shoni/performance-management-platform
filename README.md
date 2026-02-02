# performance-management-platform

Performance Management Platform is a role-based system designed to track employee attendance, task completion, and supervisor ratings.

User Roles

Admin – Manage users, access all reports

Supervisor – Rate tasks, view team performance

Employee – Log attendance, manage tasks


Architecture
React (Vite + Tailwind)
        ↓
REST API (Django + DRF)
        ↓
PostgreSQL Database


Frontend: React, Tailwind CSS, Vite

Backend: Django REST Framework

Auth: JWT Authentication

DB: PostgreSQL

Deployment: Vercel + Railway

Setup Instructions (Local)
Backend

cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

Frontend
cd frontend
npm install
npm run dev
