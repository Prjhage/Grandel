import React, { useState, useEffect, useRef } from 'react';
import axios from '../config/axios';
import './Chatbot.css';

const Chatbot = ({ currUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: 'bot',
            text: "👋 Hi! I'm your Grandel Assistant. Ask me anything about finding your perfect stay, bookings, or travel tips! 🏖️"
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    const handleSendMessage = async () => {
        const message = inputValue.trim();
        if (!message) return;

        // Add user message
        setMessages(prev => [...prev, { sender: 'user', text: message }]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await axios.post('/api/chatbot/chat', { message });
            setIsTyping(false);

            // Add bot response
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

    return (
        <>
            {/* Chatbot Container */}
            {isOpen && (
                <div className="chatbot-container">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-title">
                            <span className="chatbot-icon">🏡</span>
                            <h4>Grandel Assistant</h4>
                        </div>
                        <button className="chatbot-close" onClick={toggleChatbot}>
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.sender}-message`}>
                                <p>{msg.text}</p>
                            </div>
                        ))}

                        {/* Typing Indicator */}
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

                    {/* Input Area */}
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

            {/* Toggle Button */}
            {!isOpen && (
                <button className="chatbot-toggle" onClick={toggleChatbot}>
                    <span className="chatbot-toggle-icon">💬</span>
                </button>
            )}
        </>
    );
};

export default Chatbot;
