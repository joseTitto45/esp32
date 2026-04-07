import { requiereAutenticacion, redirigirSiAutenticado, iniciarSesion, cerrarSesion, obtenerUsuario } from './autenticacion.js';
import { iniciarSocket } from './socket.js';
import { iniciarReles } from './reles.js';

const ruta = window.location.pathname;

document.addEventListener('DOMContentLoaded', () => {

    // ── LOGIN ──────────────────────────────────────────────────
    if (ruta.includes('login')) {
        redirigirSiAutenticado();

        const form = document.getElementById('form-login');
        const errorDiv = document.getElementById('error-login');

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const correo = document.getElementById('correo').value.trim();
            const password = document.getElementById('password').value;
            const btn = document.getElementById('boton-ingresar');

            btn.disabled = true;
            btn.classList.add('cargando');
            errorDiv.classList.remove('visible');

            try {
                await iniciarSesion(correo, password);
                window.location.href = '/esp32/panel.html';
            } catch (err) {
                errorDiv.querySelector('.error-texto').textContent = err.message;
                errorDiv.classList.add('visible');
            } finally {
                btn.disabled = false;
                btn.classList.remove('cargando');
            }
        });
    }

    // ── PANEL PRINCIPAL ───────────────────────────────────────
    else if (ruta.includes('panel')) {
        if (!requiereAutenticacion()) return;
        configurarUI();
        iniciarSocket();
        iniciarReles('contenedor-reles');
        document.getElementById('boton-salir')?.addEventListener('click', cerrarSesion);
        escucharWS();
    }

    // ── ADMIN ─────────────────────────────────────────────────
    else if (ruta.includes('admin')) {
        if (!requiereAutenticacion()) return;
        const usuario = obtenerUsuario();
        // Solo admins pueden acceder
        if (usuario?.rol !== 'admin') {
            window.location.href = '/esp32/panel.html';
            return;
        }
        configurarUI();
        iniciarSocket();
        document.getElementById('boton-salir')?.addEventListener('click', cerrarSesion);
        escucharWS();
    }

});

// Reloj en tiempo real
function iniciarReloj() {
    const el = document.getElementById('reloj');
    if (!el) return;
    const tick = () => {
        el.textContent = new Date().toLocaleTimeString('es-BO', { hour12: false });
    };
    tick();
    setInterval(tick, 1000);
}

// Configurar datos de usuario en la UI
function configurarUI() {
    const usuario = obtenerUsuario();

    // Nombre e inicial
    const nombreEl = document.getElementById('nombre-usuario');
    const inicialEl = document.getElementById('usuario-inicial');
    if (usuario?.nombre) {
        if (nombreEl) nombreEl.textContent = usuario.nombre.split(' ')[0];
        if (inicialEl) inicialEl.textContent = usuario.nombre.charAt(0).toUpperCase();
    }

    // Mostrar enlace admin si es admin
    const linkAdmin = document.getElementById('link-admin');
    if (linkAdmin && usuario?.rol === 'admin') {
        linkAdmin.style.display = 'flex';
    }

    iniciarReloj();
}

// Eventos WebSocket → UI
function escucharWS() {
    const statusEl = document.getElementById('status-ws');
    if (!statusEl) return;

    document.addEventListener('ws:conectado', () => {
        statusEl.querySelector('.ws-label').textContent = 'En línea';
        statusEl.className = 'ws-status conectado';
    });

    document.addEventListener('ws:desconectado', () => {
        statusEl.querySelector('.ws-label').textContent = 'Sin conexión';
        statusEl.className = 'ws-status desconectado';
    });
}