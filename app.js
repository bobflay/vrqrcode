const video = document.getElementById('screenVideo');
const canvas = document.getElementById('scanCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const placeholder = document.getElementById('placeholder');
const status = document.getElementById('status');
const qrList = document.getElementById('qrList');
const countBadge = document.getElementById('countBadge');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');

let stream = null;
let scanning = false;
let detectedCodes = new Set();
let qrItems = [];
let scanInterval = null;

startBtn.addEventListener('click', startScanning);
stopBtn.addEventListener('click', stopScanning);
clearBtn.addEventListener('click', clearList);

async function startScanning() {
    try {
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always'
            },
            audio: false
        });

        video.srcObject = stream;
        video.style.display = 'block';
        placeholder.style.display = 'none';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
        status.textContent = 'Scanning for QR codes...';
        status.className = 'status scanning';
        scanning = true;

        // Handle stream ending (user clicks "Stop sharing" in browser)
        stream.getVideoTracks()[0].onended = () => {
            stopScanning();
        };

        // Wait for video to be ready
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            scanInterval = setInterval(scanForQRCodes, 200);
        };

    } catch (err) {
        console.error('Error starting screen share:', err);
        status.textContent = 'Failed to start screen sharing';
        status.className = 'status idle';
    }
}

function stopScanning() {
    scanning = false;

    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    video.srcObject = null;
    video.style.display = 'none';
    placeholder.style.display = 'block';
    startBtn.style.display = 'flex';
    stopBtn.style.display = 'none';
    status.textContent = 'Scanning stopped';
    status.className = 'status idle';
}

function scanForQRCodes() {
    if (!scanning || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
    });

    if (code && code.data && !detectedCodes.has(code.data)) {
        detectedCodes.add(code.data);
        addQRCodeToList(code.data);
        showToast('QR Code detected!');
    }
}

function addQRCodeToList(data) {
    const item = {
        id: Date.now(),
        data: data,
        time: new Date().toLocaleTimeString()
    };
    qrItems.unshift(item);

    emptyState.style.display = 'none';
    countBadge.textContent = qrItems.length;

    const itemElement = document.createElement('div');
    itemElement.className = 'qr-item';
    itemElement.innerHTML = `
        <div class="qr-item-header">
            <span class="qr-item-number">#${qrItems.length}</span>
            <span class="qr-item-time">${item.time}</span>
        </div>
        <div class="qr-item-content">${escapeHtml(data)}</div>
        <div class="qr-item-actions">
            <button class="copy-btn" onclick="copyToClipboard('${escapeForAttribute(data)}', this)">
                Copy
            </button>
            ${isValidUrl(data) ? `<button onclick="window.open('${escapeForAttribute(data)}', '_blank')">Open Link</button>` : ''}
        </div>
    `;

    qrList.insertBefore(itemElement, qrList.firstChild);
}

function clearList() {
    qrItems = [];
    detectedCodes.clear();
    qrList.innerHTML = '';
    emptyState.style.display = 'block';
    qrList.appendChild(emptyState);
    countBadge.textContent = '0';
}

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
            button.textContent = 'Copy';
            button.classList.remove('copied');
        }, 2000);
    });
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeForAttribute(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}
