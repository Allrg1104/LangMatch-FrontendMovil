import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles/ChatBot.css";

// Función para dar formato a la hora
const formatTimestamp = (timestamp) => {
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return isNaN(date.getTime())
      ? new Date().toLocaleTimeString()
      : date.toLocaleTimeString("es-ES");
  } catch {
    return new Date().toLocaleTimeString();
  }
};

function ChatBot() {
  const [user, setUser] = useState({ nombre: "", correo: "" });
  const [session, setSession] = useState({ idioma: "", nivel: "" });
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // 🔹 Cargar datos del usuario y configuración de práctica
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const settings = JSON.parse(localStorage.getItem("practiceSettings"));

    if (!usuario) {
      navigate("/"); // si no hay usuario logueado
      return;
    }
    if (!settings) {
      navigate("/practiceSetup"); // si no hay configuración de práctica
      return;
    }

    setUser(usuario);
    setSession(settings);
  }, [navigate]);

  // 🔹 Scroll automático hacia el final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Enviar mensaje al backend (usuario y respuesta del bot)
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
      displayTime: formatTimestamp(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Enviar mensaje del usuario al backend (ajusta URL)
      const response = await axios.post("http://localhost:5000/api/chatbot", {
        mensaje: userMsg.content,
        idioma: session.idioma,
        nivel: session.nivel,
        correo: user.correo,
      });

      const botMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.data.respuesta || "Lo siento, no tengo una respuesta en este momento.",
        timestamp: new Date(),
        displayTime: formatTimestamp(new Date()),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          content: "Error al procesar tu mensaje. Intenta de nuevo.",
          timestamp: new Date(),
          displayTime: formatTimestamp(new Date()),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Enviar con Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 🔹 Cerrar práctica y regresar a PracticeSetup
  const handleClosePractice = async () => {
    try {
      await axios.post("http://localhost:5000/api/practices/finalizar", {
        correo: user.correo,
        idioma: session.idioma,
      });
    } catch (error) {
      console.warn("No se pudo registrar el cierre de la práctica:", error);
    } finally {
      navigate("/practiceSetup");
    }
  };

  return (
    <div className="assistant-layout">
      {/* Encabezado con información del usuario */}
      <header className="assistant-header">
        <div className="user-info">
          <h2>{user.nombre || "Usuario"}</h2>
          <p>{user.correo}</p>
        </div>
        <button className="logout-button" onClick={handleClosePractice}>
          Cerrar práctica
        </button>
      </header>

      {/* Chat principal */}
      <main className="chat-container">
        <section className="chat-header">
          <h2>
            Práctica en {session.idioma.toUpperCase()} - Nivel {session.nivel}
          </h2>
        </section>

        <div className="chat-box">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <p>Hola {user.nombre.split(" ")[0]}, ¿listo para practicar?</p>
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${
                    msg.role === "user" ? "user-message" : "assistant-message"
                  }`}
                >
                  <p>{msg.content}</p>
                  <span className="timestamp">{msg.displayTime}</span>
                </div>
              ))}
              {isLoading && (
                <div className="message assistant-message loading">
                  <p>Escribiendo...</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Entrada de texto */}
        <div className="input-area">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje aquí..."
            disabled={isLoading}
            maxLength={500}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
          >
            {isLoading ? "..." : "Enviar"}
          </button>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="assistant-footer">
        <p className="footer-text">&copy; 2025 SOMMER IA - Asistente Virtual.</p>
      </footer>
    </div>
  );
}

export default ChatBot;