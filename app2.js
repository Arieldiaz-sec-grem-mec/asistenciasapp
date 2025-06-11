const API_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjhLz1BO5uab87jgVOFLpmBpZ23sYUpvWkD7iWV1WCkwaeQv2_7XEu7s6kdhUvcamFFEGxZ4S1AbyLNQgFF2KZBrPYUv6p_i5jeEEKm6NC35FgpCCjmrj6u26oE_17OJYGVBhM3fLe3U6WxihPvL_C8JD-SU1HKoNQE77bdtSg7CCSV5jF4E6hBH-so7Zpi8XsgJJIV1GvrGQ7b-ZbMn4_VBw_Ea9SzYuPjSne0S3ZlY93UV9M-ZKzqRT-1m7RM2f8EWjHsilfkejeuU_BzOL7EJ0FJ_Q&lib=MUfngVQZI-VtDgiXId2WKgXQNFQG3epjV';
const columnasFijas = ['APELLIDO', 'NOMBRE', 'CURSO', 'EMPRESA', 'DNI', 'TELEFONO', 'EMAIL'];

// Funciones auxiliares
const obtenerFechasAsistencia = (registro) => {
    return Object.keys(registro).filter(key => !columnasFijas.includes(key));
};

const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Manejadores de pestañas
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// Funciones principales
async function cargarDatos() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        document.getElementById('lastUpdate').textContent = new Date(data.timestamp).toLocaleString('es-AR');
        
        mostrarEstadisticas(data);
        mostrarAusentes(data);
        mostrarAusenciasPorEmpresa(data);
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

