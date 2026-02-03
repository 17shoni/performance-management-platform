from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    RegisterSerializer, UserSerializer, AttendanceSerializer,
    TaskSerializer, RatingSerializer, CustomTokenObtainPairSerializer,
)
from rest_framework.exceptions import PermissionDenied
from .models import Attendance, Task, Rating, User
from django.utils import timezone
from datetime import timedelta
from rest_framework.generics import ListCreateAPIView
from django.core.exceptions import ValidationError
from django.conf import settings
from django.contrib.auth import get_user_model



class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['supervisor', 'admin']
    

class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'employee'
    

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class ClockInView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmployee]

    def post(self, request):
        today = timezone.now().date()
        if Attendance.objects.filter(employee=request.user, date=today).exists():
            return Response({"detail": "Already clocked in today."}, status=status.HTTP_400_BAD_REQUEST)
        
        attendance = Attendance.objects.create(employee=request.user)
        return Response(AttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED)
    
class ClockOutView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmployee]

    def post(self, request):
        today = timezone.now().date()
        try:
            attendance = Attendance.objects.get(employee=request.user, date=today, clock_out__isnull=True)
            attendance.clock_out = timezone.now()
            attendance.save()
            return Response(AttendanceSerializer(attendance).data)
        except Attendance.DoesNotExist:
            return Response({"detail": "Clock_in not found."}, status=status.HTTP_400_BAD_REQUEST)
        

class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        user = self.request.user
        if user.role == 'employee':
            return Task.objects.filter(employee=user) # employee can only access their tasks
        elif user.role == 'supervisor':
            return Task.objects.filter(employee__supervisor=user) # supervisor can access their teams tasks
        elif user.role == 'admin':
            return Task.objects.all() # admins can see all tasks
        return Task.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user

        if user.role == 'employee':
            # employee  creates task for themselves 
            serializer.save(employee=user, created_by=user)

        elif user.role in ['supervisor', 'admin']:
            # supervisor/admin must provide employee id in task creation
            employee_id = self.request.data.get('employee_id')
            if not employee_id:
                raise ValidationError({"employee": "This field is required when assigning tasks."})
            try:
                employee = User.objects.get(id=employee_id, role='employee')
            except User.DoesNotExist:
                raise ValidationError({"employee": "Invalid or non-employee ID."})
            serializer.save(employee=employee, created_by=user)

        else:
            raise PermissionDenied("You cannot create tasks.")

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):  
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        # Everyone can read their own or supervised tasks
        if user.role == 'employee' and obj.employee != user:
            raise PermissionDenied("Not authorized to access this task")
        if user.role == 'supervisor' and obj.employee.supervisor != user:
            raise PermissionDenied("Not authorized to access this task")

        return obj

    def perform_update(self, serializer):
        task = self.get_object()
        user = self.request.user

        if user.role == 'employee':
            # employees can only complete their own tasks
            if 'completed_at' in self.request.data:
                now = timezone.now()
                task.completed_at = now
                task.status = 'completed'
                task.save(update_fields=['completed_at', 'status'])
                return Response(TaskSerializer(task).data)
            else:
                raise PermissionDenied("Employees can only mark tasks as completed.")

        elif user.role in ['supervisor', 'admin']:
            # supervisors/admins can fully update
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        raise PermissionDenied("Not authorized to update this task.")

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role in ['admin', 'supervisor'] or instance.employee == user:
            instance.delete()
        else:
            raise PermissionDenied("Not authorized to delete this task.")
        

class RatingCreateView(generics.CreateAPIView):
    serializer_class =  RatingSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSupervisor]

    def perform_create(self, serializer):
        task = serializer.validated_data['task']
        user = self.request.user

        if task.employee.supervisor != self.request.user and self.request.user.role != 'admin':
            raise PermissionDenied("You can only rate your team's tasks.")
        if task.status != 'completed':
            raise PermissionDenied("Task must be completed before rating.")
        
        if Rating.objects.filter(task=task, rated_by=user).exists():
            raise ValidationError({"detail": "You have already rated this task."})

        serializer.save(rated_by=self.request.user )


