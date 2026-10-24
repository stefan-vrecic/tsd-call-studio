import datetime as dt
import unittest

from routes import day


class DayCacheTests(unittest.TestCase):
    def setUp(self):
        day._clear_day_cache()
        self.original_run = day._run

    def tearDown(self):
        day._run = self.original_run
        day._clear_day_cache()

    def test_current_window_day_is_cached_and_clear_invalidates_it(self):
        calls = []
        today = dt.datetime.now().astimezone().date().isoformat()

        def fake_run(args):
            calls.append(args)
            return {"date": args[-1], "events": []}

        day._run = fake_run
        self.assertEqual(day._read_day(today)["date"], today)
        self.assertEqual(day._read_day(today)["date"], today)
        self.assertEqual(len(calls), 1)
        day._clear_day_cache()
        day._read_day(today)
        self.assertEqual(len(calls), 2)

    def test_dates_outside_window_are_not_cached(self):
        calls = []
        outside = (dt.datetime.now().astimezone().date() + dt.timedelta(days=3)).isoformat()
        day._run = lambda args: calls.append(args) or {"date": args[-1], "events": []}
        day._read_day(outside)
        day._read_day(outside)
        self.assertEqual(len(calls), 2)


if __name__ == "__main__":
    unittest.main()
