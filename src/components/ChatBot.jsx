import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles/ChatBot.css";

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
  const [session, setSession] = useState({ idioma: "", nivel: "", sessionId: "" });
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // 🔹 Cargar datos guardados
useEffect(() => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const settings = JSON.parse(localStorage.getItem("practiceSettings"));
  if (!usuario) return navigate("/");
  if (!settings) return navigate("/practiceSetup");

  setUser(usuario);
  setSession(settings);

  // 👇 Mostrar el mensaje inicial de práctica
  if (settings.sessionId) {
    axios
      .get(`http://localhost:5000/api/chat/practice/summary/${settings.sessionId}`)
      .then(res => {
        if (res.data && res.data.success && res.data.initialResponse) {
          const botMsg = {
            id: Date.now(),
            role: "assistant",
            content: res.data.initialResponse,
            timestamp: new Date(),
            displayTime: formatTimestamp(new Date()),
          };
          setMessages([botMsg]);
        }
      })
      .catch(() => {
        console.warn("No se pudo cargar el mensaje inicial de práctica.");
      });
  }
}, [navigate]);


  // 🔹 Scroll automático al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Enviar mensaje al backend
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
      const response = await axios.post("http://localhost:5000/api/chat/chatbot", { 
        prompt: inputMessage.trim(),
        userId: user._id || user.id || user.userId,  // ✅ compatibilidad total
        sessionId: session.sessionId
      });



      const botMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          response.data.response || "No tengo respuesta por ahora, intenta de nuevo.",
        timestamp: new Date(),
        displayTime: formatTimestamp(new Date()),
      };

      // Mostrar ambos mensajes
      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {
      console.error("❌ Error al enviar mensaje:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          content: "Error al procesar tu mensaje.",
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

  // 🔹 Cerrar práctica (guarda endTime y genera resumen)
  const handleClosePractice = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/chat/practice/end", {
        sessionId: session.sessionId,
      });

      if (res.data.success) {
        const r = res.data.resumen;
        alert(
          `✅ Práctica finalizada\n\n🗣️ Idioma: ${r.idioma}\n📘 Nivel: ${r.nivel}\n🕒 Duración: ${r.duracion}\n💬 Mensajes: ${r.totalMensajes}`
        );
      }
    } catch (error) {
      console.error("❌ Error al finalizar práctica:", error);
      alert("No se pudo finalizar la práctica correctamente.");
    } finally {
      localStorage.removeItem("practiceSettings");
      navigate("/practiceSetup");
    }
  };

  return (
    <div className="assistant-layout">
      <header className="assistant-header">
        <div className="user-info">
          <h2>{user.nombre || "Usuario"}</h2>
          <p>{user.correo}</p>
        </div>
        <button className="logout-button" onClick={handleClosePractice}>
          Cerrar práctica
        </button>
      </header>

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

      <footer className="assistant-footer">
        <p className="footer-text">&copy; 2025 Thot IA - ChatBot Educativo.</p>
      </footer>
    </div>
  );
}

export default ChatBot;
