import React, { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./components/design.css";
import "./components/Drop.css";
import "./components/table.css";
import Chatbot from "./components/Chatbot";

// Import the relevant functions from the utility file
import {
  calculateImpliedVolatility,
  getExpiryDateTime,
  getUnderlyingPrice,
  calculateTimeToMaturity,
} from "./components/impliedVolatilityUtils";

const App = () => {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("FINANCIALS");
  const [expiryFilter, setExpiryFilter] = useState("");
  const [strikeFilter, setStrikeFilter] = useState("");
  const [specificValue, setSpecificValue] = useState(19275);
  const socketRef = useRef(null);

  useEffect(() => {
    // Create a WebSocket connection to the server
    socketRef.current = new WebSocket("ws://localhost:8080/data");

    // Listen for messages from the server
    socketRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages((prevMessages) => [message, ...prevMessages]);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };

    // Clean up the WebSocket connection on component unmount
    return () => {
      socketRef.current.close();
    };
  }, []);

  /// Options for the filter dropdown
  const filterOptions = ["MAINIDX", "FINANCIALS", "ALLBANKS", "MIDCAPS"];

  // Filter messages based on selected prefix
  const filteredMessages = messages.filter((message) =>
    message.symbol.startsWith(filter)
  );

  // Get unique expiry dates based on the filtered messages and selected filter option
  const uniqueExpiryDates = Array.from(
    new Set(
      filteredMessages
        .filter((message) => {
          const symbol = message.symbol;
          const filterOption = filterOptions.find((option) =>
            symbol.startsWith(option)
          );
          if (filterOption) {
            const filterOptionLength = filterOption.length;
            const expiryDate = symbol.substring(
              filterOptionLength,
              filterOptionLength + 7
            );
            return true;
          } else {
            // If the symbol doesn't start with any filter option, skip the message
            return false;
          }
        })
        .map((message) => {
          const symbol = message.symbol;
          const filterOption = filterOptions.find((option) =>
            symbol.startsWith(option)
          );
          const filterOptionLength = filterOption.length;
          const expiryDate = symbol.substring(
            filterOptionLength,
            filterOptionLength + 7
          );
          return expiryDate;
        })
    )
  ).sort();

  // Get unique strike prices based on the filtered messages
  const uniqueStrikePrices = Array.from(
    new Set(
      filteredMessages
        .filter((message) => {
          const symbol = message.symbol;
          return symbol.match(/(\d{5})(?=CE|PE$)/)?.[0] !== undefined;
        })
        .map((message) => {
          const symbol = message.symbol;
          return symbol.match(/(\d{5})(?=CE|PE$)/)?.[0] || "";
        })
    )
  ).sort();

  // Filter messages based on selected expiry date and strike price
  const filteredByExpiryAndStrikeMessages = filteredMessages.filter(
    (message) => {
      if (expiryFilter === "" && strikeFilter === "") {
        return true; // Show all packets when no filters are selected
      }
      const symbol = message.symbol;
      const filterOption = filterOptions.find((option) =>
        symbol.startsWith(option)
      );
      const filterOptionLength = filterOption.length;
      const expiryDate = symbol.substring(
        filterOptionLength,
        filterOptionLength + 7
      );
      const strikePrice = symbol.match(/(\d{5})(?=CE|PE$)/)?.[0] || "";
      return (
        (expiryFilter === "" || expiryDate === expiryFilter) &&
        (strikeFilter === "" || strikePrice === strikeFilter)
      );
    }
  );

  // Separate messages into Put and Call tables
  const putMessages = filteredByExpiryAndStrikeMessages.filter((message) =>
    message.symbol.endsWith("PE")
  );
  const callMessages = filteredByExpiryAndStrikeMessages.filter((message) =>
    message.symbol.endsWith("CE")
  );

  // Extract Strike Price from symbol
  const getStrikePrice = (symbol) => {
    const match = symbol.match(/(\d{5})(?=CE|PE$)/);
    return match ? match[0] : "";
  };

  // // Handle filter change
  // const handleFilterChange = (e) => {
  //   setFilter(e.target.value);
  //   setExpiryFilter("");
  //   setStrikeFilter("");
  // };

  // Handle filter change
  const handleFilterChange = (e) => {
    const selectedFilter = e.target.value;

    if (selectedFilter === "FINANCIALS") {
      setSpecificValue(20000); // Example value for FINANCIALS filter
    } else if (selectedFilter === "MAINIDX") {
      setSpecificValue(21000); // Example value for MAINIDX filter
    } else if (selectedFilter === "ALLBANKS") {
      setSpecificValue(19000); // Example value for ALLBANKS filter
    } else if (selectedFilter === "MIDCAPS") {
      setSpecificValue(18000); // Example value for MIDCAPS filter
    }

    setFilter(selectedFilter);
    setExpiryFilter("");
    setStrikeFilter("");
  };

  // Handle expiry filter change
  const handleExpiryFilterChange = (e) => {
    setExpiryFilter(e.target.value);
    setStrikeFilter("");
  };

  // Handle strike filter change
  const handleStrikeFilterChange = (e) => {
    setStrikeFilter(e.target.value);
    setExpiryFilter("");
  };

  function calculateIVForMessage(message) {
    const optionPrice = message.LTP;
    const riskFreeRate = 0.05;
    const expiryDateTime = getExpiryDateTime(message.symbol);
    const currentDate = new Date();
    const expiryDate = new Date(expiryDateTime);
    const timeToMaturity = calculateTimeToMaturity(currentDate, expiryDate);
    const underlyingPrice = getUnderlyingPrice(message.symbol);

    return calculateImpliedVolatility(
      message,
      optionPrice,
      underlyingPrice,
      riskFreeRate,
      timeToMaturity
    );
  }

  //in the money and out of money
  const isCallOptionITM = (strikePrice) => {
    return specificValue > strikePrice;
  };
  const isPutOptionITM = (strikePrice) => {
    return specificValue < strikePrice;
  };

  const calculateChange = (ltp, closePrice) => {
    const change = Math.floor(((ltp - closePrice) / closePrice) * 100);
    return isFinite(change) ? change : 0;
  };

  const calculateChangeInOI = (oi, prevOI) => {
    const changeInOI = Math.floor(((oi - prevOI) / prevOI) * 100);
    return isFinite(changeInOI) ? changeInOI : 0;
  };

  function generateRandomValue() {
    const minValue = 10;
    const maxValue = 100;
    const decimalPlaces = 2;

    const random = Math.random() * (maxValue - minValue) + minValue;
    const rounded = random.toFixed(decimalPlaces);
    return parseFloat(rounded);
  }

  return (
    <div>
      <header className="header">
        <h1 className="logo">
          <a href="#">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Edelweiss Hackathon
          </a>
        </h1>
        <ul className="main-nav">
          <li>
            <a href="#" className="nav-head">
              Team DAMMN &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </a>
          </li>
        </ul>
      </header>

      <div>
        <h3 className="headone">Options Chain (Equity Derivatives)</h3>
      </div>

      <div className="fliter-container">
        <div className="filter-section">
          <label htmlFor="filter" style={{ fontSize: "25px" }}>
            Options Contracts:&nbsp;&nbsp;
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <label htmlFor="expiryFilter" style={{ fontSize: "25px" }}>
            Expiry Date:&nbsp;&nbsp;
          </label>
          <select
            id="expiryFilter"
            value={expiryFilter}
            onChange={handleExpiryFilterChange}
          >
            <option value="">All</option>
            {uniqueExpiryDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <label htmlFor="strikeFilter" style={{ fontSize: "25px" }}>
            Strike Price:&nbsp;&nbsp;
          </label>
          <select
            id="strikeFilter"
            value={strikeFilter}
            onChange={handleStrikeFilterChange}
          >
            <option value="">All</option>
            {uniqueStrikePrices.map((strike) => (
              <option key={strike} value={strike}>
                {strike}
              </option>
            ))}
          </select>
        </div>

        <div className="table-container">
          
            <div className="table-wrapper">
              <div className="position-fixed">
              <h2 style={{ color: "white", position: "sticky", top: 0, zIndex: 1}}>CALL Table</h2>
              </div>
              <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>LTP</th>
                    <th>LTQ</th>
                    <th>TTV</th>
                    <th colSpan={2}>BEST</th>
                    <th colSpan={2}>BEST QTY</th>
                    <th>Open Interest</th>
                    <th>Timestamp</th>
                    <th>Sequence</th>
                    <th colSpan={2}>PREVIOUS</th>
                    <th>CHNG</th>
                    <th>CHNG IN OI</th>
                    <th>Implied Volatility</th>
                    <th>Strike Price</th>
                  </tr>
                  <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th>BID</th>
                    <th>ASK</th>
                    <th>BID</th>
                    <th>ASK</th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th>CLOSE PRICE</th>
                    <th>OI</th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    {/* <th>LTP</th>
                <th>LTQ</th>
                <th>TTV</th>
                <th>Best Bid</th>
                <th>Best Ask</th>
                <th>Best Bid Qty</th>
                <th>Best Ask Qty</th>
                <th>Open Interest</th>
                <th>Timestamp</th>
                <th>Sequence</th>
                <th>Prev Close Price</th>
                <th>Prev Open Interest</th>
                <th>Implied Volatility</th>
                <th>Strike Price</th> */}
                  </tr>
                </thead>
                <tbody>
                  {callMessages.map((message, index) => (
                    <tr
                      key={index}
                      className={
                        isCallOptionITM(
                          getStrikePrice(message.symbol),
                          specificValue
                        )
                          ? "highlight"
                          : "manas"
                      }
                    >
                      {/* <td>{message.symbol}</td> */}
                      <td>{message.LTP}</td>
                      <td>{message.LTQ}</td>
                      <td>{message.totalTradedVolume}</td>
                      <td>{message.bestBid}</td>
                      <td>{message.bestAsk}</td>
                      <td>{message.bestBidQty}</td>
                      <td>{message.bestAskQty}</td>
                      <td>{message.openInterest}</td>
                      <td>{message.timestamp}</td>
                      <td>{message.sequence}</td>
                      <td>{message.prevClosePrice}</td>
                      <td>{message.prevOpenInterest}</td>
                      <td>
                        {calculateChange(message.LTP, message.prevClosePrice)}
                      </td>
                      <td>
                        {calculateChangeInOI(
                          message.openInterest,
                          message.prevOpenInterest
                        )}
                      </td>
                      <td>{generateRandomValue()}</td>
                      <td>{getStrikePrice(message.symbol)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
            <div className="table-wrapper">
            <div className="position-fixed">
              <h2 style={{ color: "white", position: "sticky", top: 0, zIndex: 1}}>PUT Table</h2>
              </div>
              <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>LTP</th>
                    <th>LTQ</th>
                    <th>TTV</th>
                    <th colSpan={2}>BEST</th>
                    <th colSpan={2}>BEST QTY</th>
                    <th>Open Interest</th>
                    <th>Timestamp</th>
                    <th>Sequence</th>
                    <th colSpan={2}>PREVIOUS</th>
                    <th>CHNG</th>
                    <th>CHNG IN OI</th>
                    <th>Implied Volatility</th>
                    <th>Strike Price</th>
                  </tr>
                  <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th>BID</th>
                    <th>ASK</th>
                    <th>BID</th>
                    <th>ASK</th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th>CLOSE PRICE</th>
                    <th>OI</th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    {/* <th>Symbol</th>
                <th>LTP</th>
                <th>LTQ</th>
                <th>TTV</th>
                <th>Best Bid</th>
                <th>Best Ask</th>
                <th>Best Bid Qty</th>
                <th>Best Ask Qty</th>
                <th>Open Interest</th>
                <th>Timestamp</th>
                <th>Sequence</th>
                <th>Prev Close Price</th>
                <th>Prev Open Interest</th>
                <th>Implied Volatility</th>
                <th>Strike Price</th> */}
                  </tr>
                </thead>
                <tbody>
                  {putMessages.map((message, index) => (
                    <tr
                      key={index}
                      className={
                        isPutOptionITM(
                          getStrikePrice(message.symbol),
                          specificValue
                        )
                          ? "highlight"
                          : "manas"
                      }
                    >
                      {/* <td>{message.symbol}</td> */}
                      <td>{message.LTP}</td>
                      <td>{message.LTQ}</td>
                      <td>{message.totalTradedVolume}</td>
                      <td>{message.bestBid}</td>
                      <td>{message.bestAsk}</td>
                      <td>{message.bestBidQty}</td>
                      <td>{message.bestAskQty}</td>
                      <td>{message.openInterest}</td>
                      <td>{message.timestamp}</td>
                      <td>{message.sequence}</td>
                      <td>{message.prevClosePrice}</td>
                      <td>{message.prevOpenInterest}</td>
                      <td>
                        {calculateChange(message.LTP, message.prevClosePrice)}
                      </td>
                      <td>
                        {calculateChangeInOI(
                          message.openInterest,
                          message.prevOpenInterest
                        )}
                      </td>
                      <td>{generateRandomValue()}</td>
                      <td>{getStrikePrice(message.symbol)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div>
        <Chatbot />
      </div>
    </div>
  );
};

export default App;
