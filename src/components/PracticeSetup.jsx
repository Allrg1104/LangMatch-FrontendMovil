import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles/PracticeSetup.css";

function PracticeSetup() {
  const [idioma, setIdioma] = useState("es");
  const [nivel, setNivel] = useState("A1");
  const [user, setUser] = useState({ _id: "", nombre: "", correo: "" });
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

// Cargar usuario
useEffect(() => {
  const usuarioGuardado = localStorage.getItem("usuario");
  if (!usuarioGuardado) return navigate("/");
  const parsedUser = JSON.parse(usuarioGuardado);
  setUser(parsedUser);
}, [navigate]);

// ✅ Obtener sesiones del usuario (solo si ya existe user._id)
useEffect(() => {
  if (!user._id) return; // evita llamada vacía
  console.log("🔹 Consultando prácticas del usuario:", user._id);

  axios
    .get(`http://localhost:5000/api/chat/practice/${user._id}`)
    .then((res) => {
      console.log("✅ Prácticas cargadas:", res.data);
      setSessions(res.data);
    })
    .catch((err) => console.error("❌ Error obteniendo prácticas:", err));
}, [user._id]); // ✅ importante que dependa de user._id


const handleStartPractice = async () => {
  const userId = user._id || user.id; // ✅ soporte para ambas variantes

  if (!userId) {
    alert("No se encontró el ID del usuario. Inicia sesión nuevamente.");
    return;
  }

  try {
    const res = await axios.post("http://localhost:5000/api/chat/practice/start", {
      userId,
      idioma,
      nivel,
    });

    if (res.data.success) {
      const sessionData = {
        sessionId: res.data.sessionId,
        idioma,
        nivel,
        userId,
      };
      localStorage.setItem("practiceSettings", JSON.stringify(sessionData));
      navigate("/chatbot");
    } else {
      alert(res.data.message || "No se pudo iniciar la práctica.");
    }
  } catch (error) {
    console.error("Error al iniciar práctica:", error);
    alert("Error al iniciar práctica. Revisa la consola.");
  }
};

  // Continuar práctica existente
  const handleContinue = (session) => {
    localStorage.setItem("practiceSettings", JSON.stringify(session));
    navigate("/chatbot");
  };

  // Eliminar sesión
  const handleDelete = async (id) => {
    if (!window.confirm("¿Deseas eliminar esta práctica?")) return;
    await axios.delete(`http://localhost:5000/api/chat/practice/${id}`);
    setSessions(sessions.filter((s) => s._id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div className="assistant-layout">
      <header className="assistant-header">
        <div className="user-info">
          <h2>{user.nombre}</h2>
          <p>{user.correo}</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>Cerrar Sesión</button>
      </header>

      <main className="setup-container">
        <h1>Iniciar práctica</h1>

        <div className="setup-form">
          <label>Selecciona el idioma:</label>
          <select value={idioma} onChange={(e) => setIdioma(e.target.value)}>
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="fr">Francés</option>
          </select>

          <label>Selecciona el nivel:</label>
          <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
            <option value="A1">A1 - Básico</option>
            <option value="B1">B1 - Intermedio</option>
            <option value="C1">C1 - Avanzado</option>
          </select>

          <button onClick={handleStartPractice}>Comenzar práctica</button>
        </div>

        {/* Panel de sesiones previas */}
        <section className="sessions-panel">
          <h2>Mis prácticas ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <p>No tienes prácticas guardadas.</p>
          ) : (
            <ul className="sessions-list">
              {sessions.map((s) => (
                <li key={s._id} className="session-item">
                  <div>
                    <strong>{s.idioma.toUpperCase()}</strong> — Nivel {s.nivel}
                    <p>Iniciada: {new Date(s.startTime).toLocaleString()}</p>
                  </div>
                  <div className="session-buttons">
                    <button onClick={() => handleContinue(s)}>Continuar</button>
                    <button onClick={() => handleDelete(s._id)}>Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="assistant-footer">
        <p>&copy; 2025 Thot IA - ChatBot Educativo</p>
      </footer>
    </div>
  );
}

export default PracticeSetup;