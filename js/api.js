import { BACKEND_URL } from './configuracion.js';

function obtenerToken() {
    return localStorage.getItem('token');
}

export async function llamarApi(ruta, opciones = {}) {
    const respuesta = await fetch(`${BACKEND_URL}${ruta}`, {
        ...opciones,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${obtenerToken()}`,
            ...opciones.headers,
        },
    });

    if (respuesta.status === 401) {
        localStorage.clear();
        window.location.href = '/esp32/login.html';
        return;
    }

    if (!respuesta.ok) {
        const err = await respuesta.json().catch(() => ({ error: `HTTP ${respuesta.status}` }));
        throw new Error(err.error || `HTTP ${respuesta.status}`);
    }

    return respuesta.json();
}
