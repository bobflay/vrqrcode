// UI module
import { store, clearCodes } from './state.js';

// DOM Elements
let elements = {};

export function initUI() {
    elements = {
        video: document.getElementById('screenVideo'),
        canvas: document.getElementById('scanCanvas'),
        startBtn: document.getElementById('startBtn'),
        stopBtn: document.getElementById('stopBtn'),
        clearBtn: document.getElementById('clearBtn'),
        placeholder: document.getElementById('placeholder'),
        status: document.getElementById('status'),
        qrList: document.getElementById('qrList'),
        countBadge: document.getElementById('countBadge'),
        emptyState: document.getElementById('emptyState'),
        toast: document.getElementById('toast')
    };

    elements.clearBtn.addEventListener('click', handleClearList);

    // Subscribe to state changes
    store.subscribe(updateUI);
}

export function getElements() {
    return elements;
}

export function getCanvasContext() {
    return elements.canvas.getContext('2d', { willReadFrequently: true });
}

function updateUI(state) {
    elements.countBadge.textContent = state.qrItems.length;
    elements.emptyState.style.display = state.qrItems.length === 0 ? 'block' : 'none';
}

export function showScanning() {
    elements.video.style.display = 'block';
    elements.placeholder.style.display = 'none';
    elements.startBtn.style.display = 'none';
    elements.stopBtn.style.display = 'flex';
    elements.status.textContent = 'Scanning for QR codes...';
    elements.status.className = 'status scanning';
}

export function showStopped() {
    elements.video.style.display = 'none';
    elements.placeholder.style.display = 'block';
    elements.startBtn.style.display = 'flex';
    elements.stopBtn.style.display = 'none';
    elements.status.textContent = 'Scanning stopped';
    elements.status.className = 'status idle';
}

export function showError(message) {
    elements.status.textContent = message;
    elements.status.className = 'status idle';
}

export function addQRCodeToUI(item) {
    const state = store.getState();
    elements.emptyState.style.display = 'none';
    elements.countBadge.textContent = state.qrItems.length;

    const itemElement = document.createElement('div');
    itemElement.className = 'qr-item';
    itemElement.innerHTML = `
        <div class="qr-item-header">
            <span class="qr-item-number">#${state.qrItems.length}</span>
            <span class="qr-item-time">${item.time}</span>
        </div>
        <div class="qr-item-content">${escapeHtml(item.data)}</div>
        <div class="qr-item-actions">
            <button class="copy-btn" data-copy="${escapeForAttribute(item.data)}">
                Copy
            </button>
            ${isValidUrl(item.data) ? `<button class="open-btn" data-url="${escapeForAttribute(item.data)}">Open Link</button>` : ''}
        </div>
    `;

    // Add event listeners
    const copyBtn = itemElement.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => copyToClipboard(item.data, copyBtn));

    const openBtn = itemElement.querySelector('.open-btn');
    if (openBtn) {
        openBtn.addEventListener('click', () => window.open(item.data, '_blank'));
    }

    elements.qrList.insertBefore(itemElement, elements.qrList.firstChild);
}

function handleClearList() {
    clearCodes();
    elements.qrList.innerHTML = '';
    elements.emptyState.style.display = 'block';
    elements.qrList.appendChild(elements.emptyState);
    elements.countBadge.textContent = '0';
}

export function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2000);
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