class AttendanceListView(generics.ListAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        employee_id = self.request.query_params.get('employee')

        if employee_id:
            # for viewing specific employee's attendance
            if user.role not in ['admin', 'supervisor']:
                self.permission_denied(self.request)

            try:
                target = User.objects.get(id=employee_id, role='employee')
            except User.DoesNotExist:
                raise ValidationError("Employee not found")

            if user.role == 'supervisor' and target.supervisor != user:
                raise PermissionDenied("Not authorized to view this employee")

            return Attendance.objects.filter(employee=target).order_by('-date')

        else:
            if user.role == 'employee':
                return Attendance.objects.filter(employee=user).order_by('-date')
            elif user.role == 'supervisor':
                return Attendance.objects.filter(employee__supervisor=user).order_by('-date')
            elif user.role == 'admin':
                return Attendance.objects.all().order_by('-date')
            return Attendance.objects.none()
    

class ReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        employee_id = request.query_params.get('employee')

        if employee_id:
            # viewing one specific employee only for supervisor/admin
            if user.role not in ['supervisor', 'admin']:
                return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

            try:
                target_employee = User.objects.get(id=employee_id, role='employee')
            except User.DoesNotExist:
                return Response({"detail": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

            # supervisor can only view their own team
            if user.role == 'supervisor' and target_employee.supervisor != user:
                return Response({"detail": "Not authorized to view this employee"}, status=status.HTTP_403_FORBIDDEN)

            attendances = Attendance.objects.filter(employee=target_employee)
            tasks = Task.objects.filter(employee=target_employee)
            ratings = Rating.objects.filter(task__employee=target_employee)

            # clear employee list when viewing one person
            employees = []

        else:
            if user.role == 'employee':
                attendances = Attendance.objects.filter(employee=user)
                tasks = Task.objects.filter(employee=user)
                ratings = Rating.objects.filter(task__employee=user)
                employees = []

            elif user.role == 'supervisor':
                attendances = Attendance.objects.filter(employee__supervisor=user)
                tasks = Task.objects.filter(employee__supervisor=user)
                ratings = Rating.objects.filter(task__employee__supervisor=user)
                employees = User.objects.filter(role='employee', supervisor=user)

            elif user.role == 'admin':
                attendances = Attendance.objects.all()
                tasks = Task.objects.all()
                ratings = Rating.objects.all()
                employees = User.objects.filter(role='employee')

            else:
                return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        # Attendance percentage 
        total_attendance = attendances.count()
        present_count = attendances.filter(clock_in__isnull=False).count()
        attendance_percent = round((present_count / total_attendance * 100), 1) if total_attendance > 0 else 0

        # On-time tasks percentage
        finished_tasks = tasks.filter(status='completed')
        on_time_count = 0
        for task in finished_tasks:
            if task.completed_at and task.deadline and task.completed_at.date() <= task.deadline:
                on_time_count += 1
        on_time_percent = round((on_time_count / finished_tasks.count() * 100), 1) if finished_tasks.count() > 0 else 0

        # Average rating 
        total_rating = 0
        rating_count = 0
        for r in ratings:
            total_rating += r.rating
            rating_count += 1
        average_rating = round(total_rating / rating_count, 1) if rating_count > 0 else 0

        result = {
            "attendance_percent": attendance_percent,
            "on_time_percent": on_time_percent,
            "average_rating": average_rating,
            "total_tasks": tasks.count(),
            "completed_tasks": finished_tasks.count(),
        }

        if not employee_id and user.role in ['supervisor', 'admin']:
            employee_stats = []
            for emp in employees:
                emp_tasks = tasks.filter(employee=emp)
                emp_completed = emp_tasks.filter(status='completed')
                emp_on_time = 0
                for t in emp_completed:
                    if t.completed_at and t.deadline and t.completed_at.date() <= t.deadline:
                        emp_on_time += 1

                emp_ratings = ratings.filter(task__employee=emp)
                emp_total = 0
                emp_count = 0
                for r in emp_ratings:
                    emp_total += r.rating
                    emp_count += 1
                emp_avg = round(emp_total / emp_count, 1) if emp_count > 0 else 0

                employee_stats.append({
                    "id": emp.id,
                    "username": emp.username,
                    "full_name": f"{emp.first_name} {emp.last_name}".strip() or emp.username,
                    "attendance_percent": 0,  
                    "on_time_percent": round((emp_on_time / emp_completed.count() * 100), 1) if emp_completed.count() > 0 else 0,
                    "average_rating": emp_avg,
                    "total_tasks": emp_tasks.count(),
                    "completed_tasks": emp_completed.count(),
                })

            result["employees"] = employee_stats

        return Response(result)

class NotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        alerts = []
        today = timezone.now().date()

        if user.role == 'employee':
            # deadline reminders (3 days or less)
            my_tasks = Task.objects.filter(employee=user)
            unfinished = my_tasks.filter(status__in=['pending', 'in_progress'])

            for task in unfinished:
                if task.deadline and task.deadline >= today:
                    days_left = (task.deadline - today).days
                    if 0 <= days_left <= 3:
                        alerts.append({
                            "title": "Task Deadline Approaching",
                            "message": f"Task '{task.title}' is due in {days_left} day{'s' if days_left != 1 else ''}!",
                            "task_id": task.id,
                            "days_left": days_left,
                            "read": False  
                        })

        elif user.role == 'supervisor':
            # pending ratings
            team_tasks = Task.objects.filter(employee__supervisor=user, status='completed')

            for task in team_tasks:
                if not task.task_ratings.filter(rated_by=user).exists():
                    employee_name = task.employee.username
                    alerts.append({
                        "title": "Pending Task Rating",
                        "message": f"Rate task '{task.title}' for {employee_name}",
                        "task_id": task.id,
                        "read": False
                    })

        if request.query_params.get('unread') == 'true':
            return Response({"count": len(alerts)})

        return Response({"alerts": alerts})
    

class UserListView(ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]  

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin': # admins see all employees
            return User.objects.all()
        if user.role == 'supervisor': # supervisors see  employees assigned to them
            return User.objects.filter(role='employee', supervisor=user)
        return User.objects.filter(id=user.id)
    

class UserDetailView(generics.RetrieveUpdateDestroyAPIView): # admins can also view, update or delete a user
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes =  [IsAdmin]


User = get_user_model()

class BootstrapAdminView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        token = request.headers.get("X-BOOTSTRAP-TOKEN")

        if token != settings.BOOTSTRAP_ADMIN_TOKEN:
            return Response(
                {"detail": "Invalid or expired bootstrap token"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if User.objects.filter(role="admin").exists():
            return Response(
                {"detail": "Admin already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin = User.objects.create_superuser(
            username=request.data["username"],
            email=request.data["email"],
            password=request.data["password"],
            role="admin",
        )

        return Response(
            {"detail": "Admin created successfully"},
            status=status.HTTP_201_CREATED,
        )



