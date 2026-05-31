import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np
import pandas as pd

SRC_DIR = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC_DIR))

from baseline import moving_average_model, persistence_model
from classify_status import classify
from config import Config, PROJECT_DIR
from load_dataset import _build_query
from inference import notify_backend, parse_runtime_thresholds
from windowing import build_windows, chronological_split, fit_and_scale_windows


class StatusClassificationTest(unittest.TestCase):
    def test_threshold_boundaries_follow_research_rules(self):
        self.assertEqual(classify(29.99, 30.0, 32.0), "normal")
        self.assertEqual(classify(30.0, 30.0, 32.0), "waspada")
        self.assertEqual(classify(32.0, 30.0, 32.0), "waspada")
        self.assertEqual(classify(32.01, 30.0, 32.0), "anomali")


class DatasetQueryTest(unittest.TestCase):
    def test_limited_query_selects_latest_rows_then_restores_time_order(self):
        query, params = _build_query(30)
        normalized = " ".join(query.split())

        self.assertIn("ORDER BY sr.recorded_at DESC LIMIT %s", normalized)
        self.assertTrue(normalized.endswith("ORDER BY recorded_at ASC"))
        self.assertEqual(params, (30,))


class ConfigPathTest(unittest.TestCase):
    def test_default_model_paths_are_relative_to_ml_worker_root(self):
        self.assertTrue(Config.MODEL_DIR.startswith(PROJECT_DIR))
        self.assertTrue(Config.SCALER_DIR.startswith(PROJECT_DIR))


class BackendCallbackTest(unittest.TestCase):
    @patch("inference.requests.post")
    def test_callback_uses_internal_endpoint_and_worker_token(self, post):
        post.return_value = SimpleNamespace(status_code=202, text="")
        cfg = SimpleNamespace(
            BACKEND_URL="http://localhost:8080/",
            ML_WORKER_API_TOKEN="worker-secret",
        )

        ok = notify_backend(cfg, prediction_id=10, anomaly_event_id=11)

        self.assertTrue(ok)
        post.assert_called_once_with(
            "http://localhost:8080/api/v1/ml/inference-events",
            headers={
                "Authorization": "Bearer worker-secret",
                "Content-Type": "application/json",
            },
            json={"prediction_id": 10, "anomaly_event_id": 11},
            timeout=10,
        )


class RuntimeThresholdTest(unittest.TestCase):
    def test_runtime_thresholds_override_defaults(self):
        thresholds = parse_runtime_thresholds(
            [("threshold_normal_max", "29.5"), ("threshold_anomaly_min", "31.5")],
            30.0,
            32.0,
        )

        self.assertEqual(thresholds, (29.5, 31.5))

    def test_runtime_thresholds_reject_invalid_order(self):
        with self.assertRaises(ValueError):
            parse_runtime_thresholds(
                [("threshold_normal_max", "33"), ("threshold_anomaly_min", "32")],
                30.0,
                32.0,
            )


class WindowingTest(unittest.TestCase):
    def test_build_windows_and_chronological_split_keep_order(self):
        df = pd.DataFrame(
            {
                "temperature_s1": np.arange(8),
                "humidity_s1": np.arange(10, 18),
                "temperature_s2": np.arange(20, 28),
                "humidity_s2": np.arange(30, 38),
                "target_temp_s2": np.arange(40, 48),
            }
        )
        X, y = build_windows(df, window_size=3)
        X_train, X_test, y_train, y_test = chronological_split(X, y, test_ratio=0.4)

        self.assertEqual(X.shape, (5, 3, 4))
        self.assertEqual(y.tolist(), [43, 44, 45, 46, 47])
        self.assertLess(X_train[-1, -1, 0], X_test[0, -1, 0])
        self.assertLess(y_train[-1], y_test[0])

    def test_scalers_fit_train_only_and_target_inverse_is_correct(self):
        X_train = np.array(
            [
                [[0.0, 0.0, 0.0, 0.0], [10.0, 10.0, 10.0, 10.0]],
                [[2.0, 2.0, 2.0, 2.0], [8.0, 8.0, 8.0, 8.0]],
            ]
        )
        X_test = np.array([[[100.0, 100.0, 100.0, 100.0], [120.0, 120.0, 120.0, 120.0]]])
        y_train = np.array([20.0, 30.0])
        y_test = np.array([40.0])

        _, X_test_scaled, _, y_test_scaled, _, target_scaler = fit_and_scale_windows(
            X_train, X_test, y_train, y_test
        )

        self.assertGreater(X_test_scaled.max(), 1.0)
        self.assertGreater(y_test_scaled.max(), 1.0)
        restored = target_scaler.inverse_transform(y_test_scaled.reshape(-1, 1)).reshape(-1)
        np.testing.assert_allclose(restored, y_test)


class BaselineTest(unittest.TestCase):
    def test_baselines_use_only_input_window(self):
        X_test = np.zeros((2, 5, 4))
        X_test[0, :, 2] = [20, 21, 22, 23, 24]
        X_test[1, :, 2] = [30, 31, 32, 33, 34]

        np.testing.assert_allclose(persistence_model(X_test), [24, 34])
        np.testing.assert_allclose(moving_average_model(X_test, window=3), [23, 33])


if __name__ == "__main__":
    unittest.main()
