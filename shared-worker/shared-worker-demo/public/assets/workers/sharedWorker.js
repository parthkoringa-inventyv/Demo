import init, * as wasm from '/assets/wasm/pkg/encrypt_wasm.js';

console.log("Shared worker loaded");

let wasmReady = false;
let db = null;
const ports = [];

async function start() {
    await init('/assets/wasm/pkg/encrypt_wasm_bg.wasm')
        .then(() => {
            wasmReady = true;
            console.log('WASM encrypt ready');
        })
        .catch((err) => console.log(err));

    const key = new TextEncoder().encode(
        '12345678901234567890123456789012'
    );

    await wasm.init_key(Array.from(key));

    await openDb()
        .then(() => console.log('IndexedDB ready'))
        .catch((err) => console.log(err));

    broadcast({ type: 'SYNC' });
}
async function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('chat_db', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('messages')) {
                db.createObjectStore('messages', { keyPath: 'msg_id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };

        request.onerror = reject;
    });
}

start();

onconnect = (event) => {
    console.log('Shared worker: new Tab connected');
    const port = event.ports[0];
    ports.push(port);
    console.log(ports)

    port.onmessage = async (e) => {
        if (!wasmReady || !db) {
            return;
        }

        const { action, payload } = e.data;
        try {
            switch (action) {

                case 'ADD_MESSAGE':
                    await addMessage(payload)
                        .then(() => console.log("Message added"))
                        .catch((err) => console.log(err));
                    broadcast({ type: 'SYNC' });
                    break;

                case 'GET_ALL_MESSAGES':
                    const messages = await getAllMessages()
                        .then((data) => {
                            console.log("all messages fetched");
                            return data;
                        })
                        .catch((err) => console.log(err));

                    port.postMessage({
                        type: 'ALL_MESSAGES',
                        payload: messages
                    });
                    break;

                case 'DELETE_MESSAGE':
                    await deleteMessage(payload)
                        .then(() => console.log("message deleted"))
                        .catch((err) => console.log(err));
                    broadcast({ type: "SYNC" });
                    break;
            }

        } catch (err) {
            port.postMessage({
                type: 'ERROR',
                message: err?.toString()
            });
        }
    };

    port.start();
};

function broadcast(message) {
    ports.forEach(p => p.postMessage(message));
}

async function addMessage(payload) {
    const encrypted = wasm.encrypt(payload.msg_content);

    return new Promise((resolve, reject) => {
        const request = db.transaction('messages', 'readwrite')
            .objectStore('messages')
            .put({
                msg_id: payload.msg_id,
                msg_content: encrypted
            });
        request.onsuccess = resolve;
        request.onerror = reject;
    });
}

async function getAllMessages() {
    return new Promise((resolve, reject) => {
        const request = db.transaction('messages', 'readonly')
            .objectStore('messages')
            .getAll();

        request.onsuccess = () => {
            const decrypted = request.result.map(m => ({
                msg_id: m.msg_id,
                msg_content: wasm.decrypt(m.msg_content)
            }));
            resolve(decrypted);
        };

        request.onerror = reject;
    });
}

async function deleteMessage(payload) {
    return new Promise((resolve, reject) => {
        const request = db.transaction('messages', 'readwrite')
            .objectStore('messages')
            .delete(payload.msg_id);
        request.onsuccess = resolve;
        request.onerror = reject;
    });
}
