"""
Models for the GATE Study Intelligence Tracker.

StudySession: Records each individual study session with subject, type, duration, etc.
DailyStats:  Aggregated daily statistics per user, auto-updated when sessions are saved.
"""

from django.conf import settings
from django.db import models


class StudySession(models.Model):
    """Represents a single study session recorded by the timer."""

    # ── Subject choices (GATE CS/IT syllabus) ──
    SUBJECT_CHOICES = [
        ('DSA', 'Data Structures & Algorithms'),
        ('OS', 'Operating Systems'),
        ('COA', 'Computer Organization & Architecture'),
        ('DBMS', 'Database Management Systems'),
        ('DL', 'Digital Logic'),
        ('MATHS', 'Engineering Mathematics'),
        ('CN', 'Computer Networks'),
        ('TOC', 'Theory of Computation'),
        ('CD', 'Compiler Design'),
        ('SE', 'Software Engineering'),
        ('APT', 'Aptitude'),
    ]

    # ── Study type choices ──
    TYPE_CHOICES = [
        ('Theory', 'Theory'),
        ('Practice', 'Practice'),
        ('Lecture', 'Lecture'),
        ('Revision', 'Revision'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='study_sessions',
        null=True,          # allows migration without data loss
        blank=True,
    )
    date = models.DateField(auto_now_add=True, help_text="Date of the study session")
    subject = models.CharField(max_length=10, choices=SUBJECT_CHOICES)
    study_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    duration_minutes = models.FloatField(default=0, help_text="Duration in minutes (decimal)")
    questions_solved = models.IntegerField(default=0)
    lecture_minutes = models.IntegerField(default=0)
    notes_created = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        owner = self.user.username if self.user else '—'
        return f"{self.date} | {owner} | {self.get_subject_display()} | {self.study_type} | {self.duration_minutes:.0f} min"


class DailyStats(models.Model):
    """
    Aggregated statistics for a single day per user.
    Updated automatically whenever a StudySession is saved via the save_session view.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='daily_stats',
        null=True,
        blank=True,
    )
    date = models.DateField()
    total_study_time = models.FloatField(default=0, help_text="Total minutes studied")
    total_questions = models.IntegerField(default=0)
    total_lectures = models.IntegerField(default=0, help_text="Total lecture minutes")

    class Meta:
        ordering = ['-date']
        verbose_name_plural = "Daily Stats"
        # One row per user per date
        constraints = [
            models.UniqueConstraint(fields=['user', 'date'], name='unique_user_date')
        ]

    def __str__(self):
        owner = self.user.username if self.user else '—'
        return f"{self.date} — {owner} — {self.total_study_time:.0f} min studied"


class Feedback(models.Model):
    """Community-submitted product feedback and ideas."""

    name = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    upvotes = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        label = self.name or self.email or 'Anonymous'
        return f"{label}: {self.message[:50]}"

class VlogPost(models.Model):
    """Daily vlog posts for 'My GATE Journey'."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vlog_posts'
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    youtube_url = models.URLField(blank=True, null=True, help_text="Optional YouTube video URL")
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.date} - {self.title[:50]}"
