from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('supervisor', 'Supervisor'),
        ('employee', 'Employee'),
    )

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='employee')
    supervisor = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='employees',
        limit_choices_to={'role': 'supervisor'}
    )

    def __str__(self):
        return self.username

class Attendance(models.Model):
    employee = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'employee'},
        related_name='attendances'
    )
    clock_in = models.DateTimeField(default=timezone.now)
    clock_out = models.DateTimeField(null=True, blank=True)
    date = models.DateField(default=timezone.now)

    class Meta:
        unique_together = ('employee', 'date')
        ordering =  ['-date', '-clock_in']

    def __str__(self):
        return f"{self.employee} - {self.date}"
    
    def clean(self):
        if self.clock_out and self.clock_out < self.clock_in:
            raise ValidationError("The clock out time cannot be before the clock in time")
        
    def save(self, *args, **kwargs):
        self.full_clean() # validation run
        super().save(*args, **kwargs)

    @property
    def time_worked(self):
        if not self.clock_out:
            return None
        time_difference = self.clock_out - self.clock_in
        return round(time_difference.total_seconds() / 3600, 2) # display time in hours to nearest 2dp
    

class Task(models.Model):
    STATUS = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
    )

    PRIORITY_CHOICES = (
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    )

    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Priority level of the task"
    )

    title = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    employee = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='assigned_tasks',
        limit_choices_to={'role': 'employee'}
    )
    created_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks'
    )
    created_at = models.DateTimeField(auto_now_add=True,)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=25, choices=STATUS, default='pending')
    deadline = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.employee}"
    
    def on_time(self):
        if not self.completed_at or not self.deadline:
            return None
        return self.completed_at.date() <= self.deadline
    
    def update_status(self):
        if self.completed_at:
            self.status = 'completed'
        elif self.deadline and self.deadline < timezone.now().date() and not self.completed_at:
            self.status = 'overdue'
        else:
            self.status = 'in_progress' if self.status == 'pending' else self.status

    def save(self, *args, **kwargs):
        # always update status before saving
        self.update_status()
        super().save(*args, **kwargs)

class Rating(models.Model):
    RATINGS_SCALE = [(i, str(i)) for i in range(1, 6)] # rating scale is from 1 - 5

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='task_ratings'
    )

    rated_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        limit_choices_to={'role': 'supervisor'},
        related_name='given_ratings'
    )
    rating = models.PositiveSmallIntegerField(choices=RATINGS_SCALE)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('task', 'rated_by')
        ordering = ['-created_at']

    def __str__(self):
        return f"The rating is {self.rating}/5 for {self.task}"
    


