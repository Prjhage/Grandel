import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import "./AdvancedSearchBar.css";

const AdvancedSearchBar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    rooms: searchParams.get("rooms") || "1",
    guests: searchParams.get("guests") || "1",
    lat: searchParams.get("lat") || "",
    lng: searchParams.get("lng") || "",
  });

  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const placeholders = [
    "Search by city",
    "Search by hotel",
    "Search by country",
  ];

  // Placeholder animation interval
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Body scroll lock when mobile modal is open
  useEffect(() => {
    if (isMobileModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileModalOpen]);

  // Synchronize filters with URL changes (e.g. when clicking back button or "Clear all")
  useEffect(() => {
    setFilters({
      q: searchParams.get("q") || "",
      startDate: searchParams.get("startDate") || "",
      endDate: searchParams.get("endDate") || "",
      rooms: searchParams.get("rooms") || "1",
      guests: searchParams.get("guests") || "1",
      lat: searchParams.get("lat") || "",
      lng: searchParams.get("lng") || "",
    });
  }, [searchParams]);

  // Close dropdowns on outside click (Desktop only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-section")) {
        setIsGuestDropdownOpen(false);
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const newState = { ...prev, [field]: value };
      if (field === "q" && value !== "Current Location") {
        newState.lat = "";
        newState.lng = "";
      }
      return newState;
    });
  };

  const handleDateSelect = (dateStr) => {
    if (!filters.startDate || (filters.startDate && filters.endDate)) {
      setFilters((prev) => ({ ...prev, startDate: dateStr, endDate: "" }));
    } else {
      const start = new Date(filters.startDate);
      const selected = new Date(dateStr);
      if (selected < start) {
        setFilters((prev) => ({ ...prev, startDate: dateStr, endDate: "" }));
      } else {
        setFilters((prev) => ({ ...prev, endDate: dateStr }));
        // Close calendar after selection (only on desktop or if user wants)
        if (window.innerWidth >= 768) {
          setTimeout(() => setIsCalendarOpen(false), 500);
        }
      }
    }
  };

  const executeSearch = () => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.lat) params.set("lat", filters.lat);
    if (filters.lng) params.set("lng", filters.lng);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.rooms > 0) params.set("rooms", filters.rooms);
    if (filters.guests > 0) params.set("guests", filters.guests);

    // Preserve sort if existing
    const currentSort = searchParams.get("sort");
    if (currentSort) params.set("sort", currentSort);

    setIsMobileModalOpen(false); // Close on search

    if (location.pathname !== "/listings") {
      navigate(`/listings?${params.toString()}`, { replace: true });
    } else {
      setSearchParams(params, { replace: true });
    }
  };

  const clearAllFilters = (e) => {
    if (e) e.stopPropagation();

    // Reset local state immediately for fast feedback
    setFilters({
      q: "",
      startDate: "",
      endDate: "",
      rooms: "1",
      guests: "1",
      lat: "",
      lng: "",
    });

    // If on listings page, also clear URL params to trigger new results
    if (location.pathname === "/listings") {
      setSearchParams(new URLSearchParams(), { replace: true });
    }
  };

  const formatDateRange = (start, end) => {
    if (!start) return "Add dates";
    const s = new Date(start);
    const options = { month: "short", day: "numeric" };
    if (!end) return `${s.toLocaleDateString("en-US", options)} - Add date`;
    const e = new Date(end);
    return `${s.toLocaleDateString("en-US", options)} - ${e.toLocaleDateString("en-US", { day: "numeric", month: s.getMonth() === e.getMonth() ? undefined : "short" })}`;
  };

  // Calendar Component Logic
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const renderMonth = (monthOffset) => {
    const date = new Date(viewYear, viewMonth + monthOffset, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthName = date.toLocaleString("en-US", { month: "long" });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Lead-in empty days
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isStart = filters.startDate === dateStr;
      const isEnd = filters.endDate === dateStr;
      const isInRange =
        filters.startDate &&
        filters.endDate &&
        dateStr > filters.startDate &&
        dateStr < filters.endDate;
      const isSelected = isStart || isEnd;
      const isPast =
        new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));

      days.push(
        <div
          key={dateStr}
          className={`calendar-day ${isSelected ? "selected" : ""} ${isInRange ? "in-range" : ""} ${isStart ? "range-start" : ""} ${isEnd ? "range-end" : ""} ${isPast ? "disabled" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isPast) handleDateSelect(dateStr);
          }}
        >
          <span className="day-number">{d}</span>
        </div>,
      );
    }

    // Fill trailing empty days to keep the grid even (optional, but good for some layouts)
    const totalCells = days.length;
    const trailingEmpty = (7 - (totalCells % 7)) % 7;
    for (let j = 0; j < trailingEmpty; j++) {
      days.push(
        <div key={`trailing-${j}`} className="calendar-day empty"></div>,
      );
    }

    return (
      <div className="calendar-month">
        <div className="calendar-month-header">
          {monthName} {year}
        </div>
        <div className="calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="calendar-weekday">
              {d}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Trigger */}
      <div
        className="mobile-search-trigger"
        onClick={() => setIsMobileModalOpen(true)}
      >
        <i className="fa-solid fa-magnifying-glass"></i>
        <div className="trigger-text">
          <span className="main-text">Where to?</span>
          <span className="sub-text">Anywhere • Any week • Add guests</span>
        </div>
        <div className="trigger-filter-icon">
          <i className="fa-solid fa-sliders"></i>
        </div>
      </div>

      {/* Desktop Search Bar */}
      <div className="advanced-search-bar desktop-only">
        <div className="search-section location-section">
          <div className="d-flex justify-content-between align-items-center mb-0">
            <label className="mb-0">Location</label>
            <button
              className="btn-near-me"
              title="Use current location"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.geolocation) {
                  const originalQ = filters.q;
                  handleFilterChange("q", "Fetching location...");
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      const newFilters = {
                        ...filters,
                        q: "Current Location",
                        lat: latitude,
                        lng: longitude,
                      };
                      setFilters(newFilters);
                      const params = new URLSearchParams(searchParams);
                      params.set("q", "Current Location");
                      params.set("lat", latitude);
                      params.set("lng", longitude);
                      if (location.pathname === "/listings")
                        setSearchParams(params, { replace: true });
                      else
                        navigate(`/listings?${params.toString()}`, {
                          replace: true,
                        });
                    },
                    (error) => {
                      handleFilterChange("q", originalQ);
                      alert("Unable to retrieve location.");
                    },
                  );
                }
              }}
            >
              <i className="fa-solid fa-location-crosshairs me-1"></i>
              <span>Near me</span>
            </button>
          </div>
          <div className="position-relative d-flex align-items-center">
            <div className="search-input-container">
              <input
                type="text"
                value={filters.q}
                onChange={(e) => handleFilterChange("q", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executeSearch()}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                autoComplete="off"
              />
              {!filters.q && !isInputFocused && (
                <div className="animated-placeholder-container">
                  {placeholders.map((text, idx) => (
                    <div
                      key={idx}
                      className={`placeholder-text ${idx === placeholderIndex ? "active" : ""} ${idx === (placeholderIndex === 0 ? placeholders.length - 1 : placeholderIndex - 1) ? "exit" : ""}`}
                    >
                      {text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="search-divider"></div>

        <div
          className="search-section date-section"
          onClick={(e) => {
            e.stopPropagation();
            setIsCalendarOpen(!isCalendarOpen);
            setIsGuestDropdownOpen(false);
          }}
        >
          <label>Check In - Check Out</label>
          <div className="date-summary-text text-truncate">
            {formatDateRange(filters.startDate, filters.endDate)}
          </div>

          {isCalendarOpen && (
            <div
              className="calendar-dropdown shadow-lg p-4 rounded-4 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="calendar-main-container">
                <button
                  className="calendar-nav-btn nav-prev"
                  onClick={() => setViewMonth(viewMonth - 1)}
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <div className="calendar-months-container">
                  {renderMonth(0)}
                  <div className="month-divider d-none d-md-block"></div>
                  {renderMonth(1)}
                </div>
                <button
                  className="calendar-nav-btn nav-next"
                  onClick={() => setViewMonth(viewMonth + 1)}
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
              <div className="d-flex justify-content-end mt-3 gap-3 align-items-center">
                <button
                  className="btn btn-link btn-sm text-muted text-decoration-none fw-600 p-0"
                  onClick={() =>
                    setFilters((p) => ({ ...p, startDate: "", endDate: "" }))
                  }
                >
                  Clear Dates
                </button>
                <button
                  className="btn btn-dark btn-sm px-4 rounded-pill fw-600"
                  onClick={() => setIsCalendarOpen(false)}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="search-divider"></div>

        <div
          className="search-section guest-section"
          onClick={(e) => {
            e.stopPropagation();
            setIsGuestDropdownOpen(!isGuestDropdownOpen);
            setIsCalendarOpen(false);
          }}
        >
          <label>Guests & Rooms</label>
          <div className="guest-summary-text text-truncate">
            {filters.rooms} Room, {filters.guests} Guest
          </div>

          {isGuestDropdownOpen && (
            <div
              className="guest-picker-dropdown shadow-lg p-3 rounded-4 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Rooms</span>
                <div className="picker-counter">
                  <button
                    onClick={() =>
                      handleFilterChange(
                        "rooms",
                        Math.max(1, parseInt(filters.rooms) - 1),
                      )
                    }
                  >
                    -
                  </button>
                  <span>{filters.rooms}</span>
                  <button
                    onClick={() =>
                      handleFilterChange("rooms", parseInt(filters.rooms) + 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Guests</span>
                <div className="picker-counter">
                  <button
                    onClick={() =>
                      handleFilterChange(
                        "guests",
                        Math.max(1, parseInt(filters.guests) - 1),
                      )
                    }
                  >
                    -
                  </button>
                  <span>{filters.guests}</span>
                  <button
                    onClick={() =>
                      handleFilterChange("guests", parseInt(filters.guests) + 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                className="btn btn-dark btn-sm w-100 mt-3"
                onClick={() => setIsGuestDropdownOpen(false)}
              >
                Done
              </button>
            </div>
          )}
        </div>

        {Object.values(filters).some((v) => v !== "" && v !== "1") && (
          <button
            className="btn-clear-inline"
            onClick={(e) => clearAllFilters(e)}
            title="Clear all filters"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}

        <button className="search-action-btn" onClick={executeSearch}>
          <i className="fa-solid fa-magnifying-glass me-2"></i>
          <span>Search</span>
        </button>
      </div>

      {isMobileModalOpen &&
        createPortal(
          <div className="mobile-search-overlay">
            <div className="overlay-header">
              <button
                className="btn-close-overlay"
                onClick={() => setIsMobileModalOpen(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
              <div className="overlay-tabs">
                <span className="active">Stays</span>
              </div>
            </div>

            <div className="overlay-content">
              {/* Location Section */}
              <div className="mobile-filter-card">
                <h5 className="mb-3 fw-bold">Where to?</h5>
                <div className="position-relative d-flex align-items-center mb-3">
                  <div className="search-input-container">
                    <input
                      type="text"
                      className="form-control rounded-4 py-3"
                      value={filters.q}
                      onChange={(e) => handleFilterChange("q", e.target.value)}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      autoComplete="off"
                    />
                    {!filters.q && !isInputFocused && (
                      <div className="animated-placeholder-container ps-3">
                        {placeholders.map((text, idx) => (
                          <div
                            key={idx}
                            className={`placeholder-text ${idx === placeholderIndex ? "active" : ""} ${idx === (placeholderIndex === 0 ? placeholders.length - 1 : placeholderIndex - 1) ? "exit" : ""}`}
                          >
                            {text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-light w-100 rounded-pill py-2 border d-flex align-items-center justify-content-center gap-2"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((position) => {
                        const { latitude, longitude } = position.coords;
                        handleFilterChange("q", "Current Location");
                        setFilters((prev) => ({
                          ...prev,
                          lat: latitude,
                          lng: longitude,
                        }));
                      });
                    }
                  }}
                >
                  <i className="fa-solid fa-location-crosshairs"></i>
                  Use current location
                </button>
              </div>

              {/* Date Section */}
              <div className="mobile-filter-card mt-3">
                <h5 className="mb-3 fw-bold">When?</h5>
                <div className="mobile-calendar-wrapper">
                  <button
                    className="calendar-nav-btn nav-prev"
                    onClick={() => setViewMonth(viewMonth - 1)}
                  >
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  {renderMonth(0)}
                  <div className="mt-4">{renderMonth(1)}</div>
                  <button
                    className="calendar-nav-btn nav-next"
                    onClick={() => setViewMonth(viewMonth + 1)}
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              </div>

              {/* Guest Section */}
              <div className="mobile-filter-card mt-3">
                <h5 className="mb-3 fw-bold">Who?</h5>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div className="fw-semibold">Rooms</div>
                    <div className="text-muted small">Minimum 1</div>
                  </div>
                  <div className="picker-counter">
                    <button
                      onClick={() =>
                        handleFilterChange(
                          "rooms",
                          Math.max(1, parseInt(filters.rooms) - 1),
                        )
                      }
                    >
                      -
                    </button>
                    <span>{filters.rooms}</span>
                    <button
                      onClick={() =>
                        handleFilterChange("rooms", parseInt(filters.rooms) + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">Guests</div>
                    <div className="text-muted small">Ages 13 or above</div>
                  </div>
                  <div className="picker-counter">
                    <button
                      onClick={() =>
                        handleFilterChange(
                          "guests",
                          Math.max(1, parseInt(filters.guests) - 1),
                        )
                      }
                    >
                      -
                    </button>
                    <span>{filters.guests}</span>
                    <button
                      onClick={() =>
                        handleFilterChange(
                          "guests",
                          parseInt(filters.guests) + 1,
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="overlay-footer">
              <button
                className="btn-clear-all"
                onClick={(e) => clearAllFilters(e)}
              >
                Clear all
              </button>
              <button className="btn-mobile-search" onClick={executeSearch}>
                <i className="fa-solid fa-magnifying-glass me-2"></i>
                SEARCH
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default AdvancedSearchBar;
