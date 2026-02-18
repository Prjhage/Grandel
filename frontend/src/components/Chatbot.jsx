import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import './Chatbot.css';

const QuickReserveForm = ({ data, onReserve }) => {
    const [rooms, setRooms] = useState([{ adults: 1, children: 0, infants: 0 }]);

    const addRoom = () => {
        if (rooms.length < (data.maxRooms || 10)) {
            setRooms([...rooms, { adults: 1, children: 0, infants: 0 }]);
        }
    };

    const removeRoom = (index) => {
        if (rooms.length > 1) {
            setRooms(rooms.filter((_, i) => i !== index));
        }
    };

    const updateGuestCount = (index, delta) => {
        const newRooms = [...rooms];
        const newCount = Math.max(1, Math.min(data.maxGuests || 5, newRooms[index].adults + delta));
        newRooms[index].adults = newCount;
        setRooms(newRooms);
    };

    const totalPrice = data.price * rooms.length;

    return (
        <div className="quick-reserve-form mt-3 p-3 bg-white rounded-4 shadow-sm border">
            <h6 className="fw-bold mb-3">Book {data.title}</h6>
            <div className="rooms-container d-flex flex-column gap-3">
                {rooms.map((room, index) => (
                    <div key={index} className="room-item p-2 border rounded-3 position-relative">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small fw-bold">Room {index + 1}</span>
                            {rooms.length > 1 && (
                                <button className="btn-close-small" onClick={() => removeRoom(index)}>✕</button>
                            )}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="small text-muted">Guests</span>
                            <div className="d-flex align-items-center gap-2">
                                <button className="btn btn-sm btn-light p-0 border" onClick={() => updateGuestCount(index, -1)}>−</button>
                                <span className="fw-bold small">{room.adults}</span>
                                <button className="btn btn-sm btn-light p-0 border" onClick={() => updateGuestCount(index, 1)}>+</button>
                            </div>
                        </div>
                    </div>
                ))}

                <button className="btn btn-sm btn-outline-dark rounded-pill py-1 fs-xs" onClick={addRoom}>
                    + Add Room
                </button>
            </div>

            <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-baseline">
                <span className="fw-bold small">Total Price:</span>
                <span className="fs-6 fw-bold text-success">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            <button
                className="btn btn-dark w-100 rounded-pill mt-2 fw-bold"
                onClick={() => onReserve(rooms)}
            >
                RESERVE NOW
            </button>
        </div>
    );
};

const Chatbot = ({ currUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const isHomePage = location.pathname === '/';

    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: "👋 Hi! I'm your Grandel Assistant. Ask me anything about finding your perfect stay, bookings, or travel tips! 🏖️"
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [openReserveIndices, setOpenReserveIndices] = useState([]);
    const [showHint, setShowHint] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const timer = setTimeout(() => setShowHint(true), 3000);
        const hideTimer = setTimeout(() => setShowHint(false), 11000);
        return () => {
            clearTimeout(timer);
            clearTimeout(hideTimer);
        };
    }, []);

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    const toggleReserveForm = (index) => {
        setOpenReserveIndices(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const parseMessage = (text) => {
        const regex = /\[RESERVE:(.*?)\]/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                const content = text.substring(lastIndex, match.index);
                if (content.trim()) {
                    parts.push({ type: 'text', content: content });
                }
            }
            try {
                const data = JSON.parse(match[1]);
                parts.push({ type: 'reserve', data });
            } catch (e) {
                console.error("Failed to parse reserve data", e);
            }
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            const content = text.substring(lastIndex);
            if (content.trim()) {
                parts.push({ type: 'text', content: content });
            }
        }

        return parts.length > 0 ? parts : [{ type: 'text', content: text }];
    };

    const handleReserve = (listingId, roomsData) => {
        const params = new URLSearchParams({
            roomsData: JSON.stringify(roomsData),
            animals: 0
        });
        navigate(`/listings/${listingId}/book?${params.toString()}`);
        setIsOpen(false);
    };

    const handleSendMessage = async () => {
        const message = inputValue.trim();
        if (!message) return;

        setMessages(prev => [...prev, { sender: 'user', text: message }]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await axios.post('/api/chatbot/chat', { message });
            setIsTyping(false);
            setMessages(prev => [...prev, { sender: 'bot', text: response.data.reply }]);
        } catch (error) {
            console.error('Chat error:', error);
            setIsTyping(false);
            setMessages(prev => [
                ...prev,
                { sender: 'bot', text: "Sorry, I couldn't process that. Please try again! 😊" }
            ]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!currUser) return null;

    return (
        <>
            {isOpen && (
                <div className="chatbot-container">
                    <div className="chatbot-header">
                        <div className="chatbot-title">
                            <i className="fa-solid fa-robot chatbot-header-icon"></i>
                            <h4>Grandel Assistant</h4>
                        </div>
                        <button className="chatbot-close" onClick={toggleChatbot}>✕</button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => {
                            const parts = parseMessage(msg.text);

                            return (
                                <div key={index} className={`chat-message ${msg.sender}-message`}>
                                    <div className="message-content">
                                        {parts.map((part, partIndex) => {
                                            if (part.type === 'text') {
                                                return <p key={partIndex} className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{part.content}</p>;
                                            } else if (part.type === 'reserve') {
                                                // Unique key for the form visibility state using message index and part index
                                                const uniqueId = `${index}-${partIndex}`;
                                                const isFormOpen = openReserveIndices.includes(uniqueId);

                                                return (
                                                    <div key={partIndex} className="reserve-trigger-container mt-2 mb-2">
                                                        {!isFormOpen ? (
                                                            <button
                                                                className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm reserve-trigger-btn"
                                                                onClick={() => toggleReserveForm(uniqueId)}
                                                            >
                                                                <i className="fa-solid fa-calendar-check me-1"></i> Reserve {part.data.title}
                                                            </button>
                                                        ) : (
                                                            <QuickReserveForm
                                                                data={part.data}
                                                                onReserve={(roomsData) => handleReserve(part.data.id, roomsData)}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {isTyping && (
                            <div className="chat-message bot-message typing">
                                <div className="typing-indicator">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chatbot-input-area">
                        <input
                            type="text"
                            className="chatbot-input"
                            placeholder="Ask me something..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button className="chatbot-send-btn" onClick={handleSendMessage}>
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            )}

            {!isOpen && (
                <div className={`chatbot-toggle-wrapper ${isHomePage ? 'home-theme' : ''}`}>
                    {showHint && (
                        <div className="chatbot-hint-bubble">
                            Any questions? 👋
                        </div>
                    )}
                    <button
                        className="chatbot-toggle-btn"
                        onClick={() => {
                            toggleChatbot();
                            setShowHint(false);
                        }}
                    >
                        <i className="fa-solid fa-comment-dots"></i>
                        <span className="pulse-ring"></span>
                    </button>
                </div>
            )}
        </>
    );
};

export default Chatbot;
