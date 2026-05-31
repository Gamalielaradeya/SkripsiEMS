"""
classify_status.py — Klasifikasi status termal berdasarkan prediksi suhu S2.
"""

def classify(predicted_temp: float, threshold_normal_max: float, threshold_anomaly_min: float) -> str:
    """
    Klasifikasi status berdasarkan suhu prediksi S2.

    Args:
        predicted_temp:      Suhu prediksi LSTM (°C)
        threshold_normal_max: Batas atas suhu NORMAL (default 30.0°C)
        threshold_anomaly_min: Batas bawah suhu ANOMALI (default 32.0°C)

    Returns:
        'normal' | 'waspada' | 'anomali'
    """
    if predicted_temp < threshold_normal_max:
        return "normal"
    elif predicted_temp <= threshold_anomaly_min:
        return "waspada"
    else:
        return "anomali"
