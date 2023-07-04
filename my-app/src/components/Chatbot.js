import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./chatbot.css";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef(null);

  const handleUserInput = async (event) => {
    event.preventDefault();

    const userInput = inputValue.trim();
    if (userInput === "") {
      return;
    }

    const newMessage = {
      content: userInput,
      sender: "user",
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputValue("");

    try {
      let botReply = "";

      if (userInput.toLowerCase().includes("option chain")) {
        botReply =
          "An option chain is a list of all the options available for a particular stock.";
      } else if (userInput.toLowerCase().includes("strike")) {
        botReply =
          "The strike price is the predetermined price at which the underlying asset of an option can be bought or sold when the option is exercised";
      } else if (userInput.toLowerCase().includes("expiration date")) {
        botReply =
          "The expiration date, also known as the expiry date, is the date on which an options contract expires and becomes invalid";
      } else {
        botReply = await queryOpenAI(userInput);
      }

      const botResponse = {
        content: botReply,
        sender: "bot",
      };

      setMessages((prevMessages) => [...prevMessages, botResponse]);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const queryOpenAI = async (prompt) => {
    try {
      console.log("Sending API request...");
      const response = await axios.post(
        "https://api.openai.com/v1/engines/davinci/completions",
        {
          prompt: prompt,
          max_tokens: 50,
          temperature: 0.2,
          n: 1,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer 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`,
          },
        }
      );
      console.log("API response received:", response.data);

      return response.data.choices[0].text.trim();
    } catch (error) {
      console.error("Error:", error);
      return "Sorry, I am currently unable to provide a response.";
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the chat container
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);

  const toggleChatbotPopup = () => {
    const popup = document.getElementById("chatbotPopup");
    popup.style.display = popup.style.display === "block" ? "none" : "block";
  };

  return(
    <div>    
      <div className="chatbot-icon" onClick={toggleChatbotPopup}>
        <img
          src="https://media.istockphoto.com/id/1147779501/vector/chatbot-icon-with-virtual-support-service-bot-or-online-artificial-intelligence-robot.jpg?s=170667a&w=0&k=20&c=aKF6-H0ZqA7tZ_DiLJeiW_YiWI5O5ugDAuB785ShJe8="
          alt="Chatbot Icon"
        />
      </div>

      <div
        className={`chatbot-popup ${inputValue ? "user-input" : ""}`}
        id="chatbotPopup"
      >
        <div className="chatbot-container">
          <h1 style={{ fontSize: "13px" , color: "black"}}>CHATBOT</h1>
          <div className="chat-container" ref={chatContainerRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${
                  message.sender === "user" ? "user" : "bot"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
          <form onSubmit={handleUserInput}>
            <input
              type="text"
              placeholder="Enter your message"
              style={{ opacity: 0.6 }}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}