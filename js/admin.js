/**
 * admin.js
 * Lógica del panel de administración: Usuarios, Relés/Puertos, Dispositivos.
 */

import { llamarApi } from './api.js';
import { mostrarToast } from './reles.js';

// ═══════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    configurarTabs();
    cargarUsuarios();
    cargarReles();
    cargarDispositivos();
    configurarFormularios();
    configurarModal();
});

// ═══════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════
function configurarTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`tab-${target}`)?.classList.add('active');
        });
    });
}

// ═══════════════════════════════════════════════════════
// MODAL DE CONFIRMACIÓN
// ═══════════════════════════════════════════════════════
let modalCallback = null;

function configurarModal() {
    document.getElementById('modal-cancelar').addEventListener('click', cerrarModal);
    document.getElementById('modal-eliminar').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) cerrarModal();
    });
    document.getElementById('modal-confirmar').addEventListener('click', () => {
        if (typeof modalCallback === 'function') modalCallback();
        cerrarModal();
    });
}

function abrirModal(titulo, descripcion, callback) {
    document.getElementById('modal-titulo').textContent = titulo;
    document.getElementById('modal-descripcion').textContent = descripcion;
    document.getElementById('modal-eliminar').style.display = 'flex';
    modalCallback = callback;
}

function cerrarModal() {
    document.getElementById('modal-eliminar').style.display = 'none';
    modalCallback = null;
}

// ═══════════════════════════════════════════════════════
// USUARIOS
// ═══════════════════════════════════════════════════════
async function cargarUsuarios() {
    const cont = document.getElementById('tabla-usuarios-contenido');
    try {
        const usuarios = await llamarApi('/api/admin/usuarios');
        if (!usuarios || usuarios.length === 0) {
            cont.innerHTML = '<div class="tabla-vacia">No hay usuarios registrados.</div>';
            return;
        }
        cont.innerHTML = construirTablaUsuarios(usuarios);
        asignarEventosEliminarUsuario();
    } catch (err) {
        cont.innerHTML = `<div class="tabla-vacia">Error al cargar: ${err.message}</div>`;
    }
}

function construirTablaUsuarios(usuarios) {
    const filas = usuarios.map(u => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:30px;height:30px;background:var(--teal-dim);border:1px solid rgba(15,214,180,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:var(--teal);flex-shrink:0">
                        ${u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight:600">${u.nombre}</div>
                        <div style="font-size:0.75rem;color:var(--txt-mid)">${u.correo}</div>
                    </div>
                </div>
            </td>
            <td><span class="pill pill-${u.rol}">${u.rol}</span></td>
            <td><span class="pill ${u.activo ? 'pill-activo' : 'pill-inactivo'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td style="color:var(--txt-mid);font-size:0.8rem">${u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString('es-BO') : '—'}</td>
            <td>
                <button class="btn-tabla btn-eliminar-usuario" data-id="${u.id}" data-nombre="${u.nombre}" title="Eliminar usuario">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');

    return `
        <table>
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Último acceso</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>${filas}</tbody>
        </table>
    `;
}

function asignarEventosEliminarUsuario() {
    document.querySelectorAll('.btn-eliminar-usuario').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const nombre = btn.dataset.nombre;
            abrirModal(
                `¿Eliminar a "${nombre}"?`,
                'Se eliminará la cuenta y todas sus sesiones activas. Esta acción no se puede deshacer.',
                async () => {
                    try {
                        await llamarApi(`/api/admin/usuarios/${id}`, { method: 'DELETE' });
                        mostrarToast(`Usuario "${nombre}" eliminado`, 'success');
                        cargarUsuarios();
                    } catch (err) {
                        mostrarToast(err.message, 'error');
                    }
                }
            );
        });
    });
}

