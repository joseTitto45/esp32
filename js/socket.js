import { WS_URL } from './configuracion.js';

let socket;

export function iniciarSocket() {
    const token = localStorage.getItem('token');

    socket = io(WS_URL, {
        auth:               { token },
        reconnection:       true,
        reconnectionDelay:  2000,
        reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
        document.dispatchEvent(new CustomEvent('ws:conectado'));
    });

    socket.on('disconnect', () => {
        document.dispatchEvent(new CustomEvent('ws:desconectado'));
    });

    socket.on('connect_error', () => {
        document.dispatchEvent(new CustomEvent('ws:desconectado'));
    });

    socket.on('cambio_estado', datos => {
        document.dispatchEvent(new CustomEvent('rele:cambio', { detail: datos }));
    });

    socket.on('cambio_conexion', datos => {
        document.dispatchEvent(new CustomEvent('dispositivo:conexion', { detail: datos }));
    });
}
