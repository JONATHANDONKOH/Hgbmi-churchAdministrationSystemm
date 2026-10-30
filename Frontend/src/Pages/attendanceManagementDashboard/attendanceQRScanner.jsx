
import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const CHECK_IN_URL = `${API_BASE}/api/attendance/check-in`;
const READER_ID = 'hgbmi-attendance-qr-reader';

const styles = {
  page: {
    minHeight: '100%',
    padding: '24px',
    background: '#f8fafc',
    color: '#172033',
    boxSizing: 'border-box',
  },
  card: {
    maxWidth: '650px',
    margin: '0 auto',
    padding: '24px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '27px',
    fontWeight: 750,
  },
  subtitle: {
    color: '#64748b',
    lineHeight: 1.6,
    marginBottom: '22px',
  },
  button: {
    padding: '12px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#1d4ed8',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '11px 16px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    background: '#fff',
    color: '#334155',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    padding: '12px',
    marginBottom: '16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#b91c1c',
  },
  success: {
    padding: '14px',
    marginBottom: '16px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    color: '#166534',
  },
  info: {
    padding: '14px',
    marginTop: '18px',
    background: '#eff6ff',
    borderRadius: '8px',
    color: '#1e40af',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  scanner: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: '10px',
  },
};

function getMessage(data, fallback) {
  return data?.error || data?.message || fallback;
}

export default function AttendanceQRScanner() {
  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  const [cameraRunning, setCameraRunning] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastRecord, setLastRecord] = useState(null);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      if (mountedRef.current) {
        setCameraRunning(false);
      }
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (err) {
      console.warn('Unable to stop QR scanner cleanly:', err);
    }

    try {
      scanner.clear();
    } catch (err) {
      console.warn('Unable to clear QR scanner:', err);
    }

    scannerRef.current = null;

    if (mountedRef.current) {
      setCameraRunning(false);
    }
  }, []);

  const submitCheckIn = useCallback(
    async (decodedText) => {
      if (processingRef.current) return;

      processingRef.current = true;

      if (mountedRef.current) {
        setCheckingIn(true);
        setError('');
        setSuccess('');
      }

      // Stop scanning so the same QR code is not submitted repeatedly.
      await stopCamera();

      try {
        const response = await fetch(CHECK_IN_URL, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            qrToken: decodedText.trim(),
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getMessage(data, 'Unable to check in. Please try again.')
          );
        }

        if (mountedRef.current) {
          setLastRecord(data?.record || null);
          setSuccess(
            data?.message || 'Attendance check-in successful!'
          );
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(
            err.message ||
              'Check-in failed. Please scan a valid attendance QR code.'
          );
        }
      } finally {
        processingRef.current = false;

        if (mountedRef.current) {
          setCheckingIn(false);
        }
      }
    },
    [stopCamera]
  );

  const startCamera = useCallback(async () => {
    if (startingCamera || cameraRunning || checkingIn) return;

    setError('');
    setSuccess('');
    setLastRecord(null);
    setStartingCamera(true);

    try {
      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (!processingRef.current) {
            submitCheckIn(decodedText);
          }
        },
        () => {
          // QR codes are not expected in every camera frame.
          // Ignore ordinary scan misses.
        }
      );

      if (mountedRef.current) {
        setCameraRunning(true);
      }
    } catch (err) {
      console.error('Start attendance scanner error:', err);

      const detail =
        err?.message || 'Camera access was denied or is unavailable.';

      await stopCamera();

      if (mountedRef.current) {
        setError(
          `${detail} Allow camera access and use HTTPS, or open the app on localhost.`
        );
      }
    } finally {
      if (mountedRef.current) {
        setStartingCamera(false);
      }
    }
  }, [
    cameraRunning,
    checkingIn,
    startingCamera,
    stopCamera,
    submitCheckIn,
  ]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const scanner = scannerRef.current;

      if (scanner) {
        const cleanup = async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch (err) {
            console.warn('Scanner cleanup error:', err);
          }

          try {
            scanner.clear();
          } catch (err) {
            console.warn('Scanner clear error:', err);
          }

          scannerRef.current = null;
        };

        cleanup();
      }
    };
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Attendance QR Scanner</h1>

        <p style={styles.subtitle}>
          Scan the QR code displayed by your fellowship leader to
          record your attendance. You must be logged in and belong
          to the fellowship.
        </p>

        {error && (
          <div role="alert" style={styles.error}>
            <strong>Check-in issue</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </div>
        )}

        {success && (
          <div role="status" style={styles.success}>
            <strong>{success}</strong>

            {lastRecord && (
              <p style={{ marginBottom: 0 }}>
                Attendance status: {lastRecord.status}
              </p>
            )}
          </div>
        )}

        <div id={READER_ID} style={styles.scanner} />

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '20px',
          }}
        >
          {!cameraRunning ? (
            <button
              type="button"
              style={{
                ...styles.button,
                opacity:
                  startingCamera || checkingIn ? 0.6 : 1,
              }}
              onClick={startCamera}
              disabled={startingCamera || checkingIn}
            >
              {startingCamera
                ? 'Opening camera...'
                : checkingIn
                  ? 'Checking in...'
                  : 'Open camera and scan'}
            </button>
          ) : (
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={stopCamera}
            >
              Stop camera
            </button>
          )}

          {success && (
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                setSuccess('');
                setError('');
                setLastRecord(null);
              }}
            >
              Scan another code
            </button>
          )}
        </div>

        <div style={styles.info}>
          <strong>Before you scan</strong>
          <ul>
            <li>Sign in to your HGBMI account first.</li>
            <li>Allow camera permission when prompted.</li>
            <li>Ask your leader for a current QR code.</li>
            <li>
              If the code has expired, ask your leader to generate
              a fresh one.
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