// ═══════════════════════════════════════════════════════
// RELÉS / PUERTOS
// ═══════════════════════════════════════════════════════
async function cargarReles() {
    const cont = document.getElementById('tabla-reles-contenido');
    try {
        const reles = await llamarApi('/api/reles');
        if (!reles || reles.length === 0) {
            cont.innerHTML = '<div class="tabla-vacia">No hay relés configurados.</div>';
            return;
        }
        cont.innerHTML = construirTablaReles(reles);
        asignarEventosEliminarRele();
    } catch (err) {
        cont.innerHTML = `<div class="tabla-vacia">Error al cargar: ${err.message}</div>`;
    }
}

function construirTablaReles(reles) {
    const filas = reles.map(r => `
        <tr>
            <td>
                <div style="font-weight:600">${r.nombre}</div>
                ${r.descripcion ? `<div style="font-size:0.75rem;color:var(--txt-mid)">${r.descripcion}</div>` : ''}
            </td>
            <td><span class="pill pill-pin">GPIO ${r.numero_pin}</span></td>
            <td style="color:var(--txt-mid);font-size:0.85rem">${r.nombre_dispositivo || '—'}</td>
            <td><span class="pill ${r.estado ? 'pill-activo' : 'pill-inactivo'}">${r.estado ? 'Encendido' : 'Apagado'}</span></td>
            <td>
                <button class="btn-tabla btn-eliminar-rele" data-id="${r.id}" data-nombre="${r.nombre}" title="Eliminar relé">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');

    return `
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Pin</th>
                    <th>Dispositivo</th>
                    <th>Estado</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>${filas}</tbody>
        </table>
    `;
}

function asignarEventosEliminarRele() {
    document.querySelectorAll('.btn-eliminar-rele').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const nombre = btn.dataset.nombre;
            abrirModal(
                `¿Eliminar relé "${nombre}"?`,
                'Se eliminará el relé y todo su historial de cambios.',
                async () => {
                    try {
                        await llamarApi(`/api/reles/${id}`, { method: 'DELETE' });
                        mostrarToast(`Relé "${nombre}" eliminado`, 'success');
                        cargarReles();
                    } catch (err) {
                        mostrarToast(err.message, 'error');
                    }
                }
            );
        });
    });
}

// ═══════════════════════════════════════════════════════
// DISPOSITIVOS
// ═══════════════════════════════════════════════════════
async function cargarDispositivos() {
    const cont = document.getElementById('tabla-dispositivos-contenido');
    try {
        const dispositivos = await llamarApi('/api/admin/dispositivos');
        if (!dispositivos || dispositivos.length === 0) {
            cont.innerHTML = '<div class="tabla-vacia">No hay dispositivos registrados.</div>';
            return;
        }
        cont.innerHTML = construirTablaDispositivos(dispositivos);
        asignarEventosEliminarDispositivo();
    } catch (err) {
        cont.innerHTML = `<div class="tabla-vacia">Error al cargar: ${err.message}</div>`;
    }
}

function construirTablaDispositivos(dispositivos) {
    const filas = dispositivos.map(d => `
        <tr>
            <td style="font-weight:600">${d.nombre}</td>
            <td style="color:var(--txt-mid);font-size:0.82rem">${d.descripcion || '—'}</td>
            <td><span class="pill ${d.en_linea ? 'pill-online' : 'pill-offline'}">${d.en_linea ? 'En línea' : 'Sin conexión'}</span></td>
            <td>
                <code style="font-family:'Space Mono',monospace;font-size:0.68rem;color:var(--txt-lo);background:var(--bg-elevated);border:1px solid var(--border);padding:2px 7px;border-radius:4px">
                    ${d.token_mqtt ? d.token_mqtt.substring(0, 12) + '••••' : '—'}
                </code>
            </td>
            <td style="color:var(--txt-mid);font-size:0.8rem">${new Date(d.creado_en).toLocaleDateString('es-BO')}</td>
            <td>
                <button class="btn-tabla btn-eliminar-dispositivo" data-id="${d.id}" data-nombre="${d.nombre}" title="Eliminar dispositivo">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');

    return `
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Token MQTT</th>
                    <th>Creado</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>${filas}</tbody>
        </table>
    `;
}

function asignarEventosEliminarDispositivo() {
    document.querySelectorAll('.btn-eliminar-dispositivo').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const nombre = btn.dataset.nombre;
            abrirModal(
                `¿Eliminar dispositivo "${nombre}"?`,
                'Se eliminarán todos los relés y el historial asociado a este ESP32.',
                async () => {
                    try {
                        await llamarApi(`/api/admin/dispositivos/${id}`, { method: 'DELETE' });
                        mostrarToast(`Dispositivo "${nombre}" eliminado`, 'success');
                        cargarDispositivos();
                        cargarReles();
                        // Recargar select de dispositivos en el form
                        cargarSelectDispositivos();
                    } catch (err) {
                        mostrarToast(err.message, 'error');
                    }
                }
            );
        });
    });
}

