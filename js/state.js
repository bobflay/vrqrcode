// State management module
class Store {
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

// App state
export const store = new Store({
    scanning: false,
    detectedCodes: new Set(),
    qrItems: [],
    lastDetectedCode: null,
    lastDuplicateSoundTime: 0
});

// State actions
export function addDetectedCode(code) {
    const state = store.getState();
    const newDetectedCodes = new Set(state.detectedCodes);
    newDetectedCodes.add(code);

    const newItem = {
        id: Date.now(),
        data: code,
        time: new Date().toLocaleTimeString()
    };

    store.setState({
        detectedCodes: newDetectedCodes,
        qrItems: [newItem, ...state.qrItems],
        lastDetectedCode: code,
        lastDuplicateSoundTime: Date.now()
    });

    return newItem;
}

export function updateDuplicateTime(code) {
    store.setState({
        lastDetectedCode: code,
        lastDuplicateSoundTime: Date.now()
    });
}

export function setScanning(scanning) {
    store.setState({ scanning });
}

export function clearCodes() {
    store.setState({
        detectedCodes: new Set(),
        qrItems: [],
        lastDetectedCode: null,
        lastDuplicateSoundTime: 0
    });
}

export function hasCode(code) {
    return store.getState().detectedCodes.has(code);
}
