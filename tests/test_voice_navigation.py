import unittest

from routes import voice


class VoiceNavigationTests(unittest.TestCase):
    def test_tracker_tab_workouts_opens_workouts_view(self):
        self.assertEqual(
            voice._navigation_action("tracker tab workouts"),
            {
                "provider": "app",
                "action": "navigate",
                "route": "tracker",
                "view": "workouts",
                "answer": "Opening Workouts.",
            },
        )


if __name__ == "__main__":
    unittest.main()