// ═══════════════════════════════════════════════════════
// FORMULARIOS (show/hide + submit)
// ═══════════════════════════════════════════════════════
function configurarFormularios() {
    // ── Usuarios ──
    document.getElementById('btn-nuevo-usuario').addEventListener('click', () => {
        toggleFormulario('form-nuevo-usuario', 'btn-nuevo-usuario');
    });
    document.getElementById('btn-cancelar-usuario').addEventListener('click', () => {
        ocultarFormulario('form-nuevo-usuario');
    });
    document.getElementById('btn-guardar-usuario').addEventListener('click', crearUsuario);

    // ── Relés ──
    document.getElementById('btn-nuevo-rele').addEventListener('click', () => {
        toggleFormulario('form-nuevo-rele', 'btn-nuevo-rele');
        cargarSelectDispositivos();
    });
    document.getElementById('btn-cancelar-rele').addEventListener('click', () => {
        ocultarFormulario('form-nuevo-rele');
    });
    document.getElementById('btn-guardar-rele').addEventListener('click', crearRele);

    // ── Dispositivos ──
    document.getElementById('btn-nuevo-dispositivo').addEventListener('click', () => {
        toggleFormulario('form-nuevo-dispositivo', 'btn-nuevo-dispositivo');
    });
    document.getElementById('btn-cancelar-dispositivo').addEventListener('click', () => {
        ocultarFormulario('form-nuevo-dispositivo');
    });
    document.getElementById('btn-guardar-dispositivo').addEventListener('click', crearDispositivo);
}

function toggleFormulario(formId, btnId) {
    const form = document.getElementById(formId);
    const abierto = form.style.display !== 'none';
    form.style.display = abierto ? 'none' : 'block';
}

function ocultarFormulario(formId) {
    document.getElementById(formId).style.display = 'none';
}

function setMensaje(elId, texto, tipo) {
    const el = document.getElementById(elId);
    el.textContent = texto;
    el.className = `form-msg ${tipo}`;
}

