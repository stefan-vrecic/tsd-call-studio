import json
import os
import tempfile
import unittest
from unittest import mock

import config
import manifests
import pipeline


class ReviewFailureRetentionTest(unittest.TestCase):
    def test_completed_transcript_keeps_manifest_when_ai_review_fails(self):
        with tempfile.TemporaryDirectory() as temp_dir, \
                mock.patch.object(config, "MANIFESTS_DIR", temp_dir), \
                mock.patch.object(pipeline, "_finish_pipeline", side_effect=RuntimeError("usage limit reached")):
            self.assertTrue(manifests.write_placeholder_manifest("Jane", "Jane.mp3", "writing_doc"))
            job = {"stage": "writing_doc", "percent": 96}

            pipeline._run_doc_stage(
                job, "Jane", "Jane.srt", "Jane.txt", "Jane.mp3", 60,
                None, "local whisper", True, True,
            )

            manifest_path = os.path.join(temp_dir, "Jane.json")
            self.assertTrue(os.path.exists(manifest_path))
            with open(manifest_path) as f:
                manifest = json.load(f)
            self.assertEqual(manifest["status"], "review_error")
            self.assertEqual(manifest["reviewError"], "usage limit reached")
            self.assertEqual(job["stage"], "error")


if __name__ == "__main__":
    unittest.main()
