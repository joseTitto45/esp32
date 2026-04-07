import { llamarApi } from './api.js';

let contenedor;

export async function iniciarReles(idContenedor) {
    contenedor = document.getElementById(idContenedor);
    await cargarReles();
    escucharCambiosSocket();
    escucharCambiosConexion();
}

async function cargarReles() {
    contenedor.innerHTML = '<div class="cargando"><span class="spinner"></span></div>';
    try {
        const reles = await llamarApi('/api/reles');

        if (!reles || reles.length === 0) {
            contenedor.innerHTML = '<p class="vacio">No hay relés configurados.</p>';
            return;
        }

        const grupos = agruparPorDispositivo(reles);
        contenedor.innerHTML = '';

        for (const [nombreDispositivo, relesList] of Object.entries(grupos)) {
            const enLinea = relesList[0].en_linea;
            const grupo   = construirGrupo(nombreDispositivo, relesList, enLinea);
            contenedor.appendChild(grupo);
        }

        reles.forEach(r => asignarEventoBoton(r.id));

    } catch (err) {
        contenedor.innerHTML = `<p class="error-msg">Error al cargar: ${err.message}</p>`;
    }
}

function agruparPorDispositivo(reles) {
    return reles.reduce((acc, rele) => {
        const nombre = rele.nombre_dispositivo;
        if (!acc[nombre]) acc[nombre] = [];
        acc[nombre].push(rele);
        return acc;
    }, {});
}

function construirGrupo(nombreDispositivo, reles, enLinea) {
    const seccion = document.createElement('section');
    seccion.className = 'grupo-dispositivo';
    seccion.dataset.dispositivo = reles[0].dispositivo_id;

    seccion.innerHTML = `
        <div class="grupo-header">
            <div class="grupo-titulo">
                <span class="icono-dispositivo">📡</span>
                <h2>${nombreDispositivo}</h2>
            </div>
            <span class="badge-conexion ${enLinea ? 'en-linea' : 'fuera-linea'}" data-dispositivo="${reles[0].dispositivo_id}">
                ${enLinea ? 'En línea' : 'Sin conexión'}
            </span>
        </div>
        <div class="grid-reles">
            ${reles.map(construirTarjetaRele).join('')}
        </div>
    `;
    return seccion;
}

function construirTarjetaRele(rele) {
    return `
        <div class="tarjeta-rele ${rele.estado ? 'encendido' : ''}" id="rele-${rele.id}">
            <div class="tarjeta-header">
                <span class="icono-rele">${iconoRele(rele.nombre)}</span>
                <span class="pin-badge">GPIO ${rele.numero_pin}</span>
            </div>
            <h3 class="nombre-rele">${rele.nombre}</h3>
            ${rele.descripcion ? `<p class="desc-rele">${rele.descripcion}</p>` : ''}
            <div class="tarjeta-footer">
                <span class="estado-texto">${rele.estado ? 'Encendido' : 'Apagado'}</span>
                <button
                    class="toggle-btn ${rele.estado ? 'activo' : ''}"
                    data-id="${rele.id}"
                    data-estado="${rele.estado}"
                    aria-label="Alternar ${rele.nombre}"
                    aria-pressed="${rele.estado}">
                    <span class="toggle-thumb"></span>
                </button>
            </div>
        </div>
    `;
}

function iconoRele(nombre) {
    const n = nombre.toLowerCase();
    if (n.includes('luz') || n.includes('lamp'))   return '💡';
    if (n.includes('ventil') || n.includes('fan')) return '🌀';
    if (n.includes('puerta') || n.includes('gate')) return '🚪';
    if (n.includes('aire') || n.includes('ac'))    return '❄️';
    return '⚡';
}

function asignarEventoBoton(releId) {
    const boton = contenedor.querySelector(`[data-id="${releId}"]`);
    if (!boton) return;
    boton.addEventListener('click', () => enviarComando(releId, boton));
}

async function enviarComando(releId, boton) {
    if (boton.disabled) return;
    
    // Obtener estado actual (viene como string 'true' o 'false' en el DOM)
    const estadoActual = (boton.dataset.estado === 'true');
    const nuevoEstado = !estadoActual;
    
    // 1. Actualización visual "Optimista" (Inmediata)
    actualizarTarjeta(releId, nuevoEstado);

    // 2. Bloqueamos el botón y mostramos carga invisible
    boton.disabled = true;
    boton.classList.add('cargando');

    try {
        // Ejecutamos la petición en segundo plano
        await llamarApi(`/api/reles/${releId}/comando`, {
            method: 'POST',
            body:   JSON.stringify({ accion: 'alternar' }),
        });
        // Si sale bien, no hacemos nada más, el estado ya se actualizó.
    } catch (err) {
        // 3. Fallo el backend/internet: Revertir visualmente y mostrar error.
        actualizarTarjeta(releId, estadoActual);
        mostrarToast(err.message, 'error');
    } finally {
        boton.disabled = false;
        boton.classList.remove('cargando');
    }
}

function escucharCambiosSocket() {
    document.addEventListener('rele:cambio', e => {
        const { rele_id, estado } = e.detail;
        actualizarTarjeta(rele_id, estado);
    });
}

function escucharCambiosConexion() {
    document.addEventListener('dispositivo:conexion', e => {
        const { dispositivo_id, en_linea } = e.detail;
        const badges = document.querySelectorAll(`.badge-conexion[data-dispositivo="${dispositivo_id}"]`);
        badges.forEach(b => {
            b.className = `badge-conexion ${en_linea ? 'en-linea' : 'fuera-linea'}`;
            b.textContent = en_linea ? 'En línea' : 'Sin conexión';
        });
    });
}

function actualizarTarjeta(releId, estado) {
    const tarjeta = document.getElementById(`rele-${releId}`);
    if (!tarjeta) return;

    const boton      = tarjeta.querySelector('.toggle-btn');
    const estadoText = tarjeta.querySelector('.estado-texto');

    tarjeta.classList.toggle('encendido', estado);
    boton.classList.toggle('activo', estado);
    boton.dataset.estado  = estado;
    boton.setAttribute('aria-pressed', estado);
    estadoText.textContent = estado ? 'Encendido' : 'Apagado';
}

export function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
