from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView,
    ClockInView, ClockOutView, TaskListCreateView, TaskDetailView,
    RatingCreateView, AttendanceListView, ReportView, NotificationsView,
    UserListView,UserDetailView, MeView, BootstrapAdminView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('clock-in/', ClockInView.as_view(), name='clock_in'),
    path('clock-out/', ClockOutView.as_view(), name='clock_out'),
    path('tasks/', TaskListCreateView.as_view(), name='task_list_create'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task_detail'),
    path('ratings/', RatingCreateView.as_view(), name='rating_create'),
    path('attendance/', AttendanceListView.as_view(), name='attendance_list'),
    path('reports/', ReportView.as_view(), name='reports'),
    path('notifications/', NotificationsView.as_view(), name='notifications'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('me/', MeView.as_view(), name='me'),
    path('bootstrap-admin/', BootstrapAdminView.as_view(), name='bootstrap-admin')
]