import { BACKEND_URL } from './configuracion.js';

export async function iniciarSesion(correo, password) {
    const respuesta = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password }),
    });

    if (!respuesta.ok) {
        const err = await respuesta.json().catch(() => ({}));
        throw new Error(err.error || 'Credenciales incorrectas');
    }

    const { token, usuario } = await respuesta.json();
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
}

export async function cerrarSesion() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            await fetch(`${BACKEND_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
        }
    } finally {
        localStorage.clear();
        window.location.href = '/esp32/login.html';
    }
}

export function obtenerUsuario() {
    const datos = localStorage.getItem('usuario');
    return datos ? JSON.parse(datos) : null;
}

export function requiereAutenticacion() {
    if (!localStorage.getItem('token')) {
        window.location.href = '/esp32/login.html';
        return false;
    }
    return true;
}

export function redirigirSiAutenticado() {
    if (localStorage.getItem('token')) {
        window.location.href = '/esp32/panel.html';
    }
}
