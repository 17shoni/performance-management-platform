from rest_framework import serializers
from .models import User, Attendance, Task, Rating, User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'supervisor', 'password',]
        read_only_fields = ['id'] 

    password = serializers.CharField(write_only=True, required=False)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2', 'first_name', 'last_name', 'role')
        read_only_fields = ('id',)
        extra_kwargs = {'role': {'required': True}}

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        return attrs

    def validate_role(self, value):
        if value != 'employee':
            raise serializers.ValidationError("Only 'employee' role is allowed during public registration. Contact an admin for other roles.")
        return value

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user
    

class AttendanceSerializer(serializers.ModelSerializer):
    employee = serializers.StringRelatedField(read_only=True)
    time_worked = serializers.ReadOnlyField()

    class Meta:
        model = Attendance
        fields = ['id', 'employee', 'clock_in', 'clock_out', 'date', 'time_worked']
        read_only_fields = ['employee', 'date', 'time_worked']


class TaskSerializer(serializers.ModelSerializer):
    employee = serializers.StringRelatedField()
    employee_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role='employee'),source='employee',write_only=True,required=False)
    created_by = serializers.StringRelatedField(read_only=True)
    on_time = serializers.SerializerMethodField()
    completed_at = serializers.DateTimeField(read_only=True)
    status = serializers.ChoiceField(choices=Task.STATUS, required=False)

    priority = serializers.ChoiceField(
        choices=Task.PRIORITY_CHOICES,
        default='medium',
        required=False
    )

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'employee', 'employee_id', 'created_by', 
            'deadline', 'completed_at', 'status', 'created_at', 'on_time', 'priority'
        ]
        read_only_fields = ['id', 'created_by','created_at', 'on_time', 'status', 'completed_at']

    def get_employee(self, obj):
        if not obj.employee:
            return None
        return {
            'id': obj.employee.id,
            'username': obj.employee.username,
            'first_name': obj.employee.first_name,
            'last_name': obj.employee.last_name,
        }

    def get_on_time(self, obj):
        return obj.on_time()
    
    def validate_deadline(self, value):
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Deadline cannot be in the past.")
        return value
    

class RatingSerializer(serializers.ModelSerializer):
    task = serializers.PrimaryKeyRelatedField(queryset=Task.objects.all())
    rated_by = serializers.StringRelatedField(read_only=True)
    rating = serializers.IntegerField(min_value=1, max_value=5)

    class Meta:
        model = Rating
        fields = ['id', 'task', 'rated_by', 'comment', 'rating', 'created_at']
        read_only_fields = ['rated_by', 'created_at']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        
        token['username'] = user.username
        token['role'] = user.role

        return token
    