// ── Crear usuario ──
async function crearUsuario() {
    const nombre = document.getElementById('u-nombre').value.trim();
    const correo = document.getElementById('u-correo').value.trim();
    const password = document.getElementById('u-password').value;
    const rol = document.getElementById('u-rol').value;

    if (!nombre || !correo || !password) {
        setMensaje('msg-usuario', 'Completa todos los campos requeridos.', 'err');
        return;
    }
    if (password.length < 8) {
        setMensaje('msg-usuario', 'La contraseña debe tener al menos 8 caracteres.', 'err');
        return;
    }

    const btn = document.getElementById('btn-guardar-usuario');
    btn.disabled = true;
    btn.classList.add('cargando');
    setMensaje('msg-usuario', '', '');

    try {
        await llamarApi('/api/admin/usuarios', {
            method: 'POST',
            body: JSON.stringify({ nombre, correo, password, rol }),
        });
        setMensaje('msg-usuario', `Usuario "${nombre}" creado correctamente.`, 'ok');
        mostrarToast(`Usuario "${nombre}" creado`, 'success');

        // Limpiar y recargar
        ['u-nombre', 'u-correo', 'u-password'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('u-rol').value = 'usuario';
        setTimeout(() => {
            ocultarFormulario('form-nuevo-usuario');
            setMensaje('msg-usuario', '', '');
        }, 2000);
        cargarUsuarios();
    } catch (err) {
        setMensaje('msg-usuario', err.message, 'err');
    } finally {
        btn.disabled = false;
        btn.classList.remove('cargando');
    }
}

// ── Cargar select de dispositivos ──
async function cargarSelectDispositivos() {
    const select = document.getElementById('r-dispositivo');
    try {
        const dispositivos = await llamarApi('/api/admin/dispositivos');
        select.innerHTML = '<option value="">— Seleccionar dispositivo —</option>';
        dispositivos.forEach(d => {
            select.innerHTML += `<option value="${d.id}">${d.nombre}</option>`;
        });
    } catch (_) { /* silencioso */ }
}

// ── Crear relé ──
async function crearRele() {
    const dispositivo_id = document.getElementById('r-dispositivo').value;
    const numero_pin = parseInt(document.getElementById('r-pin').value);
    const nombre = document.getElementById('r-nombre').value.trim();
    const descripcion = document.getElementById('r-descripcion').value.trim();

    if (!dispositivo_id || !numero_pin || !nombre) {
        setMensaje('msg-rele', 'Selecciona dispositivo, pin y escribe un nombre.', 'err');
        return;
    }

    const btn = document.getElementById('btn-guardar-rele');
    btn.disabled = true;
    btn.classList.add('cargando');
    setMensaje('msg-rele', '', '');

    try {
        await llamarApi('/api/admin/reles', {
            method: 'POST',
            body: JSON.stringify({ dispositivo_id, numero_pin, nombre, descripcion }),
        });
        setMensaje('msg-rele', `Relé "${nombre}" en GPIO ${numero_pin} creado.`, 'ok');
        mostrarToast(`Relé "${nombre}" creado`, 'success');

        ['r-nombre', 'r-descripcion'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('r-pin').value = '';
        document.getElementById('r-dispositivo').value = '';
        setTimeout(() => {
            ocultarFormulario('form-nuevo-rele');
            setMensaje('msg-rele', '', '');
        }, 2000);
        cargarReles();
    } catch (err) {
        setMensaje('msg-rele', err.message, 'err');
    } finally {
        btn.disabled = false;
        btn.classList.remove('cargando');
    }
}

// ── Crear dispositivo ──
async function crearDispositivo() {
    const nombre = document.getElementById('d-nombre').value.trim();
    const descripcion = document.getElementById('d-descripcion').value.trim();
    const token_mqtt = document.getElementById('d-token').value.trim();

    if (!nombre) {
        setMensaje('msg-dispositivo', 'Escribe un nombre para el dispositivo.', 'err');
        return;
    }

    const btn = document.getElementById('btn-guardar-dispositivo');
    btn.disabled = true;
    btn.classList.add('cargando');
    setMensaje('msg-dispositivo', '', '');

    try {
        const nuevo = await llamarApi('/api/admin/dispositivos', {
            method: 'POST',
            body: JSON.stringify({ nombre, descripcion, token_mqtt: token_mqtt || undefined }),
        });
        const tokenGenerado = nuevo?.token_mqtt || token_mqtt;
        setMensaje('msg-dispositivo', `Dispositivo "${nombre}" creado. Token: ${tokenGenerado?.substring(0, 16)}...`, 'ok');
        mostrarToast(`Dispositivo "${nombre}" creado`, 'success');

        ['d-nombre', 'd-descripcion', 'd-token'].forEach(id => document.getElementById(id).value = '');
        setTimeout(() => {
            ocultarFormulario('form-nuevo-dispositivo');
            setMensaje('msg-dispositivo', '', '');
        }, 3000);
        cargarDispositivos();
    } catch (err) {
        setMensaje('msg-dispositivo', err.message, 'err');
    } finally {
        btn.disabled = false;
        btn.classList.remove('cargando');
    }
}