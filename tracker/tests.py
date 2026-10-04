import json

from django.contrib.auth.models import User
from django.core import mail
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from .models import Feedback, StudySession


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    ADMIN_EMAIL='admin@example.com',
    DEFAULT_FROM_EMAIL='no-reply@example.com',
)
class FeedbackViewTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_feedback_submission_creates_record(self):
        response = self.client.post(reverse('tracker:feedback'), {
            'name': 'Asha',
            'email': 'asha@example.com',
            'message': 'Please add a weekly goals widget.',
        })

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Feedback.objects.count(), 1)
        feedback = Feedback.objects.get()
        self.assertEqual(feedback.name, 'Asha')
        self.assertEqual(feedback.upvotes, 0)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['admin@example.com'])
        self.assertIn('Asha', mail.outbox[0].body)
        self.assertIn('asha@example.com', mail.outbox[0].body)
        self.assertIn('Please add a weekly goals widget.', mail.outbox[0].body)
        self.assertIn('Submission time:', mail.outbox[0].body)

    def test_feedback_requires_message(self):
        response = self.client.post(reverse('tracker:feedback'), {
            'name': 'Asha',
            'email': 'asha@example.com',
            'message': '',
        })

        self.assertEqual(response.status_code, 400)
        self.assertContains(response, 'Please share a feedback message before submitting.', status_code=400)
        self.assertEqual(Feedback.objects.count(), 0)

    def test_feedback_upvote_increments_counter(self):
        feedback = Feedback.objects.create(message='Show more peer ideas')

        response = self.client.post(reverse('tracker:feedback_upvote', args=[feedback.id]))

        self.assertEqual(response.status_code, 302)
        feedback.refresh_from_db()
        self.assertEqual(feedback.upvotes, 1)


@override_settings(
    SECRET_KEY='test-secret-key',
    FRONTEND_URL='https://gate-tracker-wzwf.vercel.app',
)
class SecurityHardeningTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.user = User.objects.create_user(
            username='satya',
            email='manoharisatyasarthak@gmail.com',
            password='strong-password-123',
        )

    def _issue_csrf_token(self):
        response = self.client.get(reverse('tracker:api_csrf'))
        self.assertEqual(response.status_code, 200)
        token = response.json()['csrfToken']
        self.assertTrue(token)
        self.assertIn('csrftoken', response.cookies)
        return token

    def test_register_requires_csrf(self):
        response = self.client.post(
            reverse('tracker:api_register'),
            data=json.dumps({
                'username': 'newuser',
                'email': 'new@example.com',
                'password': 'strong-password-123',
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 403)

    def test_register_accepts_valid_csrf_token(self):
        token = self._issue_csrf_token()

        response = self.client.post(
            reverse('tracker:api_register'),
            data=json.dumps({
                'username': 'newuser',
                'email': 'new@example.com',
                'password': 'strong-password-123',
            }),
            content_type='application/json',
            HTTP_X_CSRFTOKEN=token,
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_save_session_requires_csrf(self):
        self.client.force_login(self.user)

        response = self.client.post(
            reverse('tracker:save_session'),
            data=json.dumps({
                'subject': 'DSA',
                'study_type': 'Theory',
                'duration_seconds': 3600,
                'questions_solved': 12,
                'lecture_minutes': 0,
                'notes_created': True,
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(StudySession.objects.count(), 0)

    def test_save_session_accepts_valid_csrf_token(self):
        self.client.force_login(self.user)
        token = self._issue_csrf_token()

        response = self.client.post(
            reverse('tracker:save_session'),
            data=json.dumps({
                'subject': 'DSA',
                'study_type': 'Theory',
                'duration_seconds': 3600,
                'questions_solved': 12,
                'lecture_minutes': 0,
                'notes_created': True,
            }),
            content_type='application/json',
            HTTP_X_CSRFTOKEN=token,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(StudySession.objects.count(), 1)

    def test_logout_requires_post(self):
        response = self.client.get(reverse('tracker:api_logout'))
        self.assertEqual(response.status_code, 405)

    def test_google_oauth_callback_rejects_invalid_state(self):
        session = self.client.session
        session['oauth_google_state'] = 'expected-state'
        session.save()

        response = self.client.get(
            reverse('tracker:oauth_google_callback'),
            {'code': 'demo-code', 'state': 'wrong-state'},
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response['Location'], 'https://gate-tracker-wzwf.vercel.app/?error=invalid_state')

    def test_github_oauth_start_sets_state_in_session(self):
        response = self.client.get(reverse('tracker:oauth_github_start'))

        self.assertEqual(response.status_code, 302)
        self.assertIn('state=', response['Location'])
        self.assertTrue(self.client.session.get('oauth_github_state'))


@override_settings(
    ALLOWED_HOSTS=['.onrender.com', 'localhost', '127.0.0.1'],
    USE_X_FORWARDED_HOST=False,
)
class RenderProxyTests(TestCase):
    def test_health_endpoint_ignores_internal_forwarded_host(self):
        response = self.client.get(
            reverse('tracker:api_health'),
            HTTP_HOST='gate-tracker-u3ut.onrender.com',
            HTTP_X_FORWARDED_HOST='2ddsm',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok'})
