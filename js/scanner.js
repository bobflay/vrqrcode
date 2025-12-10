// Scanner module
import { store, addDetectedCode, updateDuplicateTime, setScanning, hasCode } from './state.js';
import { playDetectionSound, playDuplicateSound } from './audio.js';
import { getElements, getCanvasContext, showScanning, showStopped, showError, addQRCodeToUI, showToast } from './ui.js';

let stream = null;
let scanIntervalId = null;
const SCAN_INTERVAL = 150;

export function initScanner() {
    const { startBtn, stopBtn } = getElements();
    startBtn.addEventListener('click', startScanning);
    stopBtn.addEventListener('click', stopScanning);
}

async function startScanning() {
    try {
        const { video, canvas } = getElements();

        stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always',
                displaySurface: 'monitor'
            },
            audio: false
        });

        video.srcObject = stream;

        video.onloadedmetadata = () => {
            video.play().then(() => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`);

                showScanning();
                setScanning(true);

                scanIntervalId = setInterval(scanForQRCodes, SCAN_INTERVAL);
            });
        };

        stream.getVideoTracks()[0].onended = () => {
            stopScanning();
        };

    } catch (err) {
        console.error('Error starting screen share:', err);
        showError('Failed to start screen sharing');
    }
}

export function stopScanning() {
    setScanning(false);

    if (scanIntervalId) {
        clearInterval(scanIntervalId);
        scanIntervalId = null;
    }

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    const { video } = getElements();
    video.srcObject = null;

    showStopped();
}

function scanForQRCodes() {
    const state = store.getState();
    const { video, canvas } = getElements();
    const ctx = getCanvasContext();

    if (!state.scanning || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
    }

    try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
        });

        if (code && code.data && code.data.trim() !== '') {
            handleDetectedCode(code.data);
        }
    } catch (err) {
        console.error('Error scanning for QR codes:', err);
    }
}

function handleDetectedCode(codeData) {
    const state = store.getState();

    if (!hasCode(codeData)) {
        console.log('QR Code detected:', codeData);
        const item = addDetectedCode(codeData);
        addQRCodeToUI(item);
        showToast('QR Code detected!');
        playDetectionSound();
    } else if (codeData !== state.lastDetectedCode || Date.now() - state.lastDuplicateSoundTime > 2000) {
        playDuplicateSound();
        updateDuplicateTime(codeData);
    }
}
