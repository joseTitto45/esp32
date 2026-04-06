import { requiereAutenticacion, redirigirSiAutenticado, iniciarSesion, cerrarSesion, obtenerUsuario } from './autenticacion.js';
import { iniciarSocket } from './socket.js';
import { iniciarReles  } from './reles.js';

const rutaBase = window.location.pathname;

document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DE LOGIN ---
    if (rutaBase.includes('login') || rutaBase === '/' || rutaBase === '') {
        redirigirSiAutenticado();

        const formLogin = document.getElementById('form-login');
        if (formLogin) {
            formLogin.addEventListener('submit', async (e) => {
                e.preventDefault();
                const correo   = document.getElementById('correo').value.trim();
                const password = document.getElementById('password').value;
                const errorDiv = document.getElementById('error-login');
                const btn      = document.getElementById('boton-ingresar');

                btn.disabled = true;
                btn.classList.add('cargando');
                errorDiv.style.opacity = '0';
                
                try {
                    await iniciarSesion(correo, password);
                    window.location.href = '/index.html';
                } catch (error) {
                    errorDiv.textContent   = error.message;
                    errorDiv.style.opacity = '1';
                } finally {
                    btn.disabled = false;
                    btn.classList.remove('cargando');
                }
            });
        }
    } 
    // --- LÓGICA DEL PANEL PRINCIPAL ---
    else if (rutaBase.includes('index.html')) {
        if (!requiereAutenticacion()) return;

        // Mostrar nombre del usuario logueado
        const usuario = obtenerUsuario();
        if (usuario && usuario.nombre) {
            document.getElementById('nombre-usuario').textContent = usuario.nombre;
        }

        // Inicializar WebSockets y Relés
        iniciarSocket();
        iniciarReles('contenedor-reles');

        // Manejar cierre de sesión
        document.getElementById('boton-salir').addEventListener('click', cerrarSesion);
        
        // Manejar eventos de conexión/desconexión del Socket para la UI
        const statusWs = document.getElementById('status-ws');
        
        document.addEventListener('ws:conectado', () => {
            statusWs.textContent = 'Servidor en línea';
            statusWs.className = 'status-badge conectado';
        });

        document.addEventListener('ws:desconectado', () => {
            statusWs.textContent = 'Reconectando...';
            statusWs.className = 'status-badge desconectado';
        });
    }

});