async function mostrarEstadisticas(data) {
    const container = document.getElementById('estadisticas');
    const summaryCards = container.querySelector('.summary-cards');
    const cursoList = container.querySelector('.curso-list');
    
    // Limpiar contenedores
    summaryCards.innerHTML = '';
    cursoList.innerHTML = '';

    // Estadísticas generales
    const totalAlumnos = data.count;
    const cursos = [...new Set(data.data.map(item => item.CURSO))].sort();
    const empresas = [...new Set(data.data.map(item => item.EMPRESA))].sort();

    // Crear tarjetas de resumen
    summaryCards.innerHTML = `
        <div class="card">
            <h3>Total Alumnos</h3>
            <div class="stat-value">${totalAlumnos}</div>
        </div>
        <div class="card">
            <h3>Total Cursos</h3>
            <div class="stat-value">${cursos.length}</div>
        </div>
        <div class="card">
            <h3>Total Empresas</h3>
            <div class="stat-value">${empresas.length}</div>
        </div>
    `;

    // Mostrar datos por curso
    cursos.forEach(curso => {
        const alumnosCurso = data.data.filter(item => item.CURSO === curso);
        const fechasAsistencia = obtenerFechasAsistencia(alumnosCurso[0]);
        
        const cursoElement = document.createElement('div');
        cursoElement.className = 'card curso-card';
        
        // Calcular estadísticas del curso
        const ultimaFecha = fechasAsistencia[fechasAsistencia.length - 1];
        const presentes = alumnosCurso.filter(a => a[ultimaFecha] === 'Presente').length;
        const ausentes = alumnosCurso.filter(a => a[ultimaFecha] === 'Ausente').length;
        
        cursoElement.innerHTML = `
            <h3>${curso}</h3>
            <div class="stats">
                <div class="stat-item">
                    <div>Alumnos</div>
                    <div class="stat-value">${alumnosCurso.length}</div>
                </div>
                <div class="stat-item">
                    <div>Presentes</div>
                    <div class="stat-value">${presentes}</div>
                </div>
                <div class="stat-item">
                    <div>Ausentes</div>
                    <div class="stat-value">${ausentes}</div>
                </div>
            </div>
            <div class="alumnos-list">
                ${alumnosCurso.map(alumno => `
                    <div class="alumno-item">
                        <strong>${alumno.APELLIDO}, ${alumno.NOMBRE}</strong>
                        <div class="empresa-tag">${alumno.EMPRESA}</div>
                        <div class="contact-info">
                            <span>📞 ${alumno.TELEFONO}</span>
                            <span>✉️ ${alumno.EMAIL}</span>
                        </div>
                        <div class="asistencia">
                            ${alumno[ultimaFecha] === 'Presente' ? '✅' : 
                              alumno[ultimaFecha] === 'Ausente' ? '❌' : '⚠️'}
                            Última asistencia: ${formatearFecha(ultimaFecha)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        cursoList.appendChild(cursoElement);
    });
}

function mostrarAusentes(data) {
    const container = document.querySelector('.ausentes-list');
    container.innerHTML = '';

    const cursos = [...new Set(data.data.map(item => item.CURSO))].sort();

    cursos.forEach(curso => {
        const alumnosCurso = data.data.filter(item => item.CURSO === curso);
        const fechasAsistencia = obtenerFechasAsistencia(alumnosCurso[0]);
        const ausentesCurso = alumnosCurso.filter(alumno => 
            fechasAsistencia.some(fecha => alumno[fecha] === 'Ausente')
        );

        if (ausentesCurso.length > 0) {
            const cursoElement = document.createElement('div');
            cursoElement.className = 'card ausente-info';
            cursoElement.innerHTML = `
                <h3>${curso}</h3>
                <p>Total ausentes: ${ausentesCurso.length}</p>
                <div class="alumnos-list">
                    ${ausentesCurso.map(alumno => `
                        <div class="alumno-item">
                            <strong>${alumno.APELLIDO}, ${alumno.NOMBRE}</strong>
                            <div class="empresa-tag">${alumno.EMPRESA}</div>
                            <div class="contact-info">
                                <span>📞 ${alumno.TELEFONO}</span>
                                <span>✉️ ${alumno.EMAIL}</span>
                            </div>
                            <div class="ausencias">
                                <strong>Fechas de ausencia:</strong>
                                ${fechasAsistencia
                                    .filter(fecha => alumno[fecha] === 'Ausente')
                                    .map(fecha => `
                                        <div class="date-label">❌ ${formatearFecha(fecha)}</div>
                                    `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(cursoElement);
        }
    });
}

function mostrarAusenciasPorEmpresa(data) {
    const container = document.querySelector('.empresa-list');
    container.innerHTML = '';

    const empresas = [...new Set(data.data.map(item => item.EMPRESA))].sort();

    empresas.forEach(empresa => {
        const alumnosEmpresa = data.data.filter(item => item.EMPRESA === empresa);
        const ausentes = alumnosEmpresa.filter(alumno => {
            const fechasAsistencia = obtenerFechasAsistencia(alumno);
            return fechasAsistencia.some(fecha => alumno[fecha] === 'Ausente');
        });

        if (ausentes.length > 0) {
            const empresaElement = document.createElement('div');
            empresaElement.className = 'card empresa-card';
            empresaElement.innerHTML = `
                <h3>${empresa}</h3>
                <p>Total ausentes: ${ausentes.length} de ${alumnosEmpresa.length} alumnos</p>
                <div class="alumnos-list">
                    ${ausentes.map(alumno => `
                        <div class="alumno-item">
                            <strong>${alumno.APELLIDO}, ${alumno.NOMBRE}</strong>
                            <div class="curso-tag">${alumno.CURSO}</div>
                            <div class="contact-info">
                                <span>📞 ${alumno.TELEFONO}</span>
                                <span>✉️ ${alumno.EMAIL}</span>
                            </div>
                            <div class="ausencias">
                                <strong>Fechas de ausencia:</strong>
                                ${obtenerFechasAsistencia(alumno)
                                    .filter(fecha => alumno[fecha] === 'Ausente')
                                    .map(fecha => `
                                        <div class="date-label">❌ ${formatearFecha(fecha)}</div>
                                    `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(empresaElement);
        }
    });
}

// Iniciar la aplicación
document.addEventListener('DOMContentLoaded', cargarDatos);